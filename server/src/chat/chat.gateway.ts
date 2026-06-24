import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { MessageType } from './entities/circle-message.entity';
import { RedisService } from '../redis/redis.service';
import { SensitiveWordService } from '../common/services/sensitive-word.service';
import { ImageSafeService } from '../common/services/image-safe.service';
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
    private sensitiveWord: SensitiveWordService,
    private imageSafe: ImageSafeService,
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

    // 敏感词检测（文字消息）
    if (data.type === 'text' && data.content) {
      const check = this.sensitiveWord.check(data.content);
      if (!check.passed) {
        client.emit('error', { code: 400, message: '消息包含敏感内容，无法发送' });
        this.chatService.recordViolation(userId, circleId, null, 'warn', JSON.stringify({ type: 'sensitive_word', word: check.hit_word }));
        const mutedUntil = new Date(Date.now() + 3600000).toISOString();
        this.notifyMuted(userId, circleId, mutedUntil, '敏感词违规');
        return;
      }
    }

    // 图片安全审核（图片消息）
    if (data.type === 'image' && data.image_url) {
      const audit = await this.imageSafe.audit(data.image_url);
      if (!audit.passed) {
        client.emit('error', { code: 400, message: '图片内容违规，无法发送' });
        this.chatService.recordViolation(userId, circleId, null, 'warn', JSON.stringify({ type: 'image_audit', label: audit.label }));
        const mutedUntil = new Date(Date.now() + 3600000).toISOString();
        this.notifyMuted(userId, circleId, mutedUntil, '图片违规');
        return;
      }
    }

    // Chat 限流: 每用户1条/秒
    const rlKey = `rl:chat:${userId}`;
    const redisClient = this.redis.getClient();
    const count = await redisClient.incr(rlKey);
    await redisClient.expire(rlKey, 1);
    if (count > 1) {
      client.emit('error', { code: 429, message: '发言过于频繁' });
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

  broadcastSystem(circleId: string, action: string, extra?: Record<string, any>) {
    this.server.to(`circle:${circleId}`).emit('system', {
      circle_id: circleId,
      action,
      timestamp: new Date().toISOString(),
      ...extra,
    });
  }

  private notifyMuted(userId: string, circleId: string, until: string, reason: string) {
    this.server.to(`user:${userId}`).emit('muted', {
      circle_id: circleId,
      until,
      reason,
    });
  }
}
