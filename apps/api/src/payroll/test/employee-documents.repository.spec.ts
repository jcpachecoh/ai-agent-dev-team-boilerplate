import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeDocumentsRepository } from '../repository/employee-documents.repository';

const tenantId = 'tenant-1';
const employeeId = 'emp-1';

const mockRow = {
  id: 'doc-1',
  tenantId,
  employeeId,
  fileType: 'IDENTIFICATION' as const,
  title: 'Cédula de ciudadanía',
  issueDate: null,
  expiryDate: null,
  storageObjectId: 'storage-1',
  notes: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  storageObject: { mimeType: 'application/pdf' },
};

describe('EmployeeDocumentsRepository', () => {
  let repo: EmployeeDocumentsRepository;
  let prisma: { employeeDocument: jest.Mocked<Record<string, jest.Mock>> };

  beforeEach(async () => {
    prisma = {
      employeeDocument: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeDocumentsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repo = module.get(EmployeeDocumentsRepository);
  });

  describe('create', () => {
    it('creates with tenantId, employeeId and fileType', async () => {
      // Arrange
      prisma.employeeDocument.create.mockResolvedValue(mockRow);

      // Act
      const result = await repo.create(tenantId, {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(prisma.employeeDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId, employeeId, fileType: 'IDENTIFICATION' }),
        }),
      );
      expect(result.mimeType).toBe('application/pdf');
    });

    it('sets optional dates to null when not provided', async () => {
      // Arrange
      prisma.employeeDocument.create.mockResolvedValue(mockRow);

      // Act
      await repo.create(tenantId, {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(prisma.employeeDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ issueDate: null, expiryDate: null, notes: null }),
        }),
      );
    });

    it('passes issueDate and expiryDate when provided', async () => {
      // Arrange
      const issueDate = new Date('2024-01-01');
      const expiryDate = new Date('2029-01-01');
      prisma.employeeDocument.create.mockResolvedValue({ ...mockRow, issueDate, expiryDate });

      // Act
      const result = await repo.create(tenantId, {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
        issueDate,
        expiryDate,
        notes: 'Vigente',
      });

      // Assert
      expect(prisma.employeeDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ issueDate, expiryDate, notes: 'Vigente' }),
        }),
      );
      expect(result.issueDate).toEqual(issueDate);
    });
  });

  describe('findById', () => {
    it('queries with id, tenantId and deletedAt null', async () => {
      // Arrange
      prisma.employeeDocument.findFirst.mockResolvedValue(mockRow);

      // Act
      const result = await repo.findById(tenantId, 'doc-1');

      // Assert
      expect(prisma.employeeDocument.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1', tenantId, deletedAt: null },
        }),
      );
      expect(result?.id).toBe('doc-1');
    });

    it('returns null when not found', async () => {
      // Arrange
      prisma.employeeDocument.findFirst.mockResolvedValue(null);

      // Act
      const result = await repo.findById(tenantId, 'missing');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmployee', () => {
    it('filters by tenantId, employeeId and excludes soft-deleted by default', async () => {
      // Arrange
      prisma.employeeDocument.findMany.mockResolvedValue([mockRow]);

      // Act
      const result = await repo.findByEmployee(tenantId, employeeId);

      // Assert
      expect(prisma.employeeDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId, employeeId, deletedAt: null }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('applies fileType filter when provided', async () => {
      // Arrange
      prisma.employeeDocument.findMany.mockResolvedValue([]);

      // Act
      await repo.findByEmployee(tenantId, employeeId, { fileType: 'DRIVER_LICENSE' });

      // Assert
      expect(prisma.employeeDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ fileType: 'DRIVER_LICENSE' }),
        }),
      );
    });

    it('omits deletedAt filter when includeDeleted is true', async () => {
      // Arrange
      prisma.employeeDocument.findMany.mockResolvedValue([mockRow]);

      // Act
      await repo.findByEmployee(tenantId, employeeId, { includeDeleted: true });

      // Assert
      const callArg = prisma.employeeDocument.findMany.mock.calls[0]?.[0] as {
        where: Record<string, unknown>;
      };
      expect(callArg.where).not.toHaveProperty('deletedAt');
    });

    it('maps mimeType from included storageObject', async () => {
      // Arrange
      prisma.employeeDocument.findMany.mockResolvedValue([mockRow]);

      // Act
      const result = await repo.findByEmployee(tenantId, employeeId);

      // Assert
      expect(result[0]?.mimeType).toBe('application/pdf');
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt via update', async () => {
      // Arrange
      const deletedAt = new Date();
      prisma.employeeDocument.update.mockResolvedValue({ ...mockRow, deletedAt });

      // Act
      const result = await repo.softDelete(tenantId, 'doc-1');

      // Assert
      expect(prisma.employeeDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'doc-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws on tenant mismatch after update', async () => {
      // Arrange
      prisma.employeeDocument.update.mockResolvedValue({
        ...mockRow,
        tenantId: 'other-tenant',
        deletedAt: new Date(),
      });

      // Act & Assert
      await expect(repo.softDelete(tenantId, 'doc-1')).rejects.toThrow('Tenant mismatch');
    });
  });
});
