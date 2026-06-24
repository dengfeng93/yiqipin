import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AuditResult {
  passed: boolean;
  label?: string;
  suggestion?: string;
}

@Injectable()
export class ImageSafeService {
  private logger = new Logger('ImageSafe');
  private endpoint: string;

  constructor(private config: ConfigService) {
    this.endpoint = this.config.get('COS_IMAGE_SAFE_ENDPOINT') || '';
  }

  async audit(imageUrl: string): Promise<AuditResult> {
    if (!this.endpoint) {
      this.logger.warn('COS_IMAGE_SAFE_ENDPOINT 未配置，图片审核跳过');
      return { passed: true };
    }

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });
      const data = await res.json() as any;
      const suggestion = data.Response?.Suggestion || 'Pass';
      return {
        passed: suggestion === 'Pass',
        label: data.Response?.Label,
        suggestion,
      };
    } catch (err: any) {
      this.logger.error(`图片审核失败: ${err.message}`);
      return { passed: true, label: 'audit_skipped', suggestion: 'Pass' };
    }
  }
}
