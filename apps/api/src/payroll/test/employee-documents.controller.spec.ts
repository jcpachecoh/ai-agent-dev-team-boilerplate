import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeDocumentsController } from '../controller/employee-documents.controller';
import { EmployeeDocumentsService } from '../service/employee-documents.service';

const tenantId = 'tenant-1';
const employeeId = 'emp-1';
const user = { tenantId };

const mockRecord = {
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

describe('EmployeeDocumentsController', () => {
  let controller: EmployeeDocumentsController;
  let service: jest.Mocked<EmployeeDocumentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeDocumentsController],
      providers: [
        {
          provide: EmployeeDocumentsService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmployee: jest.fn(),
            remove: jest.fn(),
            getDownloadUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(EmployeeDocumentsController);
    service = module.get(EmployeeDocumentsService);
  });

  describe('create', () => {
    it('extracts tenantId from JWT user, not header', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await controller.create(user, 'other-tenant', {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ employeeId }),
      );
    });

    it('falls back to x-tenant-id header when JWT has no tenantId', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await controller.create({}, 'header-tenant', {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        'header-tenant',
        expect.objectContaining({ employeeId }),
      );
    });

    it('parses issueDate string to Date when provided', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await controller.create(user, '', {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
        issueDate: '2024-01-15',
      });

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ issueDate: new Date('2024-01-15') }),
      );
    });

    it('parses expiryDate string to Date when provided', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      await controller.create(user, '', {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
        expiryDate: '2029-01-15',
      });

      // Assert
      expect(service.create).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ expiryDate: new Date('2029-01-15') }),
      );
    });

    it('returns mapped response with mimeType', async () => {
      // Arrange
      service.create.mockResolvedValue(mockRecord);

      // Act
      const result = await controller.create(user, '', {
        employeeId,
        fileType: 'IDENTIFICATION',
        title: 'Cédula',
        storageObjectId: 'storage-1',
      });

      // Assert
      expect(result.id).toBe('doc-1');
      expect(result.mimeType).toBe('application/pdf');
    });
  });

  describe('findByEmployee', () => {
    it('passes tenantId and employeeId to service', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([mockRecord]);

      // Act
      await controller.findByEmployee(user, '', employeeId);

      // Assert
      expect(service.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, {
        fileType: undefined,
      });
    });

    it('passes fileType filter when provided', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([]);

      // Act
      await controller.findByEmployee(user, '', employeeId, 'DRIVER_LICENSE');

      // Assert
      expect(service.findByEmployee).toHaveBeenCalledWith(tenantId, employeeId, {
        fileType: 'DRIVER_LICENSE',
      });
    });

    it('returns array of mapped responses', async () => {
      // Arrange
      service.findByEmployee.mockResolvedValue([mockRecord]);

      // Act
      const result = await controller.findByEmployee(user, '', employeeId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.mimeType).toBe('application/pdf');
    });
  });

  describe('findOne', () => {
    it('delegates to service with tenantId and id', async () => {
      // Arrange
      service.findById.mockResolvedValue(mockRecord);

      // Act
      const result = await controller.findOne(user, '', 'doc-1');

      // Assert
      expect(service.findById).toHaveBeenCalledWith(tenantId, 'doc-1');
      expect(result.id).toBe('doc-1');
    });
  });

  describe('download', () => {
    it('returns url object from service', async () => {
      // Arrange
      service.getDownloadUrl.mockResolvedValue('https://r2.example.com/signed?token=abc');

      // Act
      const result = await controller.download(user, '', 'doc-1');

      // Assert
      expect(service.getDownloadUrl).toHaveBeenCalledWith(tenantId, 'doc-1');
      expect(result).toEqual({ url: 'https://r2.example.com/signed?token=abc' });
    });
  });

  describe('remove', () => {
    it('delegates to service and returns mapped response', async () => {
      // Arrange
      service.remove.mockResolvedValue({ ...mockRecord, deletedAt: new Date() });

      // Act
      const result = await controller.remove(user, '', 'doc-1');

      // Assert
      expect(service.remove).toHaveBeenCalledWith(tenantId, 'doc-1');
      expect(result.id).toBe('doc-1');
    });
  });
});
