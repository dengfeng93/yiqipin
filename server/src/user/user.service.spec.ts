import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockRepo = () => ({
    findOne: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(UserProfile), useFactory: mockRepo },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException for non-existent user', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
  });
});
