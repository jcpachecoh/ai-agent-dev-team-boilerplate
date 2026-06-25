import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StorageDomain, StorageObjectStatus, StorageVisibility } from './enums/storage.enums';
import { STORAGE_PROVIDER } from './interfaces/storage.interfaces';
import { MockStorageProvider } from './providers/mock/mock.storage.provider';
import { StorageService } from './storage.service';

const mockPrisma = {
  storageObject: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const buildFile = (): { buffer: Buffer; mimetype: string; originalname: string; size: number } => {
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  return {
    buffer: pngMagic,
    mimetype: 'image/png',
    originalname: 'test.png',
    size: pngMagic.length,
  };
};

const buildRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'obj-001',
  tenantId: 'tenant-001',
  provider: 'CLOUDFLARE_R2',
  bucket: 'mock-bucket',
  key: 'tenants/tenant-001/branding/uuid.webp',
  mimeType: 'image/webp',
  size: 1024,
  checksum: 'abc123',
  etag: 'mock-etag',
  originalName: 'logo.png',
  domain: 'BRANDING',
  entityType: null,
  entityId: null,
  uploadedBy: 'user-001',
  visibility: StorageVisibility.PUBLIC,
  status: StorageObjectStatus.ACTIVE,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('StorageService', () => {
  let service: StorageService;
  let provider: MockStorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        MockStorageProvider,
        { provide: STORAGE_PROVIDER, useExisting: MockStorageProvider },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    provider = module.get<MockStorageProvider>(MockStorageProvider);
    jest.clearAllMocks();
    provider.clear();
  });

  describe('buildPublicUrl', () => {
    const key = 'tenants/t1/branding/logo.webp';

    it('construye URL cuando el dominio ya incluye https://', () => {
      const original = process.env.R2_PUBLIC_DOMAIN;
      process.env.R2_PUBLIC_DOMAIN = 'https://assets.opssynk.com';

      expect(service.buildPublicUrl(key)).toBe(
        'https://assets.opssynk.com/tenants/t1/branding/logo.webp',
      );

      process.env.R2_PUBLIC_DOMAIN = original;
    });

    it('normaliza dominio sin protocolo agregando https://', () => {
      const original = process.env.R2_PUBLIC_DOMAIN;
      process.env.R2_PUBLIC_DOMAIN = 'assets.opssynk.com';

      expect(service.buildPublicUrl(key)).toBe(
        'https://assets.opssynk.com/tenants/t1/branding/logo.webp',
      );

      process.env.R2_PUBLIC_DOMAIN = original;
    });

    it('elimina trailing slash del dominio', () => {
      const original = process.env.R2_PUBLIC_DOMAIN;
      process.env.R2_PUBLIC_DOMAIN = 'https://assets.opssynk.com/';

      expect(service.buildPublicUrl(key)).toBe(
        'https://assets.opssynk.com/tenants/t1/branding/logo.webp',
      );

      process.env.R2_PUBLIC_DOMAIN = original;
    });

    it('normaliza dominio sin protocolo con trailing slash', () => {
      const original = process.env.R2_PUBLIC_DOMAIN;
      process.env.R2_PUBLIC_DOMAIN = 'assets.opssynk.com/';

      expect(service.buildPublicUrl(key)).toBe(
        'https://assets.opssynk.com/tenants/t1/branding/logo.webp',
      );

      process.env.R2_PUBLIC_DOMAIN = original;
    });
  });

  describe('uploadFile', () => {
    it('no acepta tenantId del body — usa el del parámetro de opciones', async () => {
      const record = buildRecord();
      mockPrisma.storageObject.create.mockResolvedValue(record);

      await service.uploadFile({
        tenantId: 'tenant-001',
        uploadedBy: 'user-001',
        domain: StorageDomain.BRANDING,
        file: buildFile(),
      });

      const createCall = mockPrisma.storageObject.create.mock.calls[0][0];
      expect(createCall.data.tenantId).toBe('tenant-001');
    });

    it('construye key con formato tenants/{tenantId}/{domain}/{uuid}.ext', async () => {
      const record = buildRecord();
      mockPrisma.storageObject.create.mockResolvedValue(record);

      await service.uploadFile({
        tenantId: 'tenant-abc',
        uploadedBy: 'user-001',
        domain: StorageDomain.INVENTORY,
        file: buildFile(),
      });

      const createCall = mockPrisma.storageObject.create.mock.calls[0][0];
      expect(createCall.data.key).toMatch(/^tenants\/tenant-abc\/inventory\/.+\.(webp|png)$/);
    });

    it('persiste checksum sha256', async () => {
      const record = buildRecord();
      mockPrisma.storageObject.create.mockResolvedValue(record);

      await service.uploadFile({
        tenantId: 'tenant-001',
        uploadedBy: 'user-001',
        domain: StorageDomain.BRANDING,
        file: buildFile(),
      });

      const createCall = mockPrisma.storageObject.create.mock.calls[0][0];
      expect(createCall.data.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('defaultea visibility a PUBLIC si no se especifica', async () => {
      const record = buildRecord();
      mockPrisma.storageObject.create.mockResolvedValue(record);

      await service.uploadFile({
        tenantId: 'tenant-001',
        uploadedBy: 'user-001',
        domain: StorageDomain.BRANDING,
        file: buildFile(),
      });

      const createCall = mockPrisma.storageObject.create.mock.calls[0][0];
      expect(createCall.data.visibility).toBe(StorageVisibility.PUBLIC);
    });

    it('MockProvider no llama a R2 real', async () => {
      const record = buildRecord();
      mockPrisma.storageObject.create.mockResolvedValue(record);
      const uploadSpy = jest.spyOn(provider, 'upload');

      await service.uploadFile({
        tenantId: 'tenant-001',
        uploadedBy: 'user-001',
        domain: StorageDomain.BRANDING,
        file: buildFile(),
      });

      expect(uploadSpy).toHaveBeenCalledTimes(1);
      // Verify it's the mock, not a real S3 client
      expect(provider.bucketName).toBe('mock-bucket');
    });

    it('retorna publicUrl para assets PUBLIC', async () => {
      const original = process.env.R2_PUBLIC_DOMAIN;
      process.env.R2_PUBLIC_DOMAIN = 'https://cdn.opssynk.com';

      const record = buildRecord({ visibility: StorageVisibility.PUBLIC });
      mockPrisma.storageObject.create.mockResolvedValue(record);

      const result = await service.uploadFile({
        tenantId: 'tenant-001',
        uploadedBy: 'user-001',
        domain: StorageDomain.BRANDING,
        file: buildFile(),
      });

      expect(result.publicUrl).toMatch(/^https:\/\/cdn\.opssynk\.com\//);

      process.env.R2_PUBLIC_DOMAIN = original;
    });

    it('retorna publicUrl null para assets PRIVATE', async () => {
      const record = buildRecord({ visibility: StorageVisibility.PRIVATE });
      mockPrisma.storageObject.create.mockResolvedValue(record);

      const result = await service.uploadFile({
        tenantId: 'tenant-001',
        uploadedBy: 'user-001',
        domain: StorageDomain.BRANDING,
        visibility: StorageVisibility.PRIVATE,
        file: buildFile(),
      });

      expect(result.publicUrl).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('lanza NotFoundException si el objeto no existe', async () => {
      mockPrisma.storageObject.findFirst.mockResolvedValue(null);

      await expect(service.deleteFile('nonexistent', 'tenant-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('verifica tenantId — no borra archivos de otro tenant', async () => {
      mockPrisma.storageObject.findFirst.mockResolvedValue(null);

      await expect(service.deleteFile('obj-001', 'otro-tenant')).rejects.toThrow(NotFoundException);

      expect(mockPrisma.storageObject.update).not.toHaveBeenCalled();
    });

    it('soft delete en DB antes de borrar en provider', async () => {
      const record = buildRecord();
      mockPrisma.storageObject.findFirst.mockResolvedValue(record);
      mockPrisma.storageObject.update.mockResolvedValue({ ...record, status: 'DELETED' });

      await service.deleteFile('obj-001', 'tenant-001');

      expect(mockPrisma.storageObject.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'obj-001' },
          data: expect.objectContaining({ status: StorageObjectStatus.DELETED }),
        }),
      );
    });
  });

  describe('getPresignedUrl', () => {
    it('lanza NotFoundException si el objeto no existe', async () => {
      mockPrisma.storageObject.findFirst.mockResolvedValue(null);

      await expect(service.getPresignedUrl('nonexistent', 'tenant-001', 900)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('verifica tenantId para presigned URL', async () => {
      mockPrisma.storageObject.findFirst.mockResolvedValue(null);

      await expect(service.getPresignedUrl('obj-001', 'otro-tenant', 900)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('retorna publicUrl directamente para assets PUBLIC', async () => {
      const original = process.env.R2_PUBLIC_DOMAIN;
      process.env.R2_PUBLIC_DOMAIN = 'https://cdn.opssynk.com';

      const record = buildRecord({ visibility: StorageVisibility.PUBLIC });
      mockPrisma.storageObject.findFirst.mockResolvedValue(record);
      const presignedSpy = jest.spyOn(provider, 'getPresignedUrl');

      const url = await service.getPresignedUrl('obj-001', 'tenant-001', 900);

      expect(url).toMatch(/^https:\/\/cdn\.opssynk\.com\//);
      expect(presignedSpy).not.toHaveBeenCalled();

      process.env.R2_PUBLIC_DOMAIN = original;
    });

    it('genera presigned URL para assets PRIVATE', async () => {
      const record = buildRecord({ visibility: StorageVisibility.PRIVATE });
      mockPrisma.storageObject.findFirst.mockResolvedValue(record);

      const url = await service.getPresignedUrl('obj-001', 'tenant-001', 900);

      expect(url).toMatch(/^https:\/\/mock\.storage\//);
    });
  });
});
