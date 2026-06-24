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
    const review = this.reviewRepo.create({ reviewer_id: reviewerId, ...dto });
    const saved = await this.reviewRepo.save(review);

    // Update user profile statistics
    await this.dataSource.query(
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
  }

  async getUserReviews(userId: string) {
    return this.reviewRepo.find({ where: { target_user_id: userId }, order: { created_at: 'DESC' } });
  }

  async createReport(reporterId: string, dto: { target_user_id?: string; circle_id?: string; type: string; reason: string; detail?: string; images?: string[] }) {
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
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('举报不存在');
    if (report.status !== 'pending') throw new BadRequestException('举报已处理');

    report.status = action === 'confirm' ? 'banned' : 'dismissed';
    report.handled_by = handledBy;
    report.handled_at = new Date();
    await this.reportRepo.save(report);

    if (action === 'dismiss') {
      // Check for malicious reporter: if 3+ reports dismissed, warn
      const dismissedCount = await this.reportRepo.count({
        where: { reporter_id: report.reporter_id, status: 'dismissed' },
      });
      if (dismissedCount >= 3) {
        return { ...report, warning: 'reporter_malicious', dismissed_count: dismissedCount };
      }
    }

    if (action === 'confirm' && report.target_user_id) {
      // Ban the reported user
      await this.dataSource.query(
        `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [report.target_user_id],
      );
    }

    return report;
  }
}
