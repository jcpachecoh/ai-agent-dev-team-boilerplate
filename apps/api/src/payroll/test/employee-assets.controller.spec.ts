import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAssetsController } from '../controller/employee-assets.controller';
import { EmployeeAssetsService } from '../service/employee-assets.service';

const tenantId = 'tenant-1';
const employeeId = 'emp-1';
const user = { tenantId };

const mockRecord = {
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

describe('EmployeeAssetsController', () => {
  let controller: EmployeeAssetsController;
  let service: jest.Mocked<EmployeeAssetsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeAssetsController],
      providers: [
        {
          provide: EmployeeAssetsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmployee: jest.fn(),
            update: jest.fn(),
            getDownloadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(EmployeeAssetsController);
    service = module.get(EmployeeAssetsService);
  });

  describe('create', () => {
    it('extracts tenantId from JWT, not body', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await controller.create(user, '', {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: 3500000,
      });

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ employeeId }),
      );
    });

    it('maps value to string for service', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await controller.create(user, '', {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: 3500000,
      });

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ value: '3500000' }),
      );
    });

    it('passes storageObjectId to service when provided', async () => {
      // Arrange
      service.create.mockResolvedValue({ ...mockRecord, storageObjectId: 'storage-1' });

      // Act
      await controller.create(user, '', {
        employeeId,
        assetName: 'Laptop',
        type: 'FINANCIAL',
        value: 3500000,
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ storageObjectId: 'storage-1' }),
      );
    });
  });

  describe('findByEmployee', () => {
    it('uses tenantId from JWT', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([mockRecord]);

      // Act
      await controller.findByEmployee(user, '', employeeId, undefined, undefined);

      // Assert
      expect(service.findByEmployee).toHaveBeenCalledWith(
        tenantId,
        employeeId,
        expect.objectContaining({}),
      );
    });

    it('passes status and type filters', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([]);

      // Act
      await controller.findByEmployee(user, '', employeeId, 'ACTIVO', 'FINANCIAL');

      // Assert
      expect(service.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, {
        status: 'ACTIVO',
        type: 'FINANCIAL',
      });
    });
  });

  describe('findOne', () => {
    it('delegates to service with tenantId from JWT', async () => {
      // Arrange
      service.findById.mockResolvedValue(mockRecord);

      // Act
      const result = await controller.findOne(user, '', 'asset-1');

      // Assert
      expect(service.findById).toHaveBeenCalledWith(tenantId, 'asset-1');
      expect(result.id).toBe('asset-1');
    });
  });

  describe('update', () => {
    it('passes tenantId from JWT and maps value to string', async () => {
      // Arrange
      service.update.mockResolvedValue({ ...mockRecord, status: 'RETORNADO' });

      // Act
      const result = await controller.update(user, '', 'asset-1', {
        status: 'RETORNADO',
        value: 3000000,
      });

      // Assert
      expect(service.update).toHaveBeenCalledWith(tenantId, 'asset-1', {
        status: 'RETORNADO',
        value: '3000000',
      });
      expect(result.status).toBe('RETORNADO');
    });

    it('passes storageObjectId to service when provided', async () => {
      // Arrange
      service.update.mockResolvedValue({ ...mockRecord, storageObjectId: 'storage-1' });

      // Act
      await controller.update(user, '', 'asset-1', { storageObjectId: 'storage-1' });

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        tenantId,
        'asset-1',
        expect.objectContaining({ storageObjectId: 'storage-1' }),
      );
    });
  });

  describe('download', () => {
    it('returns presigned URL from service', async () => {
      // Arrange
      service.getDownloadUrl.mockResolvedValue('https://r2.example.com/signed?token=abc');

      // Act
      const result = await controller.download(user, '', 'asset-1');

      // Assert
      expect(service.getDownloadUrl).toHaveBeenCalledWith(tenantId, 'asset-1');
      expect(result).toEqual({ url: 'https://r2.example.com/signed?token=abc' });
    });
  });
});
