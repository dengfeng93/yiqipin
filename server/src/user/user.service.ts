import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserProfile) private profileRepo: Repository<UserProfile>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user || user.deleted_at) throw new NotFoundException('用户不存在');
    return user;
  }

  async updateMe(userId: string, dto: { nickname?: string; avatar?: string; interests?: string[] }): Promise<Record<string, any>> {
    const user = await this.findById(userId);
    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.interests !== undefined) user.interests = dto.interests;
    await this.userRepo.save(user);
    return this.sanitizeUser(user);
  }

  async bindPhone(userId: string, phone: string): Promise<Record<string, any>> {
    const existing = await this.userRepo.findOne({ where: { phone } });
    if (existing && existing.id !== userId) throw new ConflictException('手机号已被绑定');
    const user = await this.findById(userId);
    user.phone = phone;
    await this.userRepo.save(user);
    return this.sanitizeUser(user);
  }

  async getMyCircles(userId: string): Promise<any[]> {
    return this.userRepo.query(
      `SELECT c.*, cm.role, cm.joined_at
       FROM circles c
       INNER JOIN circle_members cm ON cm.circle_id = c.id
       WHERE cm.user_id = $1
       ORDER BY cm.joined_at DESC`,
      [userId],
    );
  }

  async getReviews(userId: string): Promise<any[]> {
    return this.userRepo.query(
      `SELECT ur.*, u.nickname AS reviewer_nickname, u.avatar AS reviewer_avatar
       FROM user_reviews ur
       LEFT JOIN users u ON u.id = ur.reviewer_id
       WHERE ur.target_user_id = $1
       ORDER BY ur.created_at DESC`,
      [userId],
    );
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.profileRepo.findOne({ where: { user_id: userId } });
  }

  async toggleIncognito(userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    user.is_incognito = !user.is_incognito;
    await this.userRepo.save(user);
    return user.is_incognito;
  }

  async softDelete(userId: string): Promise<void> {
    const user = await this.findById(userId);
    await this.userRepo.softRemove(user);
  }

  private sanitizeUser(user: User) {
    const { wechat_openid, deleted_at, ...safe } = user as Record<string, any>;
    return safe;
  }
}
