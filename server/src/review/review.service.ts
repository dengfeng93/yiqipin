import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReview } from './entities/user-review.entity';
import { Report } from './entities/report.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(UserReview) private reviewRepo: Repository<UserReview>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
  ) {}

  async createReview(reviewerId: string, dto: { target_user_id: string; circle_id: string; showed_up: boolean; tags?: string[]; comment?: string }) {
    const review = this.reviewRepo.create({ reviewer_id: reviewerId, ...dto });
    return this.reviewRepo.save(review);
  }

  async getUserReviews(userId: string) {
    return this.reviewRepo.find({ where: { target_user_id: userId }, order: { created_at: 'DESC' } });
  }

  async createReport(reporterId: string, dto: { target_user_id?: string; circle_id?: string; type: string; reason: string; detail?: string }) {
    const report = this.reportRepo.create({ reporter_id: reporterId, ...dto });
    return this.reportRepo.save(report);
  }
}
