import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { UserRepository } from '../repository/user.repository';
import type { OperationalUser } from '@prisma/client';

const mockUser: OperationalUser = {
  id: 'user-1',
  userId: null,
  cedulaHash: 'hash',
  pinHash: 'pinhash',
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

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            updateProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(UserRepository);
  });

  afterEach(() => jest.resetAllMocks());

  describe('getMe', () => {
    it('returns user when found', async () => {
      repository.findById.mockResolvedValue(mockUser);
      const result = await service.getMe('user-1');
      expect(result?.id).toBe('user-1');
    });

    it('returns null when not found', async () => {
      repository.findById.mockResolvedValue(null);
      const result = await service.getMe('missing');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('updates sedeId', async () => {
      const updated = { ...mockUser, sedeId: 'sede-1' };
      repository.findById.mockResolvedValue(mockUser);
      repository.updateProfile.mockResolvedValue(updated);
      const result = await service.updateProfile('user-1', { sedeId: 'sede-1' });
      expect(result.sedeId).toBe('sede-1');
    });

    it('throws NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.updateProfile('missing', {})).rejects.toThrow(NotFoundException);
    });
  });
});
