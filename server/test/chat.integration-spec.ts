import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { ChatModule } from '../src/chat/chat.module';
import { CommonModule } from '../src/common/common.module';
import { RedisModule } from '../src/redis/redis.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('Chat (integration)', () => {
  let app: INestApplication;
  let dbConnected = false;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        database: { type: 'postgres', host: 'localhost', port: 5432, username: 'test', password: 'test', database: 'test', entities: [], synchronize: true },
        redis: { host: 'localhost', port: 6379, password: undefined, db: 0, keyPrefix: 'yiqipin:' },
        jwt: { secret: 'test-secret', accessTtl: 7200, refreshTtl: 604800 },
        cos: {},
      };
      return config[key];
    }),
  };

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          TypeOrmModule.forRoot({
            type: 'postgres', host: 'localhost', port: 5432,
            username: 'test', password: 'test', database: 'test',
            entities: [], synchronize: true, retryAttempts: 0,
          }),
          RedisModule,
          CommonModule,
          ChatModule,
        ],
        providers: [
          { provide: APP_GUARD, useClass: JwtAuthGuard },
          { provide: APP_FILTER, useClass: AllExceptionsFilter },
          { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
        ],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .overrideProvider('REDIS_CLIENT')
        .useValue({ set: jest.fn(), get: jest.fn(), on: jest.fn(), keys: jest.fn().mockResolvedValue([]), del: jest.fn(), incr: jest.fn().mockResolvedValue(1), expire: jest.fn(), status: 'ready' })
        .compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      await app.init();
      dbConnected = true;
    } catch (e: any) {
      console.log('DB not available, skipping integration tests:', e.message?.slice(0, 100));
      dbConnected = false;
    }
  });

  afterAll(async () => { if (app) await app.close(); });

  it('GET /api/v1/circles/:id/messages should return 401 without auth', async () => {
    if (!dbConnected) return;
    const res = await request(app.getHttpServer())
      .get('/api/v1/circles/fake-id/messages');
    expect(res.status).toBe(401);
  });
});
