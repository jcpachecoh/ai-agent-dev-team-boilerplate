import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeAssetsResolver } from '../resolver/employee-assets.resolver';
import { EmployeeAssetsService } from '../service/employee-assets.service';

const tenantId = 'tenant-1';
const employeeId = 'emp-1';
const user = { tenantId };
const context = { req: { headers: {} } };

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

describe('EmployeeAssetsResolver', () => {
  let resolver: EmployeeAssetsResolver;
  let service: jest.Mocked<EmployeeAssetsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeAssetsResolver,
        {
          provide: EmployeeAssetsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmployee: jest.fn(),
            update: jest.fn(),
            getActiveAssetsForPayroll: jest.fn(),
            getDownloadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get(EmployeeAssetsResolver);
    service = module.get(EmployeeAssetsService);
  });

  describe('employeeAssets', () => {
    it('uses tenantId from user JWT', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([mockRecord]);

      // Act
      const result = await resolver.employeeAssets(user, context, employeeId, undefined, undefined);

      // Assert
      expect(service.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, {
        status: undefined,
        type: undefined,
      });
      expect(result).toHaveLength(1);
    });

    it('converts Decimal string value to Number', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([mockRecord]);

      // Act
      const result = await resolver.employeeAssets(user, context, employeeId, undefined, undefined);

      // Assert
      expect(typeof result[0].value).toBe('number');
      expect(result[0].value).toBe(3500000);
    });

    it('maps storageObjectId from record', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([{ ...mockRecord, storageObjectId: 'storage-1' }]);

      // Act
      const result = await resolver.employeeAssets(user, context, employeeId, undefined, undefined);

      // Assert
      expect(result[0].storageObjectId).toBe('storage-1');
    });
  });

  describe('createEmployeeAsset', () => {
    it('extracts tenantId from user, not input', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await resolver.createEmployeeAsset(user, context, {
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

    it('passes value as string to service', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await resolver.createEmployeeAsset(user, context, {
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
      await resolver.createEmployeeAsset(user, context, {
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

  describe('updateEmployeeAsset', () => {
    it('updates and converts value to number in response', async () => {
      // Arrange
      service.update.mockResolvedValue({ ...mockRecord, status: 'RETORNADO' });

      // Act
      const result = await resolver.updateEmployeeAsset(user, context, 'asset-1', {
        status: 'RETORNADO',
      });

      // Assert
      expect(service.update).toHaveBeenCalledWith(tenantId, 'asset-1', { status: 'RETORNADO' });
      expect(result.status).toBe('RETORNADO');
      expect(typeof result.value).toBe('number');
    });

    it('passes storageObjectId to service when provided', async () => {
      // Arrange
      service.update.mockResolvedValue({ ...mockRecord, storageObjectId: 'storage-1' });

      // Act
      await resolver.updateEmployeeAsset(user, context, 'asset-1', {
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(service.update).toHaveBeenCalledWith(
        tenantId,
        'asset-1',
        expect.objectContaining({ storageObjectId: 'storage-1' }),
      );
    });
  });

  describe('employeeAssetDownloadUrl', () => {
    it('delegates to service and returns URL', async () => {
      // Arrange
      service.getDownloadUrl.mockResolvedValue('https://r2.example.com/signed?token=abc');

      // Act
      const result = await resolver.employeeAssetDownloadUrl(user, context, 'asset-1');

      // Assert
      expect(service.getDownloadUrl).toHaveBeenCalledWith(tenantId, 'asset-1');
      expect(result).toBe('https://r2.example.com/signed?token=abc');
    });
  });
});
