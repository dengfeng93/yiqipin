import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('circles')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':circleId/messages')
  async getMessageHistory(
    @Param('circleId') circleId: string,
    @Query('before') before?: string,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getHistory(circleId, before, limit);
  }
}
