import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensitiveWord } from './entities/sensitive-word.entity';
import { SensitiveWordService } from './services/sensitive-word.service';
import { ImageSafeService } from './services/image-safe.service';
import { RateLimitInterceptor } from './interceptors/rate-limit.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SensitiveWord])],
  providers: [SensitiveWordService, ImageSafeService, RateLimitInterceptor],
  exports: [SensitiveWordService, ImageSafeService, RateLimitInterceptor, TypeOrmModule],
})
export class CommonModule {}
