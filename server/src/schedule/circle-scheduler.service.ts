import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Circle } from '../circle/entities/circle.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CircleSchedulerService {
  private logger = new Logger('CircleScheduler');

  constructor(
    @InjectRepository(Circle) private circleRepo: Repository<Circle>,
    @InjectEntityManager() private entityManager: EntityManager,
    private redis: RedisService,
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
        this.logger.log(`Remind creator ${c.creator_id} to convert circle ${c.id}`);
      }
    } finally {
      await this.redis.unlock('cron:permanent-reminder', lockToken);
    }
  }
}
