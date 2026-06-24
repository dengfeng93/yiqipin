import { registerAs } from '@nestjs/config';

export default registerAs('cos', () => ({
  secretId: process.env.COS_SECRET_ID,
  secretKey: process.env.COS_SECRET_KEY,
  bucket: process.env.COS_BUCKET,
  region: process.env.COS_REGION || 'ap-guangzhou',
}));
