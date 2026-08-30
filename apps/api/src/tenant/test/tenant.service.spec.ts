import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  StorageDomain,
  StorageObjectStatus,
  StorageVisibility,
} from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import { TenantRepository } from '../repository/tenant.repository';
import { TenantService } from '../service/tenant.service';

const repoMock = {
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
};

const storageServiceMock = {
  uploadFile: jest.fn(),
  buildPublicUrl: jest.fn(),
};

const tenant = {
  id: 'palos-de-lena',
  name: 'Palos de Leña',
  nit: '900000000-1',
  legalName: 'Palos de Leña S.A.S.',
  tradeName: 'Palos de Leña',
  legalRepresentativeName: null,
  legalRepresentativeDocumentType: null,
  legalRepresentativeDocumentNumber: null,
  email: 'admin@palosdelena.test',
  phone: '+57 300 000 0000',
  address: 'Dirección de prueba',
  city: 'Bogotá',
  department: 'Cundinamarca',
  country: 'CO',
  taxRegime: 'RESPONSABLE_IVA',
  logoUrl: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const storageResult = {
  id: 'obj-001',
  tenantId: 'palos-de-lena',
  provider: 'CLOUDFLARE_R2',
  bucket: 'restopsiq-assets',
  key: 'tenants/palos-de-lena/branding/uuid.webp',
  mimeType: 'image/webp',
  size: 1024,
  checksum: 'abc123',
  etag: null,
  originalName: 'logo.png',
  domain: StorageDomain.BRANDING,
  entityType: 'tenant',
  entityId: 'palos-de-lena',
  uploadedBy: 'user-001',
  visibility: StorageVisibility.PUBLIC,
  status: StorageObjectStatus.ACTIVE,
  metadata: null,
  publicUrl: 'https://cdn.opssynk.com/tenants/palos-de-lena/branding/uuid.webp',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: TenantRepository, useValue: repoMock },
        { provide: StorageService, useValue: storageServiceMock },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    jest.clearAllMocks();
  });

  it('findAll delegates to repository', async () => {
    repoMock.findAll.mockResolvedValue([tenant]);

    const result = await service.findAll();

    expect(result).toEqual([tenant]);
    expect(repoMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('findById delegates to repository', async () => {
    repoMock.findById.mockResolvedValue(tenant);

    const result = await service.findById('palos-de-lena');

    expect(result).toEqual(tenant);
    expect(repoMock.findById).toHaveBeenCalledWith('palos-de-lena');
  });

  it('findById throws NotFoundException when tenant is missing', async () => {
    repoMock.findById.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('assertTenantAccess throws ForbiddenException for mismatched tenant', () => {
    expect(() => service.assertTenantAccess('tenant-a', 'tenant-b')).toThrow(ForbiddenException);
  });

  it('update delegates to repository', async () => {
    repoMock.update.mockResolvedValue({ ...tenant, tradeName: 'Nuevo nombre' });

    const result = await service.update('palos-de-lena', { tradeName: 'Nuevo nombre' });

    expect(result.tradeName).toBe('Nuevo nombre');
    expect(repoMock.update).toHaveBeenCalledWith('palos-de-lena', { tradeName: 'Nuevo nombre' });
  });

  it('update throws NotFoundException when tenant is missing', async () => {
    repoMock.update.mockResolvedValue(null);

    await expect(service.update('missing', { tradeName: 'Nuevo nombre' })).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('uploadLogo', () => {
    const file = {
      buffer: Buffer.from('fake-image'),
      mimetype: 'image/webp',
      originalname: 'logo.webp',
      size: 10,
    };

    it('usa StorageService — no escribe al filesystem', async () => {
      repoMock.findById.mockResolvedValue(tenant);
      storageServiceMock.uploadFile.mockResolvedValue(storageResult);
      repoMock.update.mockResolvedValue({
        ...tenant,
        logoUrl: storageResult.publicUrl,
      });

      await service.uploadLogo('palos-de-lena', 'user-001', file);

      expect(storageServiceMock.uploadFile).toHaveBeenCalledTimes(1);
      expect(storageServiceMock.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'palos-de-lena',
          uploadedBy: 'user-001',
          domain: StorageDomain.BRANDING,
          entityType: 'tenant',
          entityId: 'palos-de-lena',
        }),
      );
    });

    it('persiste publicUrl del storage en Tenant.logoUrl', async () => {
      repoMock.findById.mockResolvedValue(tenant);
      storageServiceMock.uploadFile.mockResolvedValue(storageResult);
      repoMock.update.mockResolvedValue({
        ...tenant,
        logoUrl: storageResult.publicUrl,
      });

      const result = await service.uploadLogo('palos-de-lena', 'user-001', file);

      expect(repoMock.update).toHaveBeenCalledWith(
        'palos-de-lena',
        expect.objectContaining({ logoUrl: storageResult.publicUrl }),
      );
      expect(result.logoUrl).toBe(storageResult.publicUrl);
    });

    it('lanza NotFoundException si el tenant no existe', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.uploadLogo('no-existe', 'user-001', file)).rejects.toThrow(
        NotFoundException,
      );

      expect(storageServiceMock.uploadFile).not.toHaveBeenCalled();
    });

    it('usa buildPublicUrl como fallback cuando publicUrl es null', async () => {
      // Arrange — storage retorna un resultado sin publicUrl (asset PRIVATE o buildPublicUrl no configurado)
      const resultSinUrl = { ...storageResult, publicUrl: null };
      repoMock.findById.mockResolvedValue(tenant);
      storageServiceMock.uploadFile.mockResolvedValue(resultSinUrl);
      storageServiceMock.buildPublicUrl.mockReturnValue(
        'https://cdn.opssynk.com/tenants/palos-de-lena/branding/uuid.webp',
      );
      repoMock.update.mockResolvedValue({
        ...tenant,
        logoUrl: 'https://cdn.opssynk.com/tenants/palos-de-lena/branding/uuid.webp',
      });

      // Act
      const result = await service.uploadLogo('palos-de-lena', 'user-001', file);

      // Assert — buildPublicUrl fue usado como fallback
      expect(storageServiceMock.buildPublicUrl).toHaveBeenCalledWith(resultSinUrl.key);
      expect(result.logoUrl).toBe(
        'https://cdn.opssynk.com/tenants/palos-de-lena/branding/uuid.webp',
      );
    });
  });
});
