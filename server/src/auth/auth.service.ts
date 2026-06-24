import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';

interface WechatSession {
  openid: string;
  session_key: string;
  unionid?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async wechatLogin(code: string, deviceInfo?: { nickname?: string; avatar?: string }) {
    const session = await this.code2session(code);
    let user = await this.userRepo.findOne({ where: { wechat_openid: session.openid } });

    if (!user) {
      user = await this.dataSource.transaction(async (manager) => {
        const u = manager.create(User, {
          wechat_openid: session.openid,
          nickname: deviceInfo?.nickname || `用户${session.openid.slice(-6)}`,
          avatar: deviceInfo?.avatar || '',
        });
        const savedUser = await manager.save(u);

        await manager.save(manager.create(UserProfile, {
          user_id: savedUser.id,
          new_user_badge: true,
        }));

        return savedUser;
      });
    }

    if (user.deleted_at) {
      throw new UnauthorizedException('账号已注销');
    }

    const tokens = await this.generateTokens(user);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  private async code2session(code: string): Promise<WechatSession> {
    const appId = this.config.get('WECHAT_APP_ID');
    const secret = this.config.get('WECHAT_APP_SECRET');
    if (!appId || !secret) {
      throw new UnauthorizedException('微信配置缺失，请联系管理员');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.errcode) {
        throw new UnauthorizedException(`微信登录失败: ${data.errmsg}`);
      }

      return data as WechatSession;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('微信服务暂时不可用，请稍后重试');
    }
  }

  async generateTokens(user: User) {
    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('jwt.accessTtl'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.config.get('jwt.refreshTtl'),
    });
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || user.deleted_at) {
        throw new UnauthorizedException();
      }
      const accessToken = this.jwtService.sign({ sub: user.id }, {
        expiresIn: this.config.get('jwt.accessTtl'),
      });
      return { accessToken, user: this.sanitizeUser(user) };
    } catch {
      throw new UnauthorizedException('refresh token 无效或已过期');
    }
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { wechat_openid, deleted_at, ...safe } = user as any;
    return safe;
  }
}
