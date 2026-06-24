import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CircleMessage } from './entities/circle-message.entity';
import { CircleMember } from '../circle/entities/circle-member.entity';

import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([CircleMessage, CircleMember]), RedisModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
