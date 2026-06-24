import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleSchedulerService } from './circle-scheduler.service';
import { Circle } from '../circle/entities/circle.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Circle]), RedisModule],
  providers: [CircleSchedulerService],
})
export class ScheduleTasksModule {}
