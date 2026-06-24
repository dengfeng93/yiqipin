import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReportDto } from './dto/create-report.dto';

@Controller()
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post('reviews')
  createReview(@CurrentUser() user: User, @Body() body: CreateReviewDto) {
    return this.reviewService.createReview(user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reports')
  createReport(@CurrentUser() user: User, @Body() body: CreateReportDto) {
    return this.reviewService.createReport(user.id, body);
  }
}
