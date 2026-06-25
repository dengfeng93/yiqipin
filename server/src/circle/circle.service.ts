import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Circle, CircleStatus, StartType, RestrictTag } from './entities/circle.entity';
import { CircleMember } from './entities/circle-member.entity';
import { Category } from './entities/category.entity';
import { WishItem } from '../wishpool/entities/wish-item.entity';
import { RedisService } from '../redis/redis.service';
import { ChatGateway } from '../chat/chat.gateway';
import { calculateDistance, locationToPoint } from '../common/utils/geo';
import { CreateCircleDto } from './dto/create-circle.dto';

@Injectable()
export class CircleService {
  private readonly logger = new Logger(CircleService.name);

  constructor(
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectRepository(CircleMember) private memberRepo: Repository<CircleMember>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(WishItem) private wishRepo: Repository<WishItem>,
    @InjectDataSource() private dataSource: DataSource,
    private redis: RedisService,
    private chatGateway: ChatGateway,
  ) {}

  async create(userId: string, dto: CreateCircleDto) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.category_id } });
    if (!category) throw new NotFoundException('活动类型不存在');

    const circle = await this.dataSource.transaction(async (manager) => {
      const circle = manager.create(Circle, {
        creator_id: userId,
        category_id: dto.category_id,
        title: dto.title || `${category.name}局`,
        description: dto.description,
        location: locationToPoint(dto.lat, dto.lng),
        address: dto.address,
        range_km: dto.range_km || 3,
        max_members: dto.max_members || category.default_max_members,
        start_time: dto.start_time || new Date(),
        start_type: dto.start_type || StartType.NOW,
        prep_time: dto.prep_time || 0,
        end_time: dto.end_time,
        restrict_tag: dto.restrict_tag || RestrictTag.ALL,
        group_rule: dto.group_rule,
        status: dto.prep_time && dto.prep_time > 0 ? CircleStatus.PREPARING : CircleStatus.ACTIVE,
      });
      await manager.save(circle);

      await manager.save(manager.create(CircleMember, {
        circle_id: circle.id, user_id: userId, role: 'creator',
      }));

      // Increment creator's total_created
      await manager.query(
        `INSERT INTO user_profiles (user_id, total_created) VALUES ($1, 1)
         ON CONFLICT (user_id) DO UPDATE SET total_created = user_profiles.total_created + 1`, [userId]
      );

      return circle;
    });

    const score = circle.start_time.getTime();
    await this.redis.zadd('circles:upcoming', score, circle.id);

    const gridLat = Math.round(dto.lat * 100) / 100;
    const gridLng = Math.round(dto.lng * 100) / 100;
    const redisClient = this.redis.getClient();
    let cursor = '0';
    do {
      const [c, keys] = await redisClient.scan(cursor, 'MATCH', `cache:circles:${gridLat}:${gridLng}:*`, 'COUNT', 100);
      cursor = c;
      if (keys.length > 0) await redisClient.del(keys);
    } while (cursor !== '0');

    return circle;
  }

  private gridKey(lat: number, lng: number, rangeKm: number): string {
    const gridLat = Math.round(lat * 100) / 100;
    const gridLng = Math.round(lng * 100) / 100;
    return `cache:circles:${gridLat}:${gridLng}:${rangeKm}`;
  }

  async findNearbyWithCache(lat: number, lng: number, rangeKm: number, filters?: Partial<{
    category_id: string; time_filter: string; instant: number;
  }>) {
    const key = this.gridKey(lat, lng, rangeKm);
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const result = await this.findNearby(lat, lng, rangeKm, filters);
    await this.redis.set(key, JSON.stringify(result), 30);
    return result;
  }

  async findNearby(lat: number, lng: number, rangeKm: number, filters: Partial<{
    category_id: string; time_filter: string; instant: number;
  }> = {}) {
    const rangeMeters = rangeKm * 1000;

    let qb = this.circleRepo.createQueryBuilder('c')
      .where('c.status IN (:...statuses)', { statuses: ['active', 'preparing'] })
      .orderBy('c.start_time', 'ASC')
      .limit(50);

    if (filters.category_id) {
      qb = qb.andWhere('c.category_id = :cid', { cid: filters.category_id });
    }
    if (filters.instant === 1) {
      qb = qb.andWhere("c.start_time <= NOW() + INTERVAL '1 hour'");
    }
    if (filters.time_filter === 'today') {
      qb = qb.andWhere("c.start_time::date = CURRENT_DATE");
    }
    if (filters.time_filter === 'tomorrow') {
      qb = qb.andWhere("c.start_time::date = CURRENT_DATE + INTERVAL '1 day'");
    }

    const circles = await qb.getMany();

    return circles.filter((c) => {
      const m = (c.location as string).match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
      if (!m) return false;
      return calculateDistance(lat, lng, parseFloat(m[2]), parseFloat(m[1])) <= rangeMeters;
    });
  }

  async findById(id: string) {
    const circle = await this.circleRepo.findOne({ where: { id } });
    if (!circle) throw new NotFoundException('圈子不存在');
    return circle;
  }

  async join(circleId: string, userId: string, isAnonymous = false) {
    return this.dataSource.transaction(async (manager) => {
      const circle = await manager.findOne(Circle, {
        where: { id: circleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!circle) throw new NotFoundException('圈子不存在');
      if (circle.status !== CircleStatus.ACTIVE && circle.status !== CircleStatus.PREPARING) {
        throw new ForbiddenException('圈子已结束');
      }

      const existing = await manager.findOne(CircleMember, { where: { circle_id: circleId, user_id: userId } });
      if (existing) throw new ForbiddenException('你已在该圈子中');

      const [countResult] = await manager.query(
        `SELECT count(*)::int AS cnt FROM circle_members WHERE circle_id = $1`, [circleId]
      );
      if (countResult.cnt >= circle.max_members) {
        throw new ForbiddenException('圈子已满');
      }

      await manager.save(manager.create(CircleMember, {
        circle_id: circleId, user_id: userId, role: 'member', is_anonymous: isAnonymous,
      }));

      // Increment total_joined
      await manager.query(
        `INSERT INTO user_profiles (user_id, total_joined) VALUES ($1, 1)
         ON CONFLICT (user_id) DO UPDATE SET total_joined = user_profiles.total_joined + 1`,
        [userId],
      );

      return { joined: true };
    }).then(async (result) => {
      try {
        await this.chatGateway.broadcastSystem(circleId, 'member_joined', {
          user_id: userId, is_anonymous: isAnonymous,
        });
      } catch (err) {
        this.logger.warn(`broadcastSystem member_joined failed for circle ${circleId}`, err);
      }
      return result;
    });
  }

  async leave(circleId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { circle_id: circleId, user_id: userId } });
    if (!member) throw new NotFoundException('你不在该圈子中');
    if (member.role === 'creator') throw new ForbiddenException('创建者不能退出，请解散圈子');
    await this.memberRepo.delete({ circle_id: circleId, user_id: userId });

    await this.chatGateway.broadcastSystem(circleId, 'member_left', { user_id: userId });
    return { left: true };
  }

  async dissolve(circleId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const circle = await manager.findOne(Circle, {
        where: { id: circleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!circle) throw new NotFoundException('圈子不存在');
      if (circle.status === CircleStatus.DISSOLVED) throw new BadRequestException('圈子已解散');
      if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可解散');
      circle.status = CircleStatus.DISSOLVED;
      circle.dissolved_at = new Date();
      await manager.save(circle);
      return { dissolved: true };
    }).then(async (result) => {
      await this.redis.zrem('circles:upcoming', circleId);
      try {
        await this.chatGateway.broadcastSystem(circleId, 'circle_dissolved');
      } catch (err) {
        this.logger.warn(`broadcastSystem circle_dissolved failed for circle ${circleId}`, err);
      }
      return result;
    });
  }

  async convertToPermanent(circleId: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const circle = await manager.findOne(Circle, {
        where: { id: circleId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!circle) throw new NotFoundException('圈子不存在');
      if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可操作');
      circle.status = CircleStatus.PRIVATE_PERMANENT;
      await manager.save(circle);
      return { converted: true };
    }).then(async (result) => {
      await this.redis.zrem('circles:upcoming', circleId);
      try {
        await this.chatGateway.broadcastSystem(circleId, 'circle_converted');
      } catch (err) {
        this.logger.warn(`broadcastSystem circle_converted failed for circle ${circleId}`, err);
      }
      return result;
    });
  }

  async getMembers(circleId: string, page = 1, limit = 50) {
    const cappedLimit = Math.min(limit, 100);
    return this.memberRepo.find({
      where: { circle_id: circleId },
      order: { joined_at: 'ASC' },
      skip: (page - 1) * cappedLimit,
      take: cappedLimit,
    });
  }

  async update(circleId: string, userId: string, dto: {
    title?: string; description?: string; address?: string;
    max_members?: number; start_time?: Date; prep_time?: number;
    group_rule?: string; restrict_tag?: string;
  }) {
    const circle = await this.findById(circleId);
    if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可编辑');

    if (circle.start_time <= new Date() && circle.status !== CircleStatus.PREPARING) {
      throw new ForbiddenException('已开始的圈子不可编辑');
    }

    Object.assign(circle, dto);
    const saved = await this.circleRepo.save(circle);

    // Invalidate nearby cache
    const locMatch = (circle.location as string).match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
    if (locMatch) {
      const gridLat = Math.round(parseFloat(locMatch[2]) * 100) / 100;
      const gridLng = Math.round(parseFloat(locMatch[1]) * 100) / 100;
      await this.invalidateCache(gridLat, gridLng);
    }

    return saved;
  }

  private async invalidateCache(gridLat: number, gridLng: number) {
    const redisClient = this.redis.getClient();
    let cursor = '0';
    do {
      const [c, keys] = await redisClient.scan(cursor, 'MATCH', `cache:circles:${gridLat}:${gridLng}:*`, 'COUNT', 100);
      cursor = c;
      if (keys.length > 0) await redisClient.del(keys);
    } while (cursor !== '0');
  }

  async checkin(circleId: string, userId: string, userLat: number, userLng: number) {
    const circle = await this.findById(circleId);

    if (!['preparing', 'active'].includes(circle.status)) {
      throw new BadRequestException('当前圈子状态不支持签到');
    }

    const pointMatch = (circle.location as string).match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
    if (!pointMatch) throw new BadRequestException('圈子位置数据异常');
    const circleLng = parseFloat(pointMatch[1]);
    const circleLat = parseFloat(pointMatch[2]);
    const distance = calculateDistance(userLat, userLng, circleLat, circleLng);
    if (distance > 1000) {
      throw new BadRequestException(`距离过远(${Math.round(distance)}m)，请在圈子1km范围内签到`);
    }

    const member = await this.memberRepo.findOne({
      where: { circle_id: circleId, user_id: userId },
    });
    if (!member) throw new ForbiddenException('你不是圈子成员');
    if (member.checked_in) {
      throw new BadRequestException('已经签到过了');
    }

    member.checked_in = true;
    await this.memberRepo.save(member);
    return { checked_in: true };
  }

  async search(keyword: string, lat: number, lng: number) {
    if (!keyword || keyword.trim().length === 0) return [];
    const circles = await this.circleRepo.createQueryBuilder('c')
      .where('c.status IN (:...statuses)', { statuses: ['active', 'preparing'] })
      .andWhere('(c.title ILIKE :kw OR c.description ILIKE :kw)', { kw: `%${keyword.trim()}%` })
      .orderBy('c.start_time', 'ASC')
      .limit(30)
      .getMany();

    return circles.filter((c) => {
      const m = (c.location as string).match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
      if (!m) return false;
      return calculateDistance(lat, lng, parseFloat(m[2]), parseFloat(m[1])) <= 10000;
    });
  }

  async getCategories() {
    return this.categoryRepo.find({ order: { sort: 'ASC' } });
  }

  async expandRange(circleId: string, userId: string) {
    const circle = await this.findById(circleId);
    if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可扩大搜索范围');

    const newRange = Math.min(circle.range_km + 2, 10);
    if (newRange === circle.range_km) throw new ForbiddenException('已达最大范围(10km)');

    circle.range_km = newRange;
    await this.circleRepo.save(circle);
    return { circle_id: circleId, range_km: newRange };
  }

  async findCards(lat: number, lng: number, rangeKm: number = 10, filters?: {
    category_id?: string; time_filter?: string;
  }) {
    const rangeMeters = rangeKm * 1000;

    let qb = this.circleRepo.createQueryBuilder('c')
      .where('c.status IN (:...statuses)', { statuses: ['active', 'preparing'] })
      .andWhere('c.creator_id NOT IN (SELECT id FROM users WHERE is_incognito = true OR deleted_at IS NOT NULL)')
      .leftJoin('user_profiles', 'up', 'up.user_id = c.creator_id')
      .select([
        'c.id', 'c.creator_id', 'c.category_id', 'c.title', 'c.description',
        'c.address', 'c.max_members', 'c.start_time', 'c.start_type',
        'c.prep_time', 'c.status', 'c.restrict_tag', 'c.group_rule', 'c.created_at',
        'up.showup_rate',
      ])
      .orderBy('c.start_time', 'ASC')
      .addOrderBy('c.max_members', 'DESC')
      .limit(30);

    if (filters?.category_id) {
      qb = qb.andWhere('c.category_id = :cid', { cid: filters.category_id });
    }
    if (filters?.time_filter === 'today') {
      qb = qb.andWhere("c.start_time::date = CURRENT_DATE");
    }

    const raw = await qb.getRawMany();

    const circles = raw.filter((row: any) => {
      if (!row.c_location) return false;
      const m = (row.c_location as string).match(/POINT\(([-\d.]+) ([-\d.]+)\)/i);
      if (!m) return false;
      return calculateDistance(lat, lng, parseFloat(m[2]), parseFloat(m[1])) <= rangeMeters;
    });

    if (circles.length === 0) {
      const allWishes = await this.wishRepo.find({ where: { status: 'waiting' as any } });
      const nearbyWishes = allWishes.filter((w) => {
        if (w.lat == null || w.lng == null) return false;
        return calculateDistance(lat, lng, w.lat, w.lng) <= rangeMeters;
      });

      if (nearbyWishes.length > 0) {
        const categoryMap: Record<string, { name: string; icon: string; count: number }> = {};
        for (const w of nearbyWishes) {
          if (!w.category_id) continue;
          if (!categoryMap[w.category_id]) {
            categoryMap[w.category_id] = { name: w.category_id, icon: '', count: 0 };
          }
          categoryMap[w.category_id].count++;
        }
        const wishes = Object.values(categoryMap)
          .sort((a, b) => b.count - a.count)
          .map((v) => ({ category_name: v.name, category_icon: v.icon, count: v.count }));
        return { type: 'wishpool', data: wishes };
      }
      return { type: 'empty', message: '附近暂无圈子，快来创建第一个吧！' };
    }

    return { type: 'circles', data: circles };
  }
}
