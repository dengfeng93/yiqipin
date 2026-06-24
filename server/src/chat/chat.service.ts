import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { CircleMessage, MessageType } from './entities/circle-message.entity';
import { CircleMember } from '../circle/entities/circle-member.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(CircleMessage) private msgRepo: Repository<CircleMessage>,
    @InjectRepository(CircleMember) private memberRepo: Repository<CircleMember>,
    private redis: RedisService,
  ) {}

  async saveMessage(data: {
    circle_id: string; user_id: string; type: MessageType; content?: string; image_url?: string;
  }): Promise<CircleMessage> {
    const msg = this.msgRepo.create(data);
    return this.msgRepo.save(msg);
  }

  async getCircle(circleId: string) {
    const [circle] = await this.msgRepo.manager.query(
      `SELECT id, status, creator_id FROM circles WHERE id = $1`, [circleId]
    );
    return circle || null;
  }

  async getHistory(circleId: string, before?: string, limit = 50) {
    const where: any = { circle_id: circleId };
    if (before) {
      const target = await this.msgRepo.findOne({ where: { id: before } });
      if (target) where.created_at = LessThan(target.created_at);
    }
    return this.msgRepo.find({ where, order: { created_at: 'DESC' }, take: limit, relations: { user: true } });
  }

  async recall(circleId: string, msgId: string, userId: string) {
    const msg = await this.msgRepo.findOne({ where: { id: msgId, circle_id: circleId } });
    if (!msg) throw new NotFoundException('消息不存在');
    if (msg.user_id !== userId) throw new ForbiddenException('只能撤回自己的消息');

    const elapsed = Date.now() - msg.created_at.getTime();
    if (elapsed > 2 * 60 * 1000) throw new BadRequestException('超过2分钟无法撤回');

    msg.is_recalled = true;
    msg.recall_snapshot = { content: msg.content, image_url: msg.image_url, recalled_at: new Date() };
    msg.content = undefined as any;
    msg.image_url = undefined as any;
    return this.msgRepo.save(msg);
  }

  async getOfflineMessages(circleId: string, since: string) {
    const sinceDate = new Date(since);
    return this.msgRepo.find({
      where: { circle_id: circleId, created_at: MoreThan(sinceDate) },
      order: { created_at: 'DESC' },
      take: 100,
    });
  }

  async isMember(circleId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepo.findOne({ where: { circle_id: circleId, user_id: userId } });
    return !!member;
  }

  async isUserBlocked(userId: string): Promise<boolean> {
    const [user] = await this.msgRepo.manager.query(
      `SELECT id FROM users WHERE id = $1 AND deleted_at IS NOT NULL`, [userId]
    );
    return !!user;
  }

  async recordViolation(userId: string, circleId: string, msgId: string | null, action: string, reason: string) {
    await this.msgRepo.manager.query(
      `INSERT INTO violation_records (user_id, circle_id, msg_id, action, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, circleId, msgId, action, reason],
    );
  }

  async updateLastRead(circleId: string, userId: string) {
    await this.memberRepo.update(
      { circle_id: circleId, user_id: userId },
      { last_read_at: new Date() } as any,
    );
  }
}
