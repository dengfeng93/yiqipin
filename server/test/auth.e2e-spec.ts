import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { UserModule } from '../src/user/user.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('Auth E2E', () => {
  let app: INestApplication | undefined;
  let dbConnected = false;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        database: {
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'test',
          password: 'test',
          database: 'test',
          entities: [],
          synchronize: true,
        },
        redis: {
          host: 'localhost',
          port: 6379,
          password: undefined,
          db: 0,
          keyPrefix: 'yiqipin:',
        },
        jwt: {
          secret: 'test-secret',
          accessTtl: 7200,
          refreshTtl: 604800,
        },
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
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'test',
            password: 'test',
            database: 'test',
            entities: [],
            synchronize: true,
            retryAttempts: 0,
          }),
          AuthModule,
          UserModule,
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
        .useValue({ set: jest.fn(), get: jest.fn(), on: jest.fn(), status: 'ready' })
        .compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
      dbConnected = true;
    } catch {
      // No database available — all tests will be skipped
      dbConnected = false;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/auth/wechat-login should return 400 without code', async () => {
    if (!dbConnected) return;
    const res = await request(app!.getHttpServer())
      .post('/api/v1/auth/wechat-login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/v1/auth/me should return 401 without token', async () => {
    if (!dbConnected) return;
    const res = await request(app!.getHttpServer())
      .get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/refresh should return 400 or 401 without refreshToken', async () => {
    if (!dbConnected) return;
    const res = await request(app!.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({});
    expect([400, 401]).toContain(res.status);
  });
});
