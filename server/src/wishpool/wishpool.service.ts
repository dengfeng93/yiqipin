import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(WishpoolService.name);

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

  async addOne(userId: string, categoryId: string, lat: number, lng: number, title?: string) {
    const existing = await this.wishRepo.findOne({
      where: { user_id: userId, category_id: categoryId, status: WishStatus.WAITING },
    });
    if (existing) return { duplicate: true, wish_id: existing.id };

    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    const wish = this.wishRepo.create({
      user_id: userId,
      category_id: categoryId,
      lat,
      lng,
      title: title || (category ? `想去${category.name}` : '心愿'),
      location: locationToPoint(lat, lng),
    });
    try {
      await this.wishRepo.save(wish);
    } catch (e: any) {
      if (e.code === '23505') return { duplicate: true, wish_id: null };
      throw e;
    }

    this.checkThreshold(categoryId, lat, lng).catch((err) => {
      this.logger.warn(`checkThreshold failed for category ${categoryId}`, err);
    });
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
    const result = await this.wishRepo.update(
      { id: wishId, user_id: userId, status: WishStatus.WAITING },
      { status: WishStatus.EXPIRED } as any,
    );
    if (result.affected === 0) throw new NotFoundException('心愿不存在或无法取消');
    return { cancelled: true };
  }

  private async checkThreshold(categoryId: string, lat: number, lng: number) {
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!category) return;

    const lockKey = `wish-threshold:${categoryId}:${Math.round(lat * 100)}:${Math.round(lng * 100)}`;
    const token = await this.redis.lock(lockKey, 30000);
    if (!token) return;

    try {
      const point = locationToPoint(lat, lng);
      const count = await this.wishRepo.createQueryBuilder('w')
        .where(`ST_DWithin(w.location, ST_GeomFromText(:point, 0), 10000)`, { point })
        .andWhere('w.category_id = :cid', { cid: categoryId })
        .andWhere('w.status = :status', { status: WishStatus.WAITING })
        .getCount();

      if (count >= category.wish_threshold) {
        const point = locationToPoint(lat, lng);
        const firstWish = await this.wishRepo.createQueryBuilder('w')
          .where(`ST_DWithin(w.location, ST_GeomFromText(:point, 0), 10000)`, { point })
          .andWhere('w.category_id = :cid', { cid: categoryId })
          .andWhere('w.status = :status', { status: WishStatus.WAITING })
          .orderBy('w.created_at', 'ASC')
          .getOne();
        if (firstWish) {
          const circle = await this.circleService.create(firstWish.user_id, {
            category_id: categoryId,
            lat, lng,
            start_time: new Date(Date.now() + 2 * 3600000),
            title: `[心愿成局] ${category.name}`,
          } as any);

          await this.wishRepo.createQueryBuilder()
            .update()
            .set({ status: WishStatus.FULFILLED } as any)
            .where(`ST_DWithin(location, ST_GeomFromText(:point, 0), 10000)`, { point })
            .andWhere('category_id = :cid', { cid: categoryId })
            .andWhere('status = :status', { status: WishStatus.WAITING })
            .execute();

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
