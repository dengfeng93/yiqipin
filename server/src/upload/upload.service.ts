import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private logger = new Logger('UploadService');

  constructor(private config: ConfigService) {}

  async getStsToken(userId: string) {
    const cosConfig = this.config.get('cos');
    const secretId = cosConfig.secretId;
    const secretKey = cosConfig.secretKey;

    if (!secretId || !secretKey) {
      this.logger.warn('COS credentials not configured, returning read-only placeholder');
      return {
        bucket: cosConfig.bucket,
        region: cosConfig.region,
        prefix: `chat-images/${userId}/`,
        credentials: null,
        note: 'COS credentials not configured',
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiredTime = now + 1800; // 30 minutes
    const prefix = `chat-images/${userId}/`;

    // Build minimal STS policy for putObject to user's prefix
    const policy = JSON.stringify({
      version: '2.0',
      statement: [{
        action: ['name/cos:PutObject'],
        effect: 'allow',
        resource: [`qcs::cos:${cosConfig.region}:uid/*:${cosConfig.bucket}/${prefix}*`],
      }],
    });

    // Use Tencent Cloud STS API via raw federation token
    // In production, use the qcloud-cos-sts SDK for proper key derivation
    const startTime = now;
    const rawKey = crypto
      .createHmac('sha1', secretKey)
      .update(`get-authorization-now${now}${expiredTime}`)
      .digest('hex');

    return {
      bucket: cosConfig.bucket,
      region: cosConfig.region,
      prefix,
      credentials: {
        tmpSecretId: 'STS.' + crypto.randomBytes(16).toString('hex'),
        tmpSecretKey: crypto.randomBytes(32).toString('hex'),
        sessionToken: crypto.randomBytes(32).toString('base64'),
        expiredTime,
        startTime,
        note: 'STS credentials placeholder — use qcloud-cos-sts SDK in production',
      },
    };
  }
}
