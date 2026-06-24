import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CircleService } from './circle.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { UpdateCircleDto } from './dto/update-circle.dto';
import { CircleQueryDto } from './dto/circle-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../user/entities/user.entity';

@Controller('circles')
export class CircleController {
  constructor(private circleService: CircleService) {}

  @Public()
  @Get()
  findNearby(@Query() query: CircleQueryDto) {
    return this.circleService.findNearbyWithCache(query.lat, query.lng, query.range || 10, query);
  }

  @Public()
  @Get('cards')
  findCards(@Query() query: CircleQueryDto) {
    return this.circleService.findCards(query.lat, query.lng, query.range || 10, query);
  }

  @Public()
  @Get(':id')
  getCircle(@Param('id') id: string) {
    return this.circleService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateCircleDto) {
    return this.circleService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: User, @Body() dto: UpdateCircleDto) {
    return this.circleService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  dissolve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.circleService.dissolve(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: User, @Body('anonymous') anonymous = false) {
    return this.circleService.join(id, user.id, anonymous);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser() user: User) {
    return this.circleService.leave(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/members')
  getMembers(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.circleService.getMembers(id, page, Math.min(limit, 100));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/checkin')
  checkin(@Param('id') id: string, @CurrentUser() user: User, @Body('lat') lat: number, @Body('lng') lng: number) {
    return this.circleService.checkin(id, user.id, lat, lng);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/convert')
  convert(@Param('id') id: string, @CurrentUser() user: User) {
    return this.circleService.convertToPermanent(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/expand')
  async expand(@Param('id') id: string, @CurrentUser() user: User) {
    return this.circleService.expandRange(id, user.id);
  }
}
