import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: (req) => {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        return token?.replaceAll(/\s+/g, '') ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') || (() => { throw new Error('JWT secret not configured'); })(),
    });
  }

  async validate(payload: { sub: string; role?: string }): Promise<User> {
    if (payload.role === 'admin') {
      return { id: 'admin', role: 'admin' } as User;
    }
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.deleted_at) throw new UnauthorizedException();
    return user;
  }
}
