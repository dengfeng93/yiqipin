import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

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
    const [data, total] = await this.notifRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async markRead(userId: string, notifId: string) {
    const result = await this.notifRepo.update(
      { id: notifId, user_id: userId },
      { is_read: true },
    );
    if (result.affected === 0) throw new NotFoundException('通知不存在');
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { user_id: userId, is_read: false } });
  }

  async broadcastToCircle(circleId: string, type: NotificationType, title: string, body?: string) {
    const members = await this.entityManager.query(
      `SELECT user_id FROM circle_members WHERE circle_id = $1`, [circleId]
    );
    if (!members || members.length === 0) return;

    const BATCH_SIZE = 100;
    const notifications = members.map((m: { user_id: string }) => ({
      user_id: m.user_id,
      type,
      title,
      body,
      data: { circle_id: circleId },
    }));

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      try {
        await this.notifRepo.save(this.notifRepo.create(batch));
      } catch (err) {
        this.logger.error(`Broadcast batch failed for circle ${circleId} at offset ${i}`, err);
      }
    }
  }
}
