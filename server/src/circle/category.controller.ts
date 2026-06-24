import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CircleService } from './circle.service';

@Controller()
export class CategoryController {
  constructor(private circleService: CircleService) {}

  @Public()
  @Get('categories')
  async getCategories() {
    return this.circleService.getCategories();
  }
}
