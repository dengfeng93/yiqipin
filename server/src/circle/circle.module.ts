import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleController } from './circle.controller';
import { SearchController } from './search.controller';
import { CategoryController } from './category.controller';
import { CircleService } from './circle.service';
import { Circle } from './entities/circle.entity';
import { CircleMember } from './entities/circle-member.entity';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Circle, CircleMember, Category])],
  controllers: [CircleController, SearchController, CategoryController],
  providers: [CircleService],
  exports: [CircleService],
})
export class CircleModule {}
