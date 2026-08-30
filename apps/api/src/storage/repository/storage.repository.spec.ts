import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import {
  StorageObjectStatus,
  StorageVisibility,
  StorageProviderType,
  StorageDomain,
} from '../enums/storage.enums';
import { StorageRepository } from './storage.repository';

const mockPrisma = {
  storageObject: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const baseData = {
  tenantId: 'tenant-001',
  provider: StorageProviderType.CLOUDFLARE_R2,
  bucket: 'my-bucket',
  key: 'tenants/tenant-001/branding/uuid.webp',
  mimeType: 'image/webp',
  size: 1024,
  checksum: 'abc123',
  etag: null,
  originalName: 'logo.png',
  domain: StorageDomain.BRANDING,
  entityType: null,
  entityId: null,
  uploadedBy: 'user-001',
  visibility: StorageVisibility.PUBLIC,
  status: StorageObjectStatus.ACTIVE,
};

const storedRecord = {
  id: 'obj-001',
  ...baseData,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('StorageRepository', () => {
  let repository: StorageRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repository = module.get<StorageRepository>(StorageRepository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('delega a prisma.storageObject.create con los datos recibidos', async () => {
      // Arrange
      mockPrisma.storageObject.create.mockResolvedValue(storedRecord);

      // Act
      const result = await repository.create(baseData);

      // Assert
      expect(mockPrisma.storageObject.create).toHaveBeenCalledWith({ data: baseData });
      expect(result.id).toBe('obj-001');
    });
  });

  describe('findActive', () => {
    it('busca por id, tenantId, ACTIVE y deletedAt null', async () => {
      // Arrange
      mockPrisma.storageObject.findFirst.mockResolvedValue(storedRecord);

      // Act
      const result = await repository.findActive('obj-001', 'tenant-001');

      // Assert
      expect(mockPrisma.storageObject.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'obj-001',
          tenantId: 'tenant-001',
          status: StorageObjectStatus.ACTIVE,
          deletedAt: null,
        },
      });
      expect(result?.id).toBe('obj-001');
    });

    it('retorna null si no existe el objeto', async () => {
      // Arrange
      mockPrisma.storageObject.findFirst.mockResolvedValue(null);

      // Act
      const result = await repository.findActive('noop', 'tenant-001');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('actualiza por id con los datos proporcionados', async () => {
      // Arrange
      const updated = { ...storedRecord, status: StorageObjectStatus.DELETED };
      mockPrisma.storageObject.update.mockResolvedValue(updated);

      // Act
      const result = await repository.update('obj-001', {
        status: StorageObjectStatus.DELETED,
        deletedAt: new Date(),
      });

      // Assert
      expect(mockPrisma.storageObject.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'obj-001' } }),
      );
      expect(result.status).toBe(StorageObjectStatus.DELETED);
    });
  });
});
