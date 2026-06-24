import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppModule } from './app.module';
import { ScheduleTasksModule } from './schedule/schedule.module';

@Module({
  imports: [AppModule, ScheduleModule.forRoot(), ScheduleTasksModule],
})
export class AppWorkerModule {}
