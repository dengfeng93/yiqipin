import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { CircleMessage, MessageType } from './entities/circle-message.entity';
import { CircleMember } from '../circle/entities/circle-member.entity';
import { RedisService } from '../redis/redis.service';

describe('ChatService', () => {
  let service: ChatService;
  let mockMsgRepo: any;
  let mockMemberRepo: any;

  beforeAll(async () => {
    mockMsgRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      manager: { query: jest.fn() },
    };
    mockMemberRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(CircleMessage), useValue: mockMsgRepo },
        { provide: getRepositoryToken(CircleMember), useValue: mockMemberRepo },
        { provide: RedisService, useValue: {} },
      ],
    }).compile();
    service = module.get<ChatService>(ChatService);
  });

  it('should save a text message', async () => {
    const msgData = { circle_id: 'c1', user_id: 'u1', type: MessageType.TEXT, content: 'hello' };
    mockMsgRepo.create.mockReturnValue(msgData);
    mockMsgRepo.save.mockResolvedValue({ id: 'm1', ...msgData });
    const result = await service.saveMessage(msgData);
    expect(result.id).toBe('m1');
  });

  it('should reject recall after 2 minutes', async () => {
    const oldMsg = {
      id: 'm1',
      circle_id: 'c1',
      user_id: 'u1',
      content: 'old',
      created_at: new Date(Date.now() - 3 * 60 * 1000),
    };
    mockMsgRepo.findOne.mockResolvedValue(oldMsg);
    await expect(service.recall('c1', 'm1', 'u1')).rejects.toThrow('超过2分钟无法撤回');
  });

  it('should check membership', async () => {
    mockMemberRepo.findOne.mockResolvedValue({ circle_id: 'c1', user_id: 'u1' });
    const isMember = await service.isMember('c1', 'u1');
    expect(isMember).toBe(true);
  });

  it('should return false for non-member', async () => {
    mockMemberRepo.findOne.mockResolvedValue(null);
    const isMember = await service.isMember('c1', 'u2');
    expect(isMember).toBe(false);
  });
});
