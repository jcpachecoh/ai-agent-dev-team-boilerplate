import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../service/auth.service';
import { AuthRepository } from '../repository/auth.repository';
import type { OperationalUser } from '@prisma/client';

const mockUser: OperationalUser = {
  id: 'user-1',
  userId: null,
  cedulaHash: 'abc123hash',
  pinHash: '$2b$12$hashedpin',
  role: 'OPERATOR' as any,
  tenantId: 'tenant-1',
  sedeId: null,
  isActive: true,
  loginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  refreshToken: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUserByTenantAndCedula: jest.fn(),
            updateLoginAttempts: jest.fn(),
            resetLoginAttempts: jest.fn(),
            findUserById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('8h'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('loginWithPin', () => {
    it('returns token and user on valid credentials', async () => {
      const hashedPin = await bcrypt.hash('1234', 12);
      const userWithHash = { ...mockUser, pinHash: hashedPin };
      const updatedUser = { ...userWithHash, loginAttempts: 0, lastLoginAt: new Date() };

      authRepository.findUserByTenantAndCedula.mockResolvedValue(userWithHash);
      authRepository.resetLoginAttempts.mockResolvedValue(updatedUser);

      const result = await service.loginWithPin('12345678', '1234', 'tenant-1');

      expect(result.token).toBe('signed-token');
      expect(result.user.id).toBe('user-1');
      expect(authRepository.resetLoginAttempts).toHaveBeenCalledWith('user-1');
    });

    it('throws UnauthorizedException for unknown cedula/tenant', async () => {
      authRepository.findUserByTenantAndCedula.mockResolvedValue(null);

      await expect(service.loginWithPin('99999999', '1234', 'tenant-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for inactive user', async () => {
      authRepository.findUserByTenantAndCedula.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.loginWithPin('12345678', '1234', 'tenant-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for wrong PIN and increments attempts', async () => {
      const userWithHash = { ...mockUser, pinHash: await bcrypt.hash('correct', 12) };
      authRepository.findUserByTenantAndCedula.mockResolvedValue(userWithHash);
      authRepository.updateLoginAttempts.mockResolvedValue(undefined as any);

      await expect(service.loginWithPin('12345678', 'wrong', 'tenant-1')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authRepository.updateLoginAttempts).toHaveBeenCalledWith('user-1', 1, null);
    });

    it('locks account when login attempts reach MAX_LOGIN_ATTEMPTS', async () => {
      const userWithHash = {
        ...mockUser,
        pinHash: await bcrypt.hash('correct', 12),
        loginAttempts: 2, // one more attempt will hit MAX (3)
      };
      authRepository.findUserByTenantAndCedula.mockResolvedValue(userWithHash);
      authRepository.updateLoginAttempts.mockResolvedValue(undefined as any);

      await expect(service.loginWithPin('12345678', 'wrong', 'tenant-1')).rejects.toThrow(
        'Too many failed attempts',
      );
      expect(authRepository.updateLoginAttempts).toHaveBeenCalledWith(
        'user-1',
        3,
        expect.any(Date),
      );
    });

    it('throws UnauthorizedException for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // locked for 10 more minutes
      };
      authRepository.findUserByTenantAndCedula.mockResolvedValue(lockedUser);

      await expect(service.loginWithPin('12345678', '1234', 'tenant-1')).rejects.toThrow(
        'Account is locked',
      );
    });
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      authRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-1');
      expect(result.id).toBe('user-1');
    });

    it('throws UnauthorizedException when user not found', async () => {
      authRepository.findUserById.mockResolvedValue(null);

      await expect(service.getUserById('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signToken', () => {
    it('calls jwtService.sign with correct payload', () => {
      service.signToken({ sub: 'user-1', tenantId: 'tenant-1', role: 'OPERATOR' });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', role: 'OPERATOR' }),
        expect.objectContaining({ subject: 'user-1' }),
      );
    });
  });
});
