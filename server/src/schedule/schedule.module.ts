import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CircleSchedulerService } from './circle-scheduler.service';
import { Circle } from '../circle/entities/circle.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Circle, Notification]), NotificationModule],
  providers: [CircleSchedulerService],
})
export class ScheduleTasksModule {}
