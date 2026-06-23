import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Circle, CircleStatus, StartType, RestrictTag } from './entities/circle.entity';
import { CircleMember } from './entities/circle-member.entity';
import { Category } from './entities/category.entity';
import { RedisService } from '../redis/redis.service';
import { calculateDistance, locationToPoint } from '../common/utils/geo';
import { CreateCircleDto } from './dto/create-circle.dto';

@Injectable()
export class CircleService {
  constructor(
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectRepository(CircleMember) private memberRepo: Repository<CircleMember>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    private redis: RedisService,
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

    return circle;
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

    return { joined: true, member_count: count + 1 };
  }

  async leave(circleId: string, userId: string) {
    const member = await this.memberRepo.findOne({ where: { circle_id: circleId, user_id: userId } });
    if (!member) throw new NotFoundException('你不在该圈子中');
    if (member.role === 'creator') throw new ForbiddenException('创建者不能退出，请解散圈子');
    await this.memberRepo.delete({ circle_id: circleId, user_id: userId });
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
    return { dissolved: true };
  }

  async convertToPermanent(circleId: string, userId: string) {
    const circle = await this.findById(circleId);
    if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可操作');
    circle.status = CircleStatus.PRIVATE_PERMANENT;
    await this.circleRepo.save(circle);
    await this.redis.zrem('circles:upcoming', circleId);
    return { converted: true };
  }

  async getMembers(circleId: string) {
    return this.memberRepo.find({ where: { circle_id: circleId }, order: { joined_at: 'ASC' as any } });
  }

  async update(circleId: string, userId: string, dto: any) {
    const circle = await this.findById(circleId);
    if (circle.creator_id !== userId) throw new ForbiddenException('仅创建者可修改');
    if (dto.title !== undefined) circle.title = dto.title;
    if (dto.description !== undefined) circle.description = dto.description;
    if (dto.address !== undefined) circle.address = dto.address;
    if (dto.max_members !== undefined) circle.max_members = dto.max_members;
    if (dto.start_time !== undefined) circle.start_time = dto.start_time;
    if (dto.cover_image !== undefined) circle.cover_image = dto.cover_image;
    await this.circleRepo.save(circle);
    return circle;
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
}
