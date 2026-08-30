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
    create: jest.fn(),
    update: jest.fn(),
  },
  userLocation: {
    findFirst: jest.fn(),
  },
  location: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
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

  describe('findLocationIdByUserId', () => {
    it('returns the first assigned location for the user in tenant', async () => {
      prismaMock.userLocation.findFirst.mockResolvedValue({ locationId: 'location-1' });

      const result = await repository.findLocationIdByUserId('tenant-1', 'user-1');

      expect(result).toBe('location-1');
      expect(prismaMock.userLocation.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', userId: 'user-1' },
        select: { locationId: true },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('returns null when user has no location assignment', async () => {
      prismaMock.userLocation.findFirst.mockResolvedValue(null);

      const result = await repository.findLocationIdByUserId('tenant-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('findActiveLocationsByUserId', () => {
    it('returns active locations assigned to the global user', async () => {
      const locations = [
        {
          id: 'location-1',
          name: 'Sede 1',
          code: 'PL-01',
          city: 'Bogotá',
          address: 'Calle 1',
        },
      ];
      prismaMock.location.findMany.mockResolvedValue(locations);

      const result = await repository.findActiveLocationsByUserId('tenant-1', 'user-1');

      expect(result).toEqual(locations);
      expect(prismaMock.location.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          deletedAt: null,
          isActive: true,
          users: { some: { userId: 'user-1', tenantId: 'tenant-1' } },
        },
        select: { id: true, name: true, code: true, city: true, address: true },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findLocationById', () => {
    it('returns location summary when active location exists', async () => {
      const location = {
        id: 'location-1',
        name: 'Sede 1',
        code: 'PL-01',
        city: 'Bogotá',
        address: 'Calle 1',
      };
      prismaMock.location.findFirst.mockResolvedValue(location);

      const result = await repository.findLocationById('tenant-1', 'location-1');

      expect(result).toEqual(location);
      expect(prismaMock.location.findFirst).toHaveBeenCalledWith({
        where: { id: 'location-1', tenantId: 'tenant-1', deletedAt: null, isActive: true },
        select: { id: true, name: true, code: true, city: true, address: true },
      });
    });

    it('returns null when location is missing', async () => {
      prismaMock.location.findFirst.mockResolvedValue(null);

      const result = await repository.findLocationById('tenant-1', 'missing');

      expect(result).toBeNull();
    });
  });

  describe('updateCedulaHash', () => {
    it('updates cedula hash for the operational user', async () => {
      prismaMock.operationalUser.update.mockResolvedValue({
        ...mockOperationalUser,
        cedulaHash: 'new-hash',
      });

      const result = await repository.updateCedulaHash('op-user-1', 'new-hash');

      expect(result.cedulaHash).toBe('new-hash');
      expect(prismaMock.operationalUser.update).toHaveBeenCalledWith({
        where: { id: 'op-user-1' },
        data: { cedulaHash: 'new-hash' },
      });
    });
  });

  describe('createUser', () => {
    it('calls prisma create with hashed fields and defaults', async () => {
      prismaMock.operationalUser.create.mockResolvedValue(mockOperationalUser);
      const result = await repository.createUser({
        tenantId: 'tenant-1',
        cedulaHash: 'hash-abc',
        pinHash: 'pin-hash',
        role: OperationalRole.OPERATOR,
        sedeId: 'sede-1',
      });
      expect(result).toEqual(mockOperationalUser);
      expect(prismaMock.operationalUser.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          cedulaHash: 'hash-abc',
          pinHash: 'pin-hash',
          role: OperationalRole.OPERATOR,
          sedeId: 'sede-1',
          isActive: true,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
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
