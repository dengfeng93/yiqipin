import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            generateDevToken: jest.fn().mockResolvedValue({
              accessToken: 'test-access',
              refreshToken: 'test-refresh',
              user: { id: 'u1', nickname: '测试' },
            }),
          },
        },
        { provide: UserService, useValue: {} },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  describe('devToken', () => {
    it('should return tokens for valid userId', async () => {
      const result = await controller.devToken('u1');
      expect(result.accessToken).toBe('test-access');
      expect(result.refreshToken).toBe('test-refresh');
      expect(service.generateDevToken).toHaveBeenCalledWith('u1');
    });

    it('should throw if userId is missing', async () => {
      await expect(controller.devToken('')).rejects.toThrow('缺少 userId');
    });
  });
});
