import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('circles')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':circleId/messages')
  async getMessageHistory(
    @Param('circleId') circleId: string,
    @CurrentUser() user: User,
    @Query('before') before?: string,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getHistory(circleId, before, limit, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':circleId/messages/:msgId')
  async recallMessage(
    @Param('circleId') circleId: string,
    @Param('msgId') msgId: string,
    @CurrentUser() user: User,
  ) {
    return this.chatService.recall(circleId, msgId, user.id);
  }
}
