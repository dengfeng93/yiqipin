import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api/v1');

  // DEBUG: log requests for troubleshooting
  app.use((req: any, _res: any, next: any) => {
    if (req.method !== 'GET') {
      console.log('[DEBUG] %s %s | Body: %s', req.method, req.url, JSON.stringify(req.body));
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const corsOriginEnv = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOriginEnv === 'true'
      ? true
      : corsOriginEnv
      || (process.env.NODE_ENV === 'production' ? false : true),
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
