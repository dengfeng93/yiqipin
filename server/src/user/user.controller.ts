import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from './entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

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
  @Get('me/circles')
  async getMyCircles(@CurrentUser() user: User) {
    return this.userService.getMyCircles(user.id);
  }

  @Public()
  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    return this.userService.getReviews(id);
  }
}
