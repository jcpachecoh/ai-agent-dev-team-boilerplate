import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupplierDocumentType } from '@prisma/client';

import { StorageService } from '../../storage/service/storage.service';
import { SupplierDocumentsRepository } from '../repository/supplier-documents.repository';
import { SupplierDocumentExpirationService } from '../service/supplier-document-expiration.service';
import { SupplierDocumentsService } from '../service/supplier-documents.service';

describe('SupplierDocumentsService', () => {
  let service: SupplierDocumentsService;
  let repository: jest.Mocked<SupplierDocumentsRepository>;
  let storageService: jest.Mocked<StorageService>;
  let expirationService: jest.Mocked<SupplierDocumentExpirationService>;

  const supplier = {
    id: 'sup-1',
    tenantId: 'tenant-1',
    tipo: 'PERSONA_JURIDICA' as const,
    isCritical: true,
    sellsRecurrentProducts: true,
    isFoodSupplier: false,
    handlesChemicals: false,
    isRawMaterialSupplier: false,
  };

  const validStorageObject = {
    id: 'st-1',
    tenantId: 'tenant-1',
    provider: 'LOCAL',
    bucket: 'bucket',
    key: 'file',
    mimeType: 'application/pdf',
    size: 1024,
    checksum: 'abc',
    etag: null,
    originalName: 'rut.pdf',
    domain: 'SUPPLIERS',
    entityType: 'Supplier',
    entityId: 'sup-1',
    uploadedBy: 'user-1',
    visibility: 'PRIVATE',
    status: 'ACTIVE',
    metadata: null,
    publicUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as const;

  const policy = {
    tenantId: 'tenant-1',
    camaraComercioValidityDays: 30,
    rutAnnualReviewMonths: 11,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierDocumentsService,
        {
          provide: SupplierDocumentsRepository,
          useValue: {
            findSupplierFlags: jest.fn(),
            findPolicy: jest.fn(),
            listBySupplier: jest.fn(),
            findByType: jest.fn(),
            upsertWithVersion: jest.fn(),
            softDeleteCurrentVersion: jest.fn(),
            findVersionById: jest.fn(),
            logAudit: jest.fn(),
            findPreviousVersion: jest.fn().mockResolvedValue(null),
            updateExpirationState: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            findById: jest.fn(),
            getPresignedUrl: jest.fn(),
          },
        },
        {
          provide: SupplierDocumentExpirationService,
          useValue: {
            resolveExpirationForType: jest.fn().mockReturnValue({
              status: 'UPLOADED',
              expiresAt: null,
              needsReview: false,
              alertLevel: 'NONE',
            }),
          },
        },
      ],
    }).compile();

    service = module.get(SupplierDocumentsService);
    repository = module.get(SupplierDocumentsRepository);
    storageService = module.get(StorageService);
    expirationService = module.get(SupplierDocumentExpirationService);
  });

  it('lists catalog rows with completeness', async () => {
    repository.findSupplierFlags.mockResolvedValue(supplier);
    repository.findPolicy.mockResolvedValue(policy);
    repository.listBySupplier.mockResolvedValue([]);

    const result = await service.list('tenant-1', 'sup-1');

    expect(result.completeness.total).toBe(14);
    expect(result.completeness.loaded).toBe(0);
    expect(result.completeness.requiredPending).toContain(SupplierDocumentType.RUT);
  });

  it('includes previous version metadata when available', async () => {
    repository.findSupplierFlags.mockResolvedValue(supplier);
    repository.findPolicy.mockResolvedValue(policy);
    repository.listBySupplier.mockResolvedValue([
      {
        id: 'doc-1',
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        status: 'UPLOADED',
        issuedAt: null,
        expiresAt: null,
        lastUploadedAt: new Date(),
        uploadedByUserId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        currentVersion: {
          id: 'ver-2',
          tenantId: 'tenant-1',
          supplierDocumentId: 'doc-1',
          storageObjectId: 'st-2',
          versionNumber: 2,
          uploadedByUserId: 'user-1',
          uploadedAt: new Date(),
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          mimeType: 'application/pdf',
          size: 1024,
          originalName: 'rut-v2.pdf',
          visibility: 'PRIVATE',
        },
      },
    ]);
    repository.findPreviousVersion.mockResolvedValue({
      id: 'ver-1',
      tenantId: 'tenant-1',
      supplierDocumentId: 'doc-1',
      storageObjectId: 'st-1',
      versionNumber: 1,
      uploadedByUserId: 'user-1',
      uploadedAt: new Date(),
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      mimeType: 'application/pdf',
      size: 1024,
      originalName: 'rut-v1.pdf',
      visibility: 'PRIVATE',
    });

    const result = await service.list('tenant-1', 'sup-1');
    const rut = result.documents.find((row) => row.documentType === SupplierDocumentType.RUT);

    expect(rut?.currentVersion?.versionNumber).toBe(2);
    expect(rut?.previousVersion?.originalName).toBe('rut-v1.pdf');
  });

  it('returns required pending types via helper', async () => {
    repository.findSupplierFlags.mockResolvedValue(supplier);
    repository.findPolicy.mockResolvedValue(policy);
    repository.listBySupplier.mockResolvedValue([]);

    const pending = await service.getRequiredPending('tenant-1', 'sup-1');

    expect(pending).toContain(SupplierDocumentType.RUT);
  });

  it('throws NotFoundException when supplier is missing in list', async () => {
    repository.findSupplierFlags.mockResolvedValue(null);

    await expect(service.list('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
  });

  it('validates mime type and size in upsert', async () => {
    repository.findSupplierFlags.mockResolvedValue(supplier);
    storageService.findById.mockResolvedValue({
      ...validStorageObject,
      mimeType: 'application/zip',
      originalName: 'file.zip',
    } as any);

    await expect(
      service.upsert({
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        storageObjectId: 'st-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects storage objects from another domain or supplier', async () => {
    repository.findSupplierFlags.mockResolvedValue(supplier);
    storageService.findById.mockResolvedValue({
      ...validStorageObject,
      domain: 'PAYROLL',
    } as any);

    await expect(
      service.upsert({
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        storageObjectId: 'st-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Storage object domain must be SUPPLIERS');

    storageService.findById.mockResolvedValue({
      ...validStorageObject,
      entityId: 'other-supplier',
    } as any);

    await expect(
      service.upsert({
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        storageObjectId: 'st-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('Storage object must be linked to the same supplier');
  });

  it('rejects files larger than 5 MB', async () => {
    repository.findSupplierFlags.mockResolvedValue(supplier);
    storageService.findById.mockResolvedValue({
      ...validStorageObject,
      size: 6 * 1024 * 1024,
    } as any);

    await expect(
      service.upsert({
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        storageObjectId: 'st-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow('El archivo no puede superar 5 MB');
  });

  it('upserts a valid document and updates expiration state', async () => {
    repository.findSupplierFlags.mockResolvedValue(supplier);
    repository.findPolicy.mockResolvedValue(policy);
    storageService.findById.mockResolvedValue(validStorageObject as any);
    repository.upsertWithVersion.mockResolvedValue({
      id: 'doc-1',
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.RUT,
      status: 'UPLOADED',
      issuedAt: null,
      expiresAt: null,
      lastUploadedAt: new Date(),
      uploadedByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      currentVersion: {
        id: 'ver-1',
        tenantId: 'tenant-1',
        supplierDocumentId: 'doc-1',
        storageObjectId: 'st-1',
        versionNumber: 1,
        uploadedByUserId: 'user-1',
        uploadedAt: new Date(),
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        mimeType: 'application/pdf',
        size: 1024,
        originalName: 'rut.pdf',
        visibility: 'PRIVATE',
      },
    });
    expirationService.resolveExpirationForType.mockReturnValue({
      status: 'UPLOADED',
      expiresAt: null,
      needsReview: false,
      alertLevel: 'NONE',
    });

    const result = await service.upsert({
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.RUT,
      storageObjectId: 'st-1',
      actorUserId: 'user-1',
    });

    expect(result.status).toBe('UPLOADED');
    expect(repository.updateExpirationState).toHaveBeenCalled();
    expect(repository.logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }));
  });

  it('computes camara expiry from issuedAt when expiresAt is omitted', async () => {
    const issuedAt = new Date('2026-06-01T00:00:00.000Z');
    const computedExpiresAt = new Date('2026-07-01T00:00:00.000Z');
    repository.findSupplierFlags.mockResolvedValue(supplier);
    repository.findPolicy.mockResolvedValue(policy);
    storageService.findById.mockResolvedValue(validStorageObject as any);
    expirationService.resolveExpirationForType
      .mockReturnValueOnce({
        status: 'UPLOADED',
        expiresAt: computedExpiresAt,
        needsReview: false,
        alertLevel: 'NONE',
      })
      .mockReturnValueOnce({
        status: 'UPLOADED',
        expiresAt: computedExpiresAt,
        needsReview: false,
        alertLevel: 'NONE',
      });
    repository.upsertWithVersion.mockResolvedValue({
      id: 'doc-camara',
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.CAMARA_COMERCIO,
      status: 'UPLOADED',
      issuedAt,
      expiresAt: computedExpiresAt,
      lastUploadedAt: new Date(),
      uploadedByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      currentVersion: {
        id: 'ver-1',
        tenantId: 'tenant-1',
        supplierDocumentId: 'doc-camara',
        storageObjectId: 'st-1',
        versionNumber: 2,
        uploadedByUserId: 'user-1',
        uploadedAt: new Date(),
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        mimeType: 'application/pdf',
        size: 1024,
        originalName: 'camara.pdf',
        visibility: 'PRIVATE',
      },
    });

    await service.upsert({
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.CAMARA_COMERCIO,
      storageObjectId: 'st-1',
      issuedAt,
      actorUserId: 'user-1',
    });

    expect(repository.upsertWithVersion).toHaveBeenCalledWith(
      expect.objectContaining({ expiresAt: computedExpiresAt }),
    );
    expect(repository.logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE' }));
  });

  it('throws NotFoundException when supplier is missing in upsert', async () => {
    repository.findSupplierFlags.mockResolvedValue(null);

    await expect(
      service.upsert({
        tenantId: 'tenant-1',
        supplierId: 'missing',
        documentType: SupplierDocumentType.RUT,
        storageObjectId: 'st-1',
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('removes current version and logs audit', async () => {
    repository.softDeleteCurrentVersion.mockResolvedValue({
      id: 'doc-1',
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.RUT,
      status: 'PENDING',
      issuedAt: null,
      expiresAt: null,
      lastUploadedAt: null,
      uploadedByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      currentVersion: null,
    });

    const result = await service.remove({
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.RUT,
      actorUserId: 'user-1',
    });

    expect(result.status).toBe('PENDING');
    expect(repository.logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELETE' }));
  });

  it('throws NotFoundException when removing a missing document', async () => {
    repository.softDeleteCurrentVersion.mockResolvedValue(null);

    await expect(
      service.remove({
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns signed url for current version download', async () => {
    repository.findByType.mockResolvedValue({
      id: 'doc-1',
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.RUT,
      status: 'UPLOADED',
      issuedAt: null,
      expiresAt: null,
      lastUploadedAt: new Date(),
      uploadedByUserId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      currentVersion: {
        id: 'ver-1',
        tenantId: 'tenant-1',
        supplierDocumentId: 'doc-1',
        storageObjectId: 'st-1',
        versionNumber: 1,
        uploadedByUserId: 'user-1',
        uploadedAt: new Date(),
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        mimeType: 'application/pdf',
        size: 1024,
        originalName: 'rut.pdf',
        visibility: 'PRIVATE',
      },
    });
    storageService.getPresignedUrl.mockResolvedValue('https://signed-url');

    const url = await service.getDownloadUrl({
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.RUT,
      actorUserId: 'user-1',
    });

    expect(url).toBe('https://signed-url');
    expect(repository.logAudit).toHaveBeenCalled();
  });

  it('downloads a specific historical version when versionId is provided', async () => {
    repository.findVersionById.mockResolvedValue({
      id: 'ver-old',
      tenantId: 'tenant-1',
      supplierDocumentId: 'doc-1',
      storageObjectId: 'st-old',
      versionNumber: 1,
      uploadedByUserId: 'user-1',
      uploadedAt: new Date(),
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      mimeType: 'application/pdf',
      size: 1024,
      originalName: 'rut-old.pdf',
      visibility: 'PRIVATE',
    });
    storageService.getPresignedUrl.mockResolvedValue('https://signed-old');

    const url = await service.getDownloadUrl({
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      documentType: SupplierDocumentType.RUT,
      actorUserId: 'user-1',
      versionId: 'ver-old',
    });

    expect(url).toBe('https://signed-old');
    expect(repository.findVersionById).toHaveBeenCalled();
  });

  it('throws NotFoundException when download version is missing', async () => {
    repository.findByType.mockResolvedValue(null);

    await expect(
      service.getDownloadUrl({
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        actorUserId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
