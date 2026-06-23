import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { CircleModule } from './circle/circle.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    DatabaseModule,
    RedisModule,
    CommonModule,
    AuthModule,
    UserModule,
    HealthModule,
    AdminModule,
    CircleModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: RateLimitInterceptor },
  ],
})
export class AppModule {}
