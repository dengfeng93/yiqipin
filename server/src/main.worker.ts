import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppWorkerModule } from './app.worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppWorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.init();
}
bootstrap();
