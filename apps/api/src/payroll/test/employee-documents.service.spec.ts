import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../../storage/service/storage.service';
import { EmployeeDocumentsRepository } from '../repository/employee-documents.repository';
import { EmployeeDocumentsService } from '../service/employee-documents.service';

const tenantId = 'tenant-1';
const employeeId = 'emp-1';

const mockDoc = {
  id: 'doc-1',
  tenantId,
  employeeId,
  fileType: 'IDENTIFICATION' as const,
  title: 'Cédula de ciudadanía',
  issueDate: null,
  expiryDate: null,
  storageObjectId: 'storage-1',
  mimeType: 'application/pdf',
  notes: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockStorageObject = {
  id: 'storage-1',
  tenantId,
  domain: 'PAYROLL',
  entityType: 'Employee',
  entityId: employeeId,
  visibility: 'PRIVATE',
  status: 'ACTIVE',
  provider: 'CLOUDFLARE_R2',
  bucket: 'restopsiq',
  key: `tenants/${tenantId}/payroll/doc.pdf`,
  mimeType: 'application/pdf',
  size: 102400,
  checksum: 'abc123',
  etag: null,
  originalName: 'cedula.pdf',
  uploadedBy: 'user-1',
  metadata: null,
  publicUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('EmployeeDocumentsService', () => {
  let service: EmployeeDocumentsService;
  let repo: jest.Mocked<EmployeeDocumentsRepository>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeDocumentsService,
        {
          provide: EmployeeDocumentsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmployee: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            findById: jest.fn(),
            getPresignedUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EmployeeDocumentsService);
    repo = module.get(EmployeeDocumentsRepository);
    storageService = module.get(StorageService);
  });

  describe('create', () => {
    it('validates storage object domain is PAYROLL', async () => {
      // Arrange
      storageService.findById.mockResolvedValue({
        ...mockStorageObject,
        domain: 'BRANDING',
      } as never);

      // Act & Assert
      await expect(
        service.create(tenantId, {
          employeeId,
          fileType: 'IDENTIFICATION',
          title: 'Cédula',
          storageObjectId: 'storage-1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('validates storageObjectId is linked to correct employee', async () => {
      // Arrange
      storageService.findById.mockResolvedValue({
        ...mockStorageObject,
        entityId: 'different-emp',
      } as never);

      // Act & Assert
      await expect(
        service.create(tenantId, {
          employeeId,
          fileType: 'IDENTIFICATION',
          title: 'Cédula',
          storageObjectId: 'storage-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('validates entityType must be Employee', async () => {
      // Arrange
      storageService.findById.mockResolvedValue({
        ...mockStorageObject,
        entityType: 'Supplier',
      } as never);

      // Act & Assert
      await expect(
        service.create(tenantId, {
          employeeId,
          fileType: 'IDENTIFICATION',
          title: 'Cédula',
          storageObjectId: 'storage-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates document when storage object is valid', async () => {
      // Arrange
      storageService.findById.mockResolvedValue(mockStorageObject as never);
      repo.create.mockResolvedValue(mockDoc);

      // Act
      const result = await service.create(tenantId, {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(storageService.findById).toHaveBeenCalledWith('storage-1', tenantId);
      expect(repo.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ title: 'Cédula' }),
      );
      expect(result.id).toBe('doc-1');
    });
  });

  describe('findById', () => {
    it('returns document when found', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockDoc);

      // Act
      const result = await service.findById(tenantId, 'doc-1');

      // Assert
      expect(result.id).toBe('doc-1');
    });

    it('throws NotFoundException when not found', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmployee', () => {
    it('delegates to repository with options', async () => {
      // Arrange
      repo.findByEmployee.mockResolvedValue([mockDoc]);

      // Act
      const result = await service.findByEmployee(tenantId, employeeId, {
        fileType: 'IDENTIFICATION',
      });

      // Assert
      expect(repo.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, {
        fileType: 'IDENTIFICATION',
      });
      expect(result).toHaveLength(1);
    });

    it('delegates without options when none provided', async () => {
      // Arrange
      repo.findByEmployee.mockResolvedValue([]);

      // Act
      await service.findByEmployee(tenantId, employeeId);

      // Assert
      expect(repo.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, undefined);
    });
  });

  describe('remove', () => {
    it('soft deletes when document exists', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockDoc);
      repo.softDelete.mockResolvedValue({ ...mockDoc, deletedAt: new Date() });

      // Act
      const result = await service.remove(tenantId, 'doc-1');

      // Assert
      expect(repo.softDelete).toHaveBeenCalledWith(tenantId, 'doc-1');
      expect(result.deletedAt).not.toBeNull();
    });

    it('throws NotFoundException and does not soft delete when not found', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(tenantId, 'missing')).rejects.toThrow(NotFoundException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('getDownloadUrl', () => {
    it('returns presigned URL with 900s TTL', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockDoc);
      storageService.getPresignedUrl.mockResolvedValue('https://r2.example.com/signed?token=abc');

      // Act
      const url = await service.getDownloadUrl(tenantId, 'doc-1');

      // Assert
      expect(storageService.getPresignedUrl).toHaveBeenCalledWith('storage-1', tenantId, 900);
      expect(url).toBe('https://r2.example.com/signed?token=abc');
    });

    it('throws NotFoundException when document does not exist', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDownloadUrl(tenantId, 'missing')).rejects.toThrow(NotFoundException);
      expect(storageService.getPresignedUrl).not.toHaveBeenCalled();
    });
  });
});
