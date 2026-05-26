import { Test, TestingModule } from '@nestjs/testing';
import { OperationalRole } from '@prisma/client';
import { MesAuthRepository } from '../repository/mes-auth.repository';
import { PrismaService } from '../../../prisma/prisma.service';

const mockOperationalUser = {
  id: 'op-user-1',
  cedulaHash: 'abc123hash',
  pinHash: 'pinhash',
  role: OperationalRole.OPERATOR,
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

const prismaMock = {
  operationalUser: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('MesAuthRepository', () => {
  let repository: MesAuthRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MesAuthRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<MesAuthRepository>(MesAuthRepository);
    jest.clearAllMocks();
  });

  describe('findByCedulaHash', () => {
    it('returns user when found', async () => {
      prismaMock.operationalUser.findUnique.mockResolvedValue(mockOperationalUser);
      const result = await repository.findByCedulaHash('tenant-1', 'abc123hash');
      expect(result).toEqual(mockOperationalUser);
      expect(prismaMock.operationalUser.findUnique).toHaveBeenCalledWith({
        where: { tenantId_cedulaHash: { tenantId: 'tenant-1', cedulaHash: 'abc123hash' } },
      });
    });

    it('returns null when not found', async () => {
      prismaMock.operationalUser.findUnique.mockResolvedValue(null);
      const result = await repository.findByCedulaHash('tenant-1', 'unknownhash');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      prismaMock.operationalUser.findUnique.mockResolvedValue(mockOperationalUser);
      const result = await repository.findById('op-user-1');
      expect(result).toEqual(mockOperationalUser);
      expect(prismaMock.operationalUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'op-user-1' },
      });
    });

    it('returns null when not found', async () => {
      prismaMock.operationalUser.findUnique.mockResolvedValue(null);
      const result = await repository.findById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('incrementLoginAttempts', () => {
    it('calls update with increment: 1 on loginAttempts', async () => {
      prismaMock.operationalUser.update.mockResolvedValue(mockOperationalUser);
      await repository.incrementLoginAttempts('op-user-1');
      expect(prismaMock.operationalUser.update).toHaveBeenCalledWith({
        where: { id: 'op-user-1' },
        data: { loginAttempts: { increment: 1 } },
      });
    });
  });

  describe('lockUser', () => {
    it('calls update with the provided lockedUntil date', async () => {
      prismaMock.operationalUser.update.mockResolvedValue(mockOperationalUser);
      const lockDate = new Date('2026-05-25T23:00:00Z');
      await repository.lockUser('op-user-1', lockDate);
      expect(prismaMock.operationalUser.update).toHaveBeenCalledWith({
        where: { id: 'op-user-1' },
        data: { lockedUntil: lockDate },
      });
    });
  });

  describe('resetLoginAttempts', () => {
    it('calls update with loginAttempts: 0, lockedUntil: null, and lastLoginAt', async () => {
      prismaMock.operationalUser.update.mockResolvedValue(mockOperationalUser);
      await repository.resetLoginAttempts('op-user-1');
      expect(prismaMock.operationalUser.update).toHaveBeenCalledWith({
        where: { id: 'op-user-1' },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: expect.any(Date),
        },
      });
    });
  });

  describe('saveRefreshToken', () => {
    it('calls update with the hashed token', async () => {
      prismaMock.operationalUser.update.mockResolvedValue(mockOperationalUser);
      await repository.saveRefreshToken('op-user-1', 'hashed-refresh-token');
      expect(prismaMock.operationalUser.update).toHaveBeenCalledWith({
        where: { id: 'op-user-1' },
        data: { refreshToken: 'hashed-refresh-token' },
      });
    });

    it('calls update with null to clear the refresh token', async () => {
      prismaMock.operationalUser.update.mockResolvedValue(mockOperationalUser);
      await repository.saveRefreshToken('op-user-1', null);
      expect(prismaMock.operationalUser.update).toHaveBeenCalledWith({
        where: { id: 'op-user-1' },
        data: { refreshToken: null },
      });
    });
  });
});
