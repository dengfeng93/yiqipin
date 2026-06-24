import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WishpoolService } from './wishpool.service';
import { WishItem } from './entities/wish-item.entity';
import { Category } from '../circle/entities/category.entity';
import { RedisService } from '../redis/redis.service';
import { CircleService } from '../circle/circle.service';
import { ChatGateway } from '../chat/chat.gateway';

describe('WishpoolService', () => {
  let service: WishpoolService;
  const mockWishRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), createQueryBuilder: jest.fn(), update: jest.fn(), query: jest.fn() };
  const mockCategoryRepo = { findOne: jest.fn() };
  const mockRedis = { lock: jest.fn(), unlock: jest.fn() };
  const mockCircleService = { create: jest.fn() };
  const mockChatGateway = { broadcastSystem: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishpoolService,
        { provide: getRepositoryToken(WishItem), useValue: mockWishRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: CircleService, useValue: mockCircleService },
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();
    service = module.get<WishpoolService>(WishpoolService);
  });

  it('should prevent duplicate wishes for same category', async () => {
    mockWishRepo.findOne.mockResolvedValue({ id: 'existing-wish' });
    const result = await service.addOne('user-1', 'cat-1', 30.5, 104.1);
    expect(result.duplicate).toBe(true);
  });
});
