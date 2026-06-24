import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CircleService } from './circle.service';

@Controller()
export class SearchController {
  constructor(private circleService: CircleService) {}

  @Public()
  @Get('search')
  async search(@Query('q') q: string, @Query('lat') lat: number, @Query('lng') lng: number) {
    if (!q || !q.trim()) return { data: [] };
    return this.circleService.search(q, lat, lng);
  }
}
