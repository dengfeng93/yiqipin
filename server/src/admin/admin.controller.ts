import { Controller, Post, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Public } from '../common/decorators/public.decorator';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Public()
  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.login(dto.username, dto.password);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('keyword') keyword?: string) {
    return this.adminService.getUsers(page, limit, keyword);
  }

  @Patch('users/:id/ban')
  toggleBan(@Param('id') id: string) {
    return this.adminService.toggleUserBan(id);
  }

  @Get('circles')
  getCircles(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.adminService.getCircles(page, limit, status);
  }

  @Delete('circles/:id')
  forceDissolve(@Param('id') id: string) {
    return this.adminService.forceDissolveCircle(id);
  }

  @Get('reports')
  getReports(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getReports(page, limit);
  }

  @Post('reports/:id/handle')
  handleReport(@Param('id') id: string, @Body('action') action: 'dismiss' | 'confirm') {
    return this.adminService.handleReport(id, action);
  }

  @Get('sensitive-words')
  getSensitiveWords(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.getSensitiveWords(page, limit);
  }

  @Post('sensitive-words')
  addSensitiveWord(@Body('word') word: string, @Body('level') level: number) {
    return this.adminService.addSensitiveWord(word, level);
  }

  @Delete('sensitive-words/:id')
  deleteSensitiveWord(@Param('id') id: string) {
    return this.adminService.deleteSensitiveWord(id);
  }

  @Patch('categories/:id/threshold')
  updateThreshold(@Param('id') id: string, @Body('threshold') threshold: number) {
    return this.adminService.updateWishThreshold(id, threshold);
  }
}
