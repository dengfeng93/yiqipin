import { Controller, Post, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @UseGuards(JwtAuthGuard)
  @Post('token')
  getToken(@CurrentUser() user: User) {
    return this.uploadService.getStsToken(user.id);
  }
}
