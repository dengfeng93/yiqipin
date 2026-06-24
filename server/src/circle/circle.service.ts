import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  constructor(
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectRepository(CircleMember) private memberRepo: Repository<CircleMember>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(WishItem) private wishRepo: Repository<WishItem>,
    private redis: RedisService,
    private chatGateway: ChatGateway,
  ) {}

  async create(userId: string, dto: CreateCircleDto) {
    const category = await this.categoryRepo.findOne({ where: { id: dto.category_id } });
    if (!category) throw new NotFoundException('活动类型不存在');

    const circle = this.circleRepo.create({
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
      restrict_tag: dto.restrict_tag || RestrictTag.ALL,
      group_rule: dto.group_rule,
      status: dto.prep_time && dto.prep_time > 0 ? CircleStatus.PREPARING : CircleStatus.ACTIVE,
    });
    await this.circleRepo.save(circle);

    await this.memberRepo.save(this.memberRepo.create({
      circle_id: circle.id, user_id: userId, role: 'creator',
    }));

    const score = circle.start_time.getTime();
    await this.redis.zadd('circles:upcoming', score, circle.id);

    const gridLat = Math.round(dto.lat * 100) / 100;
    const gridLng = Math.round(dto.lng * 100) / 100;
    const redisClient = this.redis.getClient();
    const keys = await redisClient.keys(`cache:circles:${gridLat}:${gridLng}:*`);
    if (keys.length > 0) await redisClient.del(keys);

    return circle;
  }

  private gridKey(lat: number, lng: number, rangeKm: number): string {
    const gridLat = Math.round(lat * 100) / 100;
    const gridLng = Math.round(lng * 100) / 100;
    return `cache:circles:${gridLat}:${gridLng}:${rangeKm}`;
  }

  async findNearbyWithCache(lat: number, lng: number, rangeKm: number, filters?: any) {
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
    const point = locationToPoint(lat, lng);
    const rangeMeters = rangeKm * 1000;

    let query = this.circleRepo.createQueryBuilder('c')
      .where(`ST_DWithin(c.location, ST_GeomFromText(:point, 0), :range)`, { point, range: rangeMeters })
      .andWhere('c.status IN (:...statuses)', { statuses: ['active', 'preparing'] })
      .orderBy('c.start_time', 'ASC')
      .limit(50);

    if (filters.category_id) {
      query = query.andWhere('c.category_id = :cid', { cid: filters.category_id });
    }
    if (filters.instant === 1) {
      query = query.andWhere("c.start_time <= NOW() + INTERVAL '1 hour'");
    }
    if (filters.time_filter === 'today') {
      query = query.andWhere("c.start_time::date = CURRENT_DATE");
    }
    if (filters.time_filter === 'tomorrow') {
      query = query.andWhere("c.start_time::date = CURRENT_DATE + INTERVAL '1 day'");
    }

    return query.getMany();
  }

  async findById(id: string) {
    const circle = await this.circleRepo.findOne({ where: { id } });
    if (!circle) throw new NotFoundException('圈子不存在');
    return circle;
  }

  async join(circleId: string, userId: string, isAnonymous = false) {
    const circle = await this.findById(circleId);
    if (circle.status !== CircleStatus.ACTIVE && circle.status !== CircleStatus.PREPARING) {
      throw new ForbiddenException('圈子已结束');
    }

    const existing = await this.memberRepo.findOne({ where: { circle_id: circleId, user_id: userId } });
    if (existing) throw new ForbiddenException('你已在该圈子中');

    const count = await this.memberRepo.count({ where: { circle_id: circleId } });
    if (count >= circle.max_members) throw new ForbiddenException('圈子已满');

    await this.memberRepo.save(this.memberRepo.create({
      circle_id: circleId, user_id: userId, is_anonymous: isAnonymous,
    }));

    await this.chatGateway.broadcastSystem(circleId, 'member_joined', {
      user_id: userId,
      is_anonymous: isAnonymous,
      member_count: count + 1,
    });

    return { joined: true, member_count: count + 1 };
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
    const circle = await this.findById(circleId);
    if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可解散');
    if (circle.status === CircleStatus.DISSOLVED) throw new BadRequestException('圈子已解散');
    circle.status = CircleStatus.DISSOLVED;
    circle.dissolved_at = new Date();
    await this.circleRepo.save(circle);
    await this.redis.zrem('circles:upcoming', circleId);

    await this.chatGateway.broadcastSystem(circleId, 'circle_dissolved');

    return { dissolved: true };
  }

  async convertToPermanent(circleId: string, userId: string) {
    const circle = await this.findById(circleId);
    if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可操作');
    circle.status = CircleStatus.PRIVATE_PERMANENT;
    await this.circleRepo.save(circle);
    await this.redis.zrem('circles:upcoming', circleId);

    await this.chatGateway.broadcastSystem(circleId, 'circle_converted');

    return { converted: true };
  }

  async getMembers(circleId: string) {
    return this.memberRepo.find({ where: { circle_id: circleId }, order: { joined_at: 'ASC' as any } });
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
    return this.circleRepo.save(circle);
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
    if (member?.checked_in) {
      throw new BadRequestException('已经签到过了');
    }

    await this.memberRepo.update(
      { circle_id: circleId, user_id: userId },
      { checked_in: true },
    );
    return { checked_in: true };
  }

  async search(keyword: string, lat: number, lng: number) {
    if (!keyword || keyword.trim().length === 0) return [];
    const point = locationToPoint(lat, lng);
    return this.circleRepo.createQueryBuilder('c')
      .where('ST_DWithin(c.location, ST_GeomFromText(:point, 0), 10000)', { point })
      .andWhere('c.status IN (:...statuses)', { statuses: ['active', 'preparing'] })
      .andWhere('(c.title ILIKE :kw OR c.description ILIKE :kw)', { kw: `%${keyword.trim()}%` })
      .orderBy('c.start_time', 'ASC')
      .limit(30)
      .getMany();
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
    const point = locationToPoint(lat, lng);
    const rangeMeters = rangeKm * 1000;

    let query = this.circleRepo.createQueryBuilder('c')
      .where('ST_DWithin(c.location, ST_GeomFromText(:point, 0), :range)', { point, range: rangeMeters })
      .andWhere('c.status IN (:...statuses)', { statuses: ['active', 'preparing'] })
      .andWhere('c.creator_id NOT IN (SELECT id FROM users WHERE is_incognito = true)')
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
      query = query.andWhere('c.category_id = :cid', { cid: filters.category_id });
    }
    if (filters?.time_filter === 'today') {
      query = query.andWhere("c.start_time::date = CURRENT_DATE");
    }

    const circles = await query.getRawMany();

    if (circles.length === 0) {
      const wishes = await this.wishRepo.createQueryBuilder('w')
        .where('ST_DWithin(w.location, ST_GeomFromText(:point, 0), :range)', { point, range: rangeMeters })
        .andWhere('w.status = :status', { status: 'waiting' })
        .leftJoin('categories', 'c', 'c.id = w.category_id')
        .select('c.name', 'category_name')
        .addSelect('c.icon', 'category_icon')
        .addSelect('COUNT(*)', 'count')
        .groupBy('c.name, c.icon')
        .orderBy('count', 'DESC')
        .getRawMany();

      if (wishes.length > 0) {
        return { type: 'wishpool', data: wishes };
      }
      return { type: 'empty', message: '附近暂无圈子，快来创建第一个吧！' };
    }

    return { type: 'circles', data: circles };
  }
}
