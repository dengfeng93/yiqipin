import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CircleService } from './circle.service';
import { Circle } from './entities/circle.entity';
import { CircleMember } from './entities/circle-member.entity';
import { Category } from './entities/category.entity';
import { WishItem } from '../wishpool/entities/wish-item.entity';
import { RedisService } from '../redis/redis.service';
import { ChatGateway } from '../chat/chat.gateway';

describe('CircleService', () => {
  let service: CircleService;
  const mockCircleRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), createQueryBuilder: jest.fn() };
  const mockMemberRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), count: jest.fn(), delete: jest.fn(), find: jest.fn(), update: jest.fn() };
  const mockCategoryRepo = { findOne: jest.fn(), find: jest.fn() };
  const mockWishRepo = { createQueryBuilder: jest.fn() };
  const mockRedis = { zadd: jest.fn(), zrem: jest.fn() };
  const mockChatGateway = { broadcastSystem: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircleService,
        { provide: getRepositoryToken(Circle), useValue: mockCircleRepo },
        { provide: getRepositoryToken(CircleMember), useValue: mockMemberRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(WishItem), useValue: mockWishRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();
    service = module.get<CircleService>(CircleService);
  });

  it('should throw when joining non-existent circle', async () => {
    mockCircleRepo.findOne.mockResolvedValue(null);
    await expect(service.join('bad-id', 'user-1')).rejects.toThrow('圈子不存在');
  });

  it('should not allow creator to leave', async () => {
    mockCircleRepo.findOne.mockResolvedValue({ id: '1', status: 'active' });
    mockMemberRepo.findOne.mockResolvedValue({ circle_id: '1', user_id: 'user-1', role: 'creator' });
    await expect(service.leave('1', 'user-1')).rejects.toThrow('创建者不能退出');
  });
});
