import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAssetsRepository } from '../repository/employee-assets.repository';
import { PrismaService } from '../../prisma/prisma.service';

const tenantId = 'tenant-1';
const employeeId = 'emp-1';

const mockRow = {
  id: 'asset-1',
  tenantId,
  employeeId,
  assetName: 'Laptop',
  type: 'FINANCIAL' as const,
  assignmentDate: new Date('2025-01-01'),
  value: { toString: () => '3500000' } as never,
  status: 'ACTIVO' as const,
  notes: null,
  storageObjectId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EmployeeAssetsRepository', () => {
  let repo: EmployeeAssetsRepository;
  let prisma: { employeeAsset: jest.Mocked<Record<string, jest.Mock>> };

  beforeEach(async () => {
    prisma = {
      employeeAsset: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeAssetsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repo = module.get(EmployeeAssetsRepository);
  });

  describe('create', () => {
    it('creates with tenantId and all fields', async () => {
      // Arrange
      prisma.employeeAsset.create.mockResolvedValue(mockRow);

      // Act
      const result = await repo.create(tenantId, {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: '3500000',
      });

      // Assert
      expect(prisma.employeeAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId, employeeId, assetName: 'Laptop' }),
        }),
      );
      expect(result.value).toBe('3500000');
    });

    it('passes storageObjectId to prisma when provided', async () => {
      // Arrange
      prisma.employeeAsset.create.mockResolvedValue({ ...mockRow, storageObjectId: 'storage-1' });

      // Act
      const result = await repo.create(tenantId, {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: '3500000',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(prisma.employeeAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ storageObjectId: 'storage-1' }),
        }),
      );
      expect(result.storageObjectId).toBe('storage-1');
    });

    it('sets storageObjectId to null when not provided', async () => {
      // Arrange
      prisma.employeeAsset.create.mockResolvedValue(mockRow);

      // Act
      await repo.create(tenantId, {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: '3500000',
      });

      // Assert
      expect(prisma.employeeAsset.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ storageObjectId: null }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('queries with id and tenantId', async () => {
      prisma.employeeAsset.findFirst.mockResolvedValue(mockRow);

      const result = await repo.findById(tenantId, 'asset-1');

      expect(prisma.employeeAsset.findFirst).toHaveBeenCalledWith({
        where: { id: 'asset-1', tenantId },
      });
      expect(result?.id).toBe('asset-1');
    });

    it('returns null when not found', async () => {
      prisma.employeeAsset.findFirst.mockResolvedValue(null);

      const result = await repo.findById(tenantId, 'missing');

      expect(result).toBeNull();
    });
  });

  describe('findByEmployee', () => {
    it('queries with employeeId and tenantId', async () => {
      prisma.employeeAsset.findMany.mockResolvedValue([mockRow]);

      const result = await repo.findByEmployee(tenantId, employeeId);

      expect(prisma.employeeAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, employeeId }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('includes status filter when provided', async () => {
      prisma.employeeAsset.findMany.mockResolvedValue([]);

      await repo.findByEmployee(tenantId, employeeId, { status: 'ACTIVO' });

      expect(prisma.employeeAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVO' }),
        }),
      );
    });

    it('includes type filter when provided', async () => {
      prisma.employeeAsset.findMany.mockResolvedValue([]);

      await repo.findByEmployee(tenantId, employeeId, { type: 'EDUCATIONAL' });

      expect(prisma.employeeAsset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'EDUCATIONAL' }),
        }),
      );
    });
  });

  describe('findActiveByEmployeeAndName', () => {
    it('always includes status ACTIVO', async () => {
      prisma.employeeAsset.findFirst.mockResolvedValue(null);

      await repo.findActiveByEmployeeAndName(tenantId, employeeId, 'Laptop');

      expect(prisma.employeeAsset.findFirst).toHaveBeenCalledWith({
        where: { tenantId, employeeId, assetName: 'Laptop', status: 'ACTIVO' },
      });
    });
  });

  describe('update', () => {
    it('updates by id and verifies tenantId', async () => {
      // Arrange
      prisma.employeeAsset.update.mockResolvedValue(mockRow);

      // Act
      const result = await repo.update(tenantId, 'asset-1', { status: 'RETORNADO' });

      // Assert
      expect(prisma.employeeAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'asset-1' },
          data: expect.objectContaining({ status: 'RETORNADO' }),
        }),
      );
      expect(result.status).toBe('ACTIVO');
    });

    it('includes storageObjectId in update data when provided', async () => {
      // Arrange
      prisma.employeeAsset.update.mockResolvedValue({ ...mockRow, storageObjectId: 'storage-1' });

      // Act
      const result = await repo.update(tenantId, 'asset-1', { storageObjectId: 'storage-1' });

      // Assert
      expect(prisma.employeeAsset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ storageObjectId: 'storage-1' }),
        }),
      );
      expect(result.storageObjectId).toBe('storage-1');
    });

    it('does not include storageObjectId in data when not provided', async () => {
      // Arrange
      prisma.employeeAsset.update.mockResolvedValue(mockRow);

      // Act
      await repo.update(tenantId, 'asset-1', { status: 'RETORNADO' });

      // Assert
      const callArg = prisma.employeeAsset.update.mock.calls[0]?.[0] as {
        data: Record<string, unknown>;
      };
      expect(callArg.data).not.toHaveProperty('storageObjectId');
    });

    it('throws on tenant mismatch', async () => {
      // Arrange
      prisma.employeeAsset.update.mockResolvedValue({ ...mockRow, tenantId: 'other-tenant' });

      // Act & Assert
      await expect(repo.update(tenantId, 'asset-1', {})).rejects.toThrow('Tenant mismatch');
    });
  });
});
