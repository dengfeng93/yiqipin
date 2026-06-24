import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishItem, WishStatus } from './entities/wish-item.entity';
import { Category } from '../circle/entities/category.entity';
import { RedisService } from '../redis/redis.service';
import { CircleService } from '../circle/circle.service';
import { ChatGateway } from '../chat/chat.gateway';
import { locationToPoint } from '../common/utils/geo';

@Injectable()
export class WishpoolService {
  constructor(
    @InjectRepository(WishItem) private wishRepo: Repository<WishItem>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    private redis: RedisService,
    private circleService: CircleService,
    private chatGateway: ChatGateway,
  ) {}

  async listNearby(lat: number, lng: number, rangeKm: number = 10) {
    const point = locationToPoint(lat, lng);
    return this.wishRepo.createQueryBuilder('w')
      .where(`ST_DWithin(w.location, ST_GeomFromText(:point, 0), :range)`, { point, range: rangeKm * 1000 })
      .andWhere('w.status = :status', { status: WishStatus.WAITING })
      .leftJoin('categories', 'c', 'c.id = w.category_id')
      .select('w.category_id, c.name, c.icon, COUNT(*) as count')
      .groupBy('w.category_id, c.name, c.icon')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  async addOne(userId: string, categoryId: string, lat: number, lng: number) {
    const existing = await this.wishRepo.findOne({
      where: { user_id: userId, category_id: categoryId, status: WishStatus.WAITING },
    });
    if (existing) return { duplicate: true, wish_id: existing.id };

    const wish = this.wishRepo.create({
      user_id: userId,
      category_id: categoryId,
      location: locationToPoint(lat, lng),
    });
    await this.wishRepo.save(wish);

    await this.checkThreshold(categoryId, lat, lng);
    return { created: true, wish_id: wish.id };
  }

  async join(userId: string, wishId: string) {
    const [wish] = await this.wishRepo.query(
      `SELECT category_id, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lng
       FROM wish_items WHERE id = $1 AND status = 'waiting'`, [wishId],
    );
    if (!wish) throw new NotFoundException('心愿不存在或已过期');
    return this.addOne(userId, wish.category_id, parseFloat(wish.lat), parseFloat(wish.lng));
  }

  async cancel(userId: string, wishId: string) {
    await this.wishRepo.update({ id: wishId, user_id: userId }, { status: WishStatus.EXPIRED } as any);
    return { cancelled: true };
  }

  private async checkThreshold(categoryId: string, lat: number, lng: number) {
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!category) return;

    const lockKey = `wish-threshold:${categoryId}:${Math.round(lat * 100)}:${Math.round(lng * 100)}`;
    const token = await this.redis.lock(lockKey, 10000);
    if (!token) return;

    try {
      const point = locationToPoint(lat, lng);
      const count = await this.wishRepo.createQueryBuilder('w')
        .where(`ST_DWithin(w.location, ST_GeomFromText(:point, 0), 10000)`, { point })
        .andWhere('w.category_id = :cid', { cid: categoryId })
        .andWhere('w.status = :status', { status: WishStatus.WAITING })
        .getCount();

      if (count >= category.wish_threshold) {
        const firstWish = await this.wishRepo.findOne({
          where: { category_id: categoryId, status: WishStatus.WAITING },
          order: { created_at: 'ASC' },
        });
        if (firstWish) {
          const circle = await this.circleService.create(firstWish.user_id, {
            category_id: categoryId,
            lat, lng,
            start_time: new Date(Date.now() + 2 * 3600000),
            title: `[心愿成局] ${category.name}`,
          } as any);

          await this.wishRepo.update(
            { category_id: categoryId, status: WishStatus.WAITING },
            { status: WishStatus.FULFILLED } as any,
          );

          await this.chatGateway.broadcastSystem(circle.id, 'wish_fulfilled', {
            category_id: categoryId,
            category_name: category.name,
          });
        }
      }
    } finally {
      await this.redis.unlock(lockKey, token);
    }
  }
}
