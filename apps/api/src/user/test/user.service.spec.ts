import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../service/user.service';
import { UserRepository } from '../repository/user.repository';

const globalUserId = '11111111-0000-0000-0000-000000000004';
const operationalUserId = 'dddddddd-0000-0000-0000-000000000004';
const tenantId = 'palos-de-lena';

const linkedOperationalProfile = {
  id: operationalUserId,
  userId: globalUserId,
  role: 'OWNER',
  tenantId,
  sedeId: null,
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
};

const repoMock = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  updateProfile: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: UserRepository, useValue: repoMock }],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  describe('getOperationalProfile', () => {
    it('returns linked OperationalUser when global user id matches userId FK', async () => {
      repoMock.findByUserId.mockResolvedValue(linkedOperationalProfile);

      const result = await service.getOperationalProfile(globalUserId, tenantId);

      expect(result).toEqual(linkedOperationalProfile);
      expect(repoMock.findByUserId).toHaveBeenCalledWith(globalUserId);
      expect(repoMock.findById).not.toHaveBeenCalled();
    });

    it('returns null when no OperationalUser is linked (userId unset)', async () => {
      repoMock.findByUserId.mockResolvedValue(null);

      const result = await service.getOperationalProfile(globalUserId, tenantId);

      expect(result).toBeNull();
    });

    it('returns null when linked profile belongs to another tenant', async () => {
      repoMock.findByUserId.mockResolvedValue({
        ...linkedOperationalProfile,
        tenantId: 'other-tenant',
      });

      const result = await service.getOperationalProfile(globalUserId, tenantId);

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('throws when updating a missing profile', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.updateProfile(globalUserId, { sedeId: 's-1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('updates the profile when the user exists', async () => {
      repoMock.findById.mockResolvedValue(linkedOperationalProfile);
      repoMock.updateProfile.mockResolvedValue({ ...linkedOperationalProfile, sedeId: 's-1' });

      const result = await service.updateProfile(globalUserId, { sedeId: 's-1' });

      expect(result).toEqual({ ...linkedOperationalProfile, sedeId: 's-1' });
      expect(repoMock.updateProfile).toHaveBeenCalledWith(globalUserId, { sedeId: 's-1' });
    });
  });
});
