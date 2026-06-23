import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisService } from '../../redis/redis.service';

interface RateLimitConfig {
  prefix: string;
  max: number;
  windowSeconds: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  'POST:/api/v1/circles':          { prefix: 'rl:create-circle',  max: 5,  windowSeconds: 86400 },
  'POST:/api/v1/circles/:id/join': { prefix: 'rl:join-circle',    max: 20, windowSeconds: 3600 },
  'POST:/api/v1/reports':          { prefix: 'rl:report',         max: 10, windowSeconds: 86400 },
  'POST:/api/v1/reviews':          { prefix: 'rl:review',         max: 30, windowSeconds: 3600 },
  'POST:/api/v1/wishes':           { prefix: 'rl:wish',           max: 5,  windowSeconds: 86400 },
  'POST:/api/v1/upload/token':     { prefix: 'rl:upload-token',   max: 30, windowSeconds: 3600 },
};

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(private redis: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const rawPath = req.originalUrl?.split('?')[0] || req.url;
    const key = `${req.method}:${rawPath}`;
    const config = LIMITS[key];
    if (!config) return next.handle();

    const userId = req.user?.id || req.ip;
    const rk = `${config.prefix}:${userId}`;
    const count = await this.redis.getClient().incr(rk);
    if (count === 1) {
      await this.redis.getClient().expire(rk, config.windowSeconds);
    }
    if (count > config.max) {
      throw new HttpException('操作过于频繁，请稍后再试', HttpStatus.TOO_MANY_REQUESTS);
    }
    return next.handle();
  }
}
