import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controller/auth.controller';
import { AuthService } from '../service/auth.service';

const tokens = { accessToken: 'access', refreshToken: 'refresh' };

const serviceMock = {
  signup: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('delegates to AuthService.signup and returns tokens', async () => {
      serviceMock.signup.mockResolvedValue(tokens);
      const dto = { email: 'a@b.com', name: 'User', password: 'pass1234' };
      const result = await controller.signup(dto);
      expect(result).toEqual(tokens);
      expect(serviceMock.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delegates to AuthService.login and returns tokens', async () => {
      serviceMock.login.mockResolvedValue(tokens);
      const dto = { email: 'a@b.com', password: 'pass1234' };
      const result = await controller.login(dto);
      expect(result).toEqual(tokens);
      expect(serviceMock.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('refresh', () => {
    it('delegates to AuthService.refresh using req.user', async () => {
      serviceMock.refresh.mockResolvedValue(tokens);
      const req = { user: { sub: 'user-1', refreshToken: 'raw-refresh' } } as never;
      const result = await controller.refresh(req);
      expect(result).toEqual(tokens);
      expect(serviceMock.refresh).toHaveBeenCalledWith('user-1', 'raw-refresh');
    });
  });

  describe('logout', () => {
    it('delegates to AuthService.logout using req.user.sub', async () => {
      serviceMock.logout.mockResolvedValue(undefined);
      const req = { user: { sub: 'user-1' } } as never;
      await controller.logout(req);
      expect(serviceMock.logout).toHaveBeenCalledWith('user-1');
    });
  });
});
