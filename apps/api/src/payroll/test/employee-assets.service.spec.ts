import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../../storage/service/storage.service';
import { EmployeeAssetsRepository } from '../repository/employee-assets.repository';
import { EmployeeAssetsService } from '../service/employee-assets.service';

const tenantId = 'tenant-1';
const employeeId = 'emp-1';

const mockAsset = {
  id: 'asset-1',
  tenantId,
  employeeId,
  assetName: 'Laptop',
  type: 'FINANCIAL' as const,
  assignmentDate: new Date('2025-01-01'),
  value: '3500000',
  status: 'ACTIVO' as const,
  notes: null,
  storageObjectId: null,
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
  key: `tenants/${tenantId}/payroll/file.pdf`,
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

describe('EmployeeAssetsService', () => {
  let service: EmployeeAssetsService;
  let repo: jest.Mocked<EmployeeAssetsRepository>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAssetsService,
        {
          provide: EmployeeAssetsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmployee: jest.fn(),
            findActiveByEmployeeAndName: jest.fn(),
            update: jest.fn(),
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

    service = module.get(EmployeeAssetsService);
    repo = module.get(EmployeeAssetsRepository);
    storageService = module.get(StorageService);
  });

  describe('create', () => {
    it('creates asset when no active duplicate exists', async () => {
      // Arrange
      repo.findActiveByEmployeeAndName.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockAsset);

      // Act
      const result = await service.create(tenantId, {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: '3500000',
      });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ assetName: 'Laptop' }),
      );
      expect(result.id).toBe('asset-1');
    });

    it('throws ConflictException when active asset with same name exists', async () => {
      // Arrange
      repo.findActiveByEmployeeAndName.mockResolvedValue(mockAsset);

      // Act & Assert
      await expect(
        service.create(tenantId, {
          employeeId,
          assetName: 'Laptop',
          type: 'FINANCIAL',
          value: '3500000',
        }),
      ).rejects.toThrow(ConflictException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('validates storageObjectId domain is PAYROLL', async () => {
      // Arrange
      repo.findActiveByEmployeeAndName.mockResolvedValue(null);
      storageService.findById.mockResolvedValue({
        ...mockStorageObject,
        domain: 'SUPPLIERS',
      } as never);

      // Act & Assert
      await expect(
        service.create(tenantId, {
          employeeId,
          assetName: 'Laptop',
          type: 'FINANCIAL',
          value: '3500000',
          storageObjectId: 'storage-1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('validates storageObjectId entityType and entityId match employee', async () => {
      // Arrange
      repo.findActiveByEmployeeAndName.mockResolvedValue(null);
      storageService.findById.mockResolvedValue({
        ...mockStorageObject,
        entityType: 'Supplier',
        entityId: 'other-id',
      } as never);

      // Act & Assert
      await expect(
        service.create(tenantId, {
          employeeId,
          assetName: 'Laptop',
          type: 'FINANCIAL',
          value: '3500000',
          storageObjectId: 'storage-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates with storageObjectId when storage object is valid', async () => {
      // Arrange
      repo.findActiveByEmployeeAndName.mockResolvedValue(null);
      storageService.findById.mockResolvedValue(mockStorageObject as never);
      repo.create.mockResolvedValue({ ...mockAsset, storageObjectId: 'storage-1' });

      // Act
      const result = await service.create(tenantId, {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: '3500000',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(storageService.findById).toHaveBeenCalledWith('storage-1', tenantId);
      expect(repo.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ storageObjectId: 'storage-1' }),
      );
      expect(result.storageObjectId).toBe('storage-1');
    });
  });

  describe('findById', () => {
    it('returns asset when found', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockAsset);

      // Act
      const result = await service.findById(tenantId, 'asset-1');

      // Assert
      expect(result.id).toBe('asset-1');
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
      repo.findByEmployee.mockResolvedValue([mockAsset]);

      // Act
      const result = await service.findByEmployee(tenantId, employeeId, { status: 'ACTIVO' });

      // Assert
      expect(repo.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, { status: 'ACTIVO' });
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates when asset exists', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockAsset);
      repo.update.mockResolvedValue({ ...mockAsset, status: 'RETORNADO' });

      // Act
      const result = await service.update(tenantId, 'asset-1', { status: 'RETORNADO' });

      // Assert
      expect(repo.update).toHaveBeenCalledWith(tenantId, 'asset-1', { status: 'RETORNADO' });
      expect(result.status).toBe('RETORNADO');
    });

    it('throws NotFoundException when asset does not exist', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(tenantId, 'missing', { status: 'RETORNADO' })).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('validates storageObjectId on update when provided', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockAsset);
      storageService.findById.mockResolvedValue({
        ...mockStorageObject,
        domain: 'BRANDING',
      } as never);

      // Act & Assert
      await expect(
        service.update(tenantId, 'asset-1', { storageObjectId: 'storage-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('updates storageObjectId when storage object is valid', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockAsset);
      storageService.findById.mockResolvedValue(mockStorageObject as never);
      repo.update.mockResolvedValue({ ...mockAsset, storageObjectId: 'storage-1' });

      // Act
      const result = await service.update(tenantId, 'asset-1', { storageObjectId: 'storage-1' });

      // Assert
      expect(storageService.findById).toHaveBeenCalledWith('storage-1', tenantId);
      expect(result.storageObjectId).toBe('storage-1');
    });
  });

  describe('getActiveAssetsForPayroll', () => {
    it('queries only ACTIVO status', async () => {
      // Arrange
      repo.findByEmployee.mockResolvedValue([mockAsset]);

      // Act
      const result = await service.getActiveAssetsForPayroll(tenantId, employeeId);

      // Assert
      expect(repo.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, { status: 'ACTIVO' });
      expect(result).toHaveLength(1);
    });
  });

  describe('getDownloadUrl', () => {
    it('returns presigned URL when asset has storageObjectId', async () => {
      // Arrange
      repo.findById.mockResolvedValue({ ...mockAsset, storageObjectId: 'storage-1' });
      storageService.getPresignedUrl.mockResolvedValue('https://r2.example.com/signed?token=abc');

      // Act
      const url = await service.getDownloadUrl(tenantId, 'asset-1');

      // Assert
      expect(storageService.getPresignedUrl).toHaveBeenCalledWith('storage-1', tenantId, 900);
      expect(url).toBe('https://r2.example.com/signed?token=abc');
    });

    it('throws NotFoundException when asset has no storageObjectId', async () => {
      // Arrange
      repo.findById.mockResolvedValue(mockAsset); // storageObjectId: null

      // Act & Assert
      await expect(service.getDownloadUrl(tenantId, 'asset-1')).rejects.toThrow(NotFoundException);
      expect(storageService.getPresignedUrl).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when asset does not exist', async () => {
      // Arrange
      repo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getDownloadUrl(tenantId, 'missing')).rejects.toThrow(NotFoundException);
    });
  });
});
