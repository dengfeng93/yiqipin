import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { MessageType } from './entities/circle-message.entity';
import { RedisService } from '../redis/redis.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ namespace: 'chat', cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      const payload = jwt.verify(token, this.configService.get<string>('jwt.secret')!) as { sub: string };
      client.data.userId = payload.sub;

      const pingTimer = setInterval(() => {
        if (client.connected) client.emit('ping');
      }, 25000);
      let pongTimeout: NodeJS.Timeout;
      const resetPong = () => {
        clearTimeout(pongTimeout);
        pongTimeout = setTimeout(() => {
          client.disconnect(true);
        }, 30000);
      };
      resetPong();
      client.on('pong', resetPong);
      client.on('disconnect', () => {
        clearInterval(pingTimer);
        clearTimeout(pongTimeout);
      });

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { circle_id: string }) {
    const isMember = await this.chatService.isMember(data.circle_id, client.data.userId);
    if (!isMember) {
      client.emit('error', { code: 403, message: '你不是圈子成员' });
      return;
    }
    client.join(`circle:${data.circle_id}`);
    client.data.currentCircle = data.circle_id;
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { circle_id: string }) {
    client.leave(`circle:${data.circle_id}`);
  }

  @SubscribeMessage('send_msg')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: {
    circle_id: string; type: 'text' | 'image'; content?: string; image_url?: string; client_id: string;
  }) {
    const circleId = data.circle_id;
    const userId = client.data.userId;

    const circle = await this.chatService.getCircle(circleId);
    if (circle && ['dissolved', 'archived'].includes(circle.status)) {
      client.emit('error', { code: 403, message: '圈子已结束，无法发言' });
      return;
    }

    const isMember = await this.chatService.isMember(circleId, userId);
    if (!isMember) {
      client.emit('error', { code: 403, message: '你不是圈子成员' });
      return;
    }

    const msg = await this.chatService.saveMessage({
      circle_id: circleId,
      user_id: userId,
      type: data.type as MessageType,
      content: data.content,
      image_url: data.image_url,
    });

    this.server.to(`circle:${circleId}`).emit('new_msg', {
      id: msg.id,
      circle_id: circleId,
      user_id: userId,
      type: msg.type,
      content: msg.content,
      image_url: msg.image_url,
      created_at: msg.created_at,
    });

    client.emit('msg_ack', { client_id: data.client_id, msg_id: msg.id });
  }

  @SubscribeMessage('recall_msg')
  async handleRecall(@ConnectedSocket() client: Socket, @MessageBody() data: { circle_id: string; msg_id: string }) {
    try {
      await this.chatService.recall(data.circle_id, data.msg_id, client.data.userId);
      this.server.to(`circle:${data.circle_id}`).emit('msg_recalled', { circle_id: data.circle_id, msg_id: data.msg_id });
    } catch (e: any) {
      client.emit('error', { code: 400, message: e.message });
    }
  }

  @SubscribeMessage('pull_offline_msg')
  async handlePullOffline(@ConnectedSocket() client: Socket, @MessageBody() data: { circle_id: string; since: string }) {
    const messages = await this.chatService.getOfflineMessages(data.circle_id, data.since);
    client.emit('offline_msgs', { circle_id: data.circle_id, messages });
  }
}
