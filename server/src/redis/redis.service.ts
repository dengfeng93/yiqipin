import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async geoAdd(key: string, lng: number, lat: number, member: string): Promise<number> {
    return this.redis.geoadd(key, lng, lat, member);
  }

  async geoRadius(key: string, lng: number, lat: number, radius: number, unit: 'm' | 'km' = 'm'): Promise<string[]> {
    const results = await this.redis.georadius(key, lng, lat, radius, unit, 'ASC') as string[];
    return results;
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.redis.zadd(key, score, member);
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.redis.zrem(key, member);
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    return this.redis.zrangebyscore(key, min, max);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) return this.redis.set(key, value, 'EX', ttl);
    return this.redis.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async lock(key: string, ttl: number = 10000): Promise<string | null> {
    const token = Math.random().toString(36).slice(2);
    const ok = await this.redis.set(`lock:${key}`, token, 'PX', ttl, 'NX');
    return ok === 'OK' ? token : null;
  }

  async unlock(key: string, token: string): Promise<boolean> {
    const script = `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      end
      return 0
    `;
    const result = await this.redis.eval(script, 1, `lock:${key}`, token);
    return result === 1;
  }

  getClient(): Redis {
    return this.redis;
  }
}
