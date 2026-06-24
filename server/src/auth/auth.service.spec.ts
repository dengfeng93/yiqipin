import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let profileRepo: jest.Mocked<Repository<UserProfile>>;

  const mockRepo = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  });

  const mockDataSource = { transaction: jest.fn((cb: any) => cb({ create: jest.fn(), save: jest.fn() })) };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'jwt.secret') return 'test-secret';
              if (key === 'jwt.accessTtl') return 7200;
              if (key === 'jwt.refreshTtl') return 604800;
              return '';
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepo,
        },
        {
          provide: getRepositoryToken(UserProfile),
          useFactory: mockRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    profileRepo = module.get(getRepositoryToken(UserProfile));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate tokens', async () => {
    const user = { id: 'test-uuid' } as User;
    const tokens = await service.generateTokens(user);
    expect(tokens.accessToken).toBe('mock-token');
    expect(tokens.refreshToken).toBe('mock-token');
  });
});
