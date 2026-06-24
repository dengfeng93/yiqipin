import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {}

  async getStsToken(userId: string) {
    const cosConfig = this.config.get('cos');
    // STS token generation for COS direct upload
    // In production, use qcloud-cos-sts SDK or Tencent Cloud STS API
    return {
      bucket: cosConfig.bucket,
      region: cosConfig.region,
      prefix: `chat-images/${userId}/`,
      // Placeholder: actual STS integration requires qcloud-cos-sts SDK
    };
  }
}
