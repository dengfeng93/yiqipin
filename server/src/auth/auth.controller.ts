import { Controller, Post, Get, Delete, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('wechat-login')
  async wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto.code, { nickname: dto.nickname, avatar: dto.avatar });
  }

  @Public()
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { wechat_openid, deleted_at, ...safe } = user as any;
    return safe;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@CurrentUser() user: User) {
    // Soft delete will be implemented in UserService (Task 7)
    // For now, leave placeholder — it will be wired when UserModule is added
    throw new Error('Not implemented — requires UserService');
  }
}
