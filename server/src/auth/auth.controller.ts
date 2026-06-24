import { Controller, Post, Get, Delete, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('wechat-login')
  async wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto.code, { nickname: dto.nickname, avatar: dto.avatar });
  }

  @Public()
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: User) {
    const { wechat_openid, deleted_at, phone, muted_until, ...safe } = user as any;
    return safe;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@CurrentUser() user: User) {
    await this.userService.softDelete(user.id);
    return { message: '账号已注销' };
  }

  @Public()
  @Post('dev/token')
  async devToken(@Body('userId') userId: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('仅开发环境可用');
    }
    if (!userId) {
      throw new UnauthorizedException('缺少 userId');
    }
    return this.authService.generateDevToken(userId);
  }
}
