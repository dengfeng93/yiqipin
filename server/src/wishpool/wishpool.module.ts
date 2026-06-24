import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishpoolController } from './wishpool.controller';
import { WishpoolService } from './wishpool.service';
import { WishItem } from './entities/wish-item.entity';
import { Category } from '../circle/entities/category.entity';
import { CircleModule } from '../circle/circle.module';

@Module({
  imports: [TypeOrmModule.forFeature([WishItem, Category]), CircleModule],
  controllers: [WishpoolController],
  providers: [WishpoolService],
  exports: [WishpoolService],
})
export class WishpoolModule {}
