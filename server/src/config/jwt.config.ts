import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  accessTtl: parseInt(process.env.JWT_ACCESS_TTL || '7200'),
  refreshTtl: parseInt(process.env.JWT_REFRESH_TTL || '604800'),
}));
