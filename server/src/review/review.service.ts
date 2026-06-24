import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserReview } from './entities/user-review.entity';
import { Report } from './entities/report.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(UserReview) private reviewRepo: Repository<UserReview>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    private dataSource: DataSource,
  ) {}

  async createReview(reviewerId: string, dto: { target_user_id: string; circle_id: string; showed_up: boolean; tags?: string[]; comment?: string }) {
    return this.dataSource.transaction(async (manager) => {
      const review = manager.create(UserReview, { reviewer_id: reviewerId, ...dto });
      const saved = await manager.save(review);

      await manager.query(
        `UPDATE user_profiles
         SET showup_count = showup_count + CASE WHEN $1 THEN 1 ELSE 0 END,
             total_joined = total_joined + 1,
             showup_rate = CASE WHEN total_joined + 1 > 0
               THEN (showup_count + CASE WHEN $1 THEN 1 ELSE 0 END)::float / (total_joined + 1)
               ELSE 0 END
         WHERE user_id = $2`,
        [dto.showed_up, dto.target_user_id],
      );

      return saved;
    });
  }

  async getUserReviews(userId: string, page = 1, limit = 20) {
    const cappedLimit = Math.min(limit, 100);
    return this.reviewRepo.find({
      where: { target_user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * cappedLimit,
      take: cappedLimit,
    });
  }

  async createReport(reporterId: string, dto: { target_user_id?: string; circle_id?: string; type: string; reason: string; detail?: string }) {
    const report = this.reportRepo.create({ reporter_id: reporterId, ...dto });
    return this.reportRepo.save(report);
  }

  async listReports(page: number = 1, limit: number = 20) {
    const [data, total] = await this.reportRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async handleReport(reportId: string, handledBy: string, action: 'dismiss' | 'confirm') {
    return this.dataSource.transaction(async (manager) => {
      const report = await manager.findOne(Report, { where: { id: reportId } });
      if (!report) throw new NotFoundException('举报不存在');
      if (report.status !== 'pending') throw new BadRequestException('举报已处理');

      report.status = action === 'confirm' ? 'reviewed' : 'dismissed';
      report.handled_by = handledBy;
      report.handled_at = new Date();
      await manager.save(report);

      if (action === 'dismiss') {
        const dismissedCount = await manager.count(Report, {
          where: { reporter_id: report.reporter_id, status: 'dismissed' },
        });
        if (dismissedCount >= 3) {
          return { ...report, warning: 'reporter_malicious', dismissed_count: dismissedCount };
        }
      }

      if (action === 'confirm' && report.target_user_id) {
        await manager.query(
          `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
          [report.target_user_id],
        );
      }

      return report;
    });
  }
}
