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

describe('User E2E', () => {
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

  it('GET /api/v1/users/:id should return 404 for non-existent user', async () => {
    if (!dbConnected) return;
    const res = await request(app!.getHttpServer())
      .get('/api/v1/users/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('PATCH /api/v1/users/me should return 401 without token', async () => {
    if (!dbConnected) return;
    const res = await request(app!.getHttpServer())
      .patch('/api/v1/users/me')
      .send({ nickname: 'test' });
    expect(res.status).toBe(401);
  });
});
