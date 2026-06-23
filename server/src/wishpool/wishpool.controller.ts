import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { WishpoolService } from './wishpool.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../user/entities/user.entity';

@Controller('wishes')
export class WishpoolController {
  constructor(private wishService: WishpoolService) {}

  @Public()
  @Get()
  list(@Query('lat') lat: number, @Query('lng') lng: number, @Query('range') range = 10) {
    return this.wishService.listNearby(lat, lng, range);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  addOne(@CurrentUser() user: User, @Body() body: { category_id: string; lat: number; lng: number }) {
    return this.wishService.addOne(user.id, body.category_id, body.lat, body.lng);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@CurrentUser() user: User, @Param('id') id: string) {
    return this.wishService.join(user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.wishService.cancel(user.id, id);
  }
}
