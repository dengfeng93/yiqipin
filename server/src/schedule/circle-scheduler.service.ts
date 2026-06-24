import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Circle } from '../circle/entities/circle.entity';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class CircleSchedulerService {
  private logger = new Logger('CircleScheduler');

  constructor(
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectEntityManager() private entityManager: EntityManager,
    private redis: RedisService,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPreparationTimeout() {
    const lockToken = await this.redis.lock('cron:preparation', 4 * 60 * 1000);
    if (!lockToken) return;

    try {
      await this.circleRepo.query(`
        UPDATE circles SET status = 'active'
        WHERE status = 'preparing'
        AND start_time + COALESCE(prep_time, 0) * INTERVAL '1 minute' <= NOW()
      `);
    } finally {
      await this.redis.unlock('cron:preparation', lockToken);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkDissolve() {
    const lockToken = await this.redis.lock('cron:dissolve', 29 * 60 * 1000);
    if (!lockToken) return;

    try {
      await this.circleRepo.query(`
        UPDATE circles SET status = 'archived'
        WHERE status IN ('active', 'preparing')
        AND start_time + INTERVAL '24 hours' <= NOW()
      `);

      await this.circleRepo.query(`
        UPDATE circles SET status = 'dissolved', dissolved_at = NOW()
        WHERE status = 'preparing'
        AND start_time + COALESCE(prep_time, 0) * INTERVAL '1 minute' + INTERVAL '30 minutes' <= NOW()
      `);

      await this.circleRepo.query(`
        UPDATE circles SET status = 'dissolved', dissolved_at = NOW()
        WHERE status = 'active'
        AND created_at + INTERVAL '30 minutes' <= NOW()
        AND NOT EXISTS (SELECT 1 FROM circle_members cm WHERE cm.circle_id = circles.id AND cm.role != 'creator')
      `);
    } finally {
      await this.redis.unlock('cron:dissolve', lockToken);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkPermanentReminder() {
    const lockToken = await this.redis.lock('cron:permanent-reminder', 59 * 60 * 1000);
    if (!lockToken) return;

    try {
      const circles = await this.circleRepo.query(`
        SELECT id, creator_id, title FROM circles
        WHERE status IN ('active', 'preparing')
        AND start_time + INTERVAL '18 hours' <= NOW()
        AND start_time + INTERVAL '24 hours' > NOW()
      `);

      for (const c of circles) {
        try {
          await this.notificationService.create({
            user_id: c.creator_id,
            type: NotificationType.CIRCLE_WILL_END,
            title: '圈子即将结束',
            body: `"${c.title}"将在6小时后自动归档，是否转为永久搭子群？`,
            data: { circle_id: c.id },
          });
        } catch (e) {
          this.logger.error(`Failed to send permanent reminder for circle ${c.id}: ${e}`);
        }
      }
    } finally {
      await this.redis.unlock('cron:permanent-reminder', lockToken);
    }
  }

  @Cron('0 2 * * *')
  async checkWishExpiry() {
    const lockToken = await this.redis.lock('cron:wish-expiry', 59 * 60 * 1000);
    if (!lockToken) return;

    try {
      await this.entityManager.query(`
        UPDATE wish_items SET status = 'expired'
        WHERE status = 'waiting' AND created_at + INTERVAL '24 hours' <= NOW()
      `);
    } finally {
      await this.redis.unlock('cron:wish-expiry', lockToken);
    }
  }

  @Cron('0 4 * * *')
  async cleanDeletedAccounts() {
    const lockToken = await this.redis.lock('cron:clean-accounts', 59 * 60 * 1000);
    if (!lockToken) return;

    try {
      const userIds = await this.entityManager.query(`
        SELECT id FROM users
        WHERE deleted_at IS NOT NULL
        AND deleted_at + INTERVAL '30 days' <= NOW()
      `);
      const ids = (userIds as { id: string }[]).map(u => u.id);

      if (ids.length > 0) {
        // Clean up related records first
        for (const id of ids) {
          await this.entityManager.query(`DELETE FROM circle_members WHERE user_id = $1`, [id]);
          await this.entityManager.query(`DELETE FROM chat_messages WHERE user_id = $1`, [id]);
          await this.entityManager.query(`DELETE FROM wish_items WHERE user_id = $1`, [id]);
          await this.entityManager.query(`DELETE FROM user_reviews WHERE reviewer_id = $1 OR target_user_id = $1`, [id]);
          await this.entityManager.query(`DELETE FROM reports WHERE reporter_id = $1`, [id]);
          await this.entityManager.query(`DELETE FROM notifications WHERE user_id = $1`, [id]);
          await this.entityManager.query(`DELETE FROM user_profiles WHERE user_id = $1`, [id]);
          await this.entityManager.query(`DELETE FROM users WHERE id = $1`, [id]);
        }
        this.logger.log(`Cleaned ${ids.length} deleted accounts and related data`);
      }
    } finally {
      await this.redis.unlock('cron:clean-accounts', lockToken);
    }
  }
}
