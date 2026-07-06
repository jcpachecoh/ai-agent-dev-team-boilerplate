import { Test, TestingModule } from '@nestjs/testing';
import { SupplierDocumentType } from '@prisma/client';

import { SupplierDocumentsRepository } from '../repository/supplier-documents.repository';
import { SupplierDocumentExpirationService } from '../service/supplier-document-expiration.service';

describe('SupplierDocumentExpirationService', () => {
  let service: SupplierDocumentExpirationService;
  let repository: jest.Mocked<SupplierDocumentsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierDocumentExpirationService,
        {
          provide: SupplierDocumentsRepository,
          useValue: {
            findAllActiveDocuments: jest.fn(),
            findPolicy: jest.fn(),
            updateExpirationState: jest.fn(),
            findDocumentsExpiringInDays: jest.fn(),
            logAudit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SupplierDocumentExpirationService);
    repository = module.get(SupplierDocumentsRepository);
  });

  it('recalculates expired document statuses', async () => {
    const referenceDate = new Date('2026-07-06T12:00:00.000Z');
    repository.findAllActiveDocuments.mockResolvedValue([
      {
        id: 'doc-1',
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.RUT,
        status: 'UPLOADED',
        issuedAt: null,
        expiresAt: null,
        lastUploadedAt: new Date('2025-06-01T00:00:00.000Z'),
        uploadedByUserId: 'user-1',
        currentVersion: { id: 'ver-1' },
      },
    ]);
    repository.findPolicy.mockResolvedValue({
      tenantId: 'tenant-1',
      camaraComercioValidityDays: 30,
      rutAnnualReviewMonths: 11,
    });

    const updated = await service.recalculateAllDocumentStatuses(referenceDate);

    expect(updated).toBe(1);
    expect(repository.updateExpirationState).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'doc-1',
        status: 'EXPIRED',
      }),
    );
  });

  it('runs daily expiration and notification jobs', async () => {
    const recalculateSpy = jest
      .spyOn(service, 'recalculateAllDocumentStatuses')
      .mockResolvedValue(0);
    const notifySpy = jest.spyOn(service, 'notifyDocumentsExpiringInDays').mockResolvedValue(0);

    await service.handleDailyExpirationJob();

    expect(recalculateSpy).toHaveBeenCalled();
    expect(notifySpy).toHaveBeenCalledWith(15);
  });

  it('skips update when expiration state is unchanged', async () => {
    const referenceDate = new Date('2026-07-06T12:00:00.000Z');
    const expiresAt = new Date('2026-12-31T00:00:00.000Z');
    repository.findAllActiveDocuments.mockResolvedValue([
      {
        id: 'doc-3',
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.CERTIFICADO_BPM,
        status: 'UPLOADED',
        issuedAt: null,
        expiresAt,
        lastUploadedAt: new Date('2026-01-01'),
        uploadedByUserId: 'user-1',
        currentVersion: { id: 'ver-1' },
      },
    ]);
    repository.findPolicy.mockResolvedValue({
      tenantId: 'tenant-1',
      camaraComercioValidityDays: 30,
      rutAnnualReviewMonths: 11,
    });

    const updated = await service.recalculateAllDocumentStatuses(referenceDate);

    expect(updated).toBe(0);
    expect(repository.updateExpirationState).not.toHaveBeenCalled();
  });

  it('uses supplierId as actor when uploadedByUserId is missing', async () => {
    const referenceDate = new Date('2026-07-06T12:00:00.000Z');
    repository.findDocumentsExpiringInDays.mockResolvedValue([
      {
        id: 'doc-4',
        tenantId: 'tenant-1',
        supplierId: 'sup-actor',
        documentType: SupplierDocumentType.RUT,
        expiresAt: new Date('2026-07-21T00:00:00.000Z'),
        uploadedByUserId: null,
      },
    ]);

    await service.notifyDocumentsExpiringInDays(15, referenceDate);

    expect(repository.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 'sup-actor' }),
    );
  });

  it('creates audit alerts for documents expiring in 15 days', async () => {
    const referenceDate = new Date('2026-07-06T12:00:00.000Z');
    const expiresAt = new Date('2026-07-21T00:00:00.000Z');
    repository.findDocumentsExpiringInDays.mockResolvedValue([
      {
        id: 'doc-2',
        tenantId: 'tenant-1',
        supplierId: 'sup-1',
        documentType: SupplierDocumentType.CAMARA_COMERCIO,
        expiresAt,
        uploadedByUserId: 'user-1',
      },
    ]);

    const notified = await service.notifyDocumentsExpiringInDays(15, referenceDate);

    expect(notified).toBe(1);
    expect(repository.logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'doc-2',
        payload: expect.objectContaining({
          kind: 'SUPPLIER_DOCUMENT_EXPIRATION_ALERT',
        }),
      }),
    );
  });
});
