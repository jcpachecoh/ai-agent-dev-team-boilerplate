import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageDomain, StorageObjectStatus, StorageVisibility } from '../enums/storage.enums';
import { StorageController } from '../controller/storage.controller';
import { StorageService } from '../service/storage.service';

const mockStorageService = {
  uploadFile: jest.fn(),
  deleteFile: jest.fn(),
  getPresignedUrl: jest.fn(),
};

const mockUser = { sub: 'user-001', tenantId: 'tenant-001', email: 'test@test.com' };

const storageResult = {
  id: 'obj-001',
  tenantId: 'tenant-001',
  provider: 'CLOUDFLARE_R2',
  bucket: 'restopsiq-assets',
  key: 'tenants/tenant-001/branding/uuid.webp',
  mimeType: 'image/webp',
  size: 1024,
  checksum: 'abc'.repeat(20) + 'ab',
  etag: null,
  originalName: 'logo.png',
  domain: StorageDomain.BRANDING,
  entityType: null,
  entityId: null,
  uploadedBy: 'user-001',
  visibility: StorageVisibility.PUBLIC,
  status: StorageObjectStatus.ACTIVE,
  metadata: null,
  publicUrl: 'https://cdn.opssynk.com/tenants/tenant-001/branding/uuid.webp',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const validFile = {
  buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  mimetype: 'image/png',
  originalname: 'logo.png',
  size: 8,
};

describe('StorageController', () => {
  let controller: StorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    }).compile();

    controller = module.get<StorageController>(StorageController);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('delega a StorageService con tenantId del JWT', async () => {
      // Arrange
      mockStorageService.uploadFile.mockResolvedValue(storageResult);

      // Act
      const result = await controller.upload(mockUser as any, validFile as any, {
        domain: StorageDomain.BRANDING,
        imageProfile: undefined,
        entityType: undefined,
        entityId: undefined,
        visibility: undefined,
      });

      // Assert
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-001', uploadedBy: 'user-001' }),
      );
      expect(result.id).toBe('obj-001');
    });

    it('lanza BadRequestException cuando no hay archivo', async () => {
      // Act & Assert
      await expect(
        controller.upload(mockUser as any, null as any, { domain: StorageDomain.BRANDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('delega deleteFile al servicio con tenantId del JWT', async () => {
      // Arrange
      mockStorageService.deleteFile.mockResolvedValue(undefined);

      // Act
      await controller.remove(mockUser as any, 'obj-001');

      // Assert
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith('obj-001', 'tenant-001');
    });
  });

  describe('presigned', () => {
    it('retorna URL firmada con TTL por defecto de 900s', async () => {
      // Arrange
      mockStorageService.getPresignedUrl.mockResolvedValue('https://presigned.url/...');

      // Act
      const result = await controller.presigned(mockUser as any, 'obj-001', undefined);

      // Assert
      expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith('obj-001', 'tenant-001', 900);
      expect(result.expiresInSeconds).toBe(900);
      expect(result.url).toBe('https://presigned.url/...');
    });

    it('respeta el TTL personalizado hasta 86400s máximo', async () => {
      // Arrange
      mockStorageService.getPresignedUrl.mockResolvedValue('https://presigned.url/...');

      // Act
      await controller.presigned(mockUser as any, 'obj-001', '3600');

      // Assert
      expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
        'obj-001',
        'tenant-001',
        3600,
      );
    });

    it('clampea TTL al máximo de 86400s', async () => {
      // Arrange
      mockStorageService.getPresignedUrl.mockResolvedValue('https://presigned.url/...');

      // Act
      const result = await controller.presigned(mockUser as any, 'obj-001', '999999');

      // Assert
      expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
        'obj-001',
        'tenant-001',
        86400,
      );
      expect(result.expiresInSeconds).toBe(86400);
    });
  });
});
