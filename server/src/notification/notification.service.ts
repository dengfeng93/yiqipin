import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async create(dto: {
    user_id: string; type: NotificationType; title: string; body?: string; data?: object;
  }) {
    return this.notifRepo.save(this.notifRepo.create(dto));
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    return this.notifRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async markRead(userId: string, notifId: string) {
    const result = await this.notifRepo.update(
      { id: notifId, user_id: userId },
      { is_read: true },
    );
    if (result.affected === 0) throw new Error('通知不存在');
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { user_id: userId, is_read: false } });
  }

  async broadcastToCircle(circleId: string, type: NotificationType, title: string, body?: string) {
    const members = await this.entityManager.query(
      `SELECT user_id FROM circle_members WHERE circle_id = $1`, [circleId]
    );
    const notifications = members.map((m: { user_id: string }) => ({
      user_id: m.user_id,
      type,
      title,
      body,
      data: { circle_id: circleId },
    }));
    if (notifications.length > 0) {
      await this.notifRepo.save(this.notifRepo.create(notifications));
    }
  }
}
