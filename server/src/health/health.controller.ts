import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private db: DataSource,
    private redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check() {
    const checks: Record<string, string> = {};

    try {
      await this.db.query('SELECT 1');
      checks.db = 'ok';
    } catch (e: any) {
      checks.db = `error: ${e.message}`;
    }

    try {
      const pong = await this.redis.getClient().ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'error';
    } catch (e: any) {
      checks.redis = `error: ${e.message}`;
    }

    const allOk = Object.values(checks).every(v => v === 'ok');
    return {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
