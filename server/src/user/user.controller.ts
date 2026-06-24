import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { NotificationService } from '../notification/notification.service';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
  ) {}

  @Public()
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.userService.updateMe(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/incognito')
  async toggleIncognito(@CurrentUser() user: User) {
    return this.userService.toggleIncognito(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/circles')
  async getMyCircles(@CurrentUser() user: User) {
    return this.userService.getMyCircles(user.id);
  }

  @Public()
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.userService.getReviews(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/notifications')
  async getNotifications(@CurrentUser() user: User, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return this.notificationService.getUserNotifications(user.id, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/notifications/unread-count')
  async getUnreadCount(@CurrentUser() user: User) {
    return { count: await this.notificationService.getUnreadCount(user.id) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/notifications/:id/read')
  async markRead(@CurrentUser() user: User, @Param('id') notifId: string) {
    return this.notificationService.markRead(user.id, notifId);
  }
}
