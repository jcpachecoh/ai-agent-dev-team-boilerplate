import { SupplierDocumentStatus, SupplierDocumentType } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import { SupplierDocumentsRepository } from '../repository/supplier-documents.repository';

const tenantId = 'tenant-1';
const supplierId = 'sup-1';

const storageObject = {
  mimeType: 'application/pdf',
  size: 1024,
  originalName: 'doc.pdf',
  visibility: 'PRIVATE' as const,
};

const currentVersionRow = {
  id: 'ver-1',
  tenantId,
  supplierDocumentId: 'doc-1',
  storageObjectId: 'st-1',
  versionNumber: 1,
  uploadedByUserId: 'user-1',
  uploadedAt: new Date('2026-07-01T00:00:00.000Z'),
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  storageObject,
};

const documentRow = {
  id: 'doc-1',
  tenantId,
  supplierId,
  documentType: SupplierDocumentType.RUT,
  status: SupplierDocumentStatus.UPLOADED,
  issuedAt: null,
  expiresAt: null,
  lastUploadedAt: new Date(),
  uploadedByUserId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  currentVersion: currentVersionRow,
};

const txMock = {
  supplierDocument: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  supplierDocumentVersion: {
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('SupplierDocumentsRepository', () => {
  const prismaMock = {
    supplier: { findFirst: jest.fn() },
    supplierDocumentPolicy: { findUnique: jest.fn(), create: jest.fn() },
    supplierDocument: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    supplierDocumentVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  let repository: SupplierDocumentsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SupplierDocumentsRepository(prismaMock as unknown as PrismaService);
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => unknown) =>
      cb(txMock),
    );
  });

  it('findSupplierFlags scopes by tenant and supplier', async () => {
    prismaMock.supplier.findFirst.mockResolvedValue({
      id: supplierId,
      tenantId,
      tipo: 'PERSONA_JURIDICA',
      isCritical: false,
      sellsRecurrentProducts: false,
      isFoodSupplier: false,
      handlesChemicals: false,
      isRawMaterialSupplier: false,
    });

    const result = await repository.findSupplierFlags(tenantId, supplierId);

    expect(result?.id).toBe(supplierId);
    expect(prismaMock.supplier.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: supplierId, tenantId } }),
    );
  });

  it('returns existing policy when one exists', async () => {
    const policy = {
      tenantId,
      camaraComercioValidityDays: 45,
      rutAnnualReviewMonths: 12,
    };
    prismaMock.supplierDocumentPolicy.findUnique.mockResolvedValue(policy);

    const result = await repository.findPolicy(tenantId);

    expect(result).toEqual(policy);
    expect(prismaMock.supplierDocumentPolicy.create).not.toHaveBeenCalled();
  });

  it('returns default policy when none exists', async () => {
    prismaMock.supplierDocumentPolicy.findUnique.mockResolvedValue(null);
    prismaMock.supplierDocumentPolicy.create.mockResolvedValue({
      tenantId,
      camaraComercioValidityDays: 30,
      rutAnnualReviewMonths: 11,
    });

    const policy = await repository.findPolicy(tenantId);

    expect(policy.camaraComercioValidityDays).toBe(30);
    expect(prismaMock.supplierDocumentPolicy.create).toHaveBeenCalled();
  });

  it('maps listBySupplier rows with current version', async () => {
    prismaMock.supplierDocument.findMany.mockResolvedValue([documentRow]);

    const result = await repository.listBySupplier(tenantId, supplierId);

    expect(result).toHaveLength(1);
    expect(result[0]?.documentType).toBe(SupplierDocumentType.RUT);
    expect(result[0]?.currentVersion?.originalName).toBe('doc.pdf');
  });

  it('findByType returns mapped document or null', async () => {
    prismaMock.supplierDocument.findFirst.mockResolvedValueOnce(documentRow);
    const found = await repository.findByType(tenantId, supplierId, SupplierDocumentType.RUT);
    expect(found?.id).toBe('doc-1');

    prismaMock.supplierDocument.findFirst.mockResolvedValueOnce(null);
    const missing = await repository.findByType(tenantId, supplierId, SupplierDocumentType.RUT);
    expect(missing).toBeNull();
  });

  it('upsertWithVersion creates a new document when none exists', async () => {
    txMock.supplierDocument.findFirst.mockResolvedValue(null);
    txMock.supplierDocument.create.mockResolvedValue({ id: 'doc-new' });
    txMock.supplierDocumentVersion.create.mockResolvedValue({
      id: 'ver-new',
      uploadedAt: new Date(),
    });
    txMock.supplierDocument.update.mockResolvedValue({});
    txMock.supplierDocument.findUnique.mockResolvedValue({
      ...documentRow,
      id: 'doc-new',
      currentVersion: { ...currentVersionRow, id: 'ver-new', versionNumber: 1 },
    });

    const result = await repository.upsertWithVersion({
      tenantId,
      supplierId,
      documentType: SupplierDocumentType.RUT,
      storageObjectId: 'st-1',
      uploadedByUserId: 'user-1',
    });

    expect(txMock.supplierDocument.create).toHaveBeenCalled();
    expect(result?.currentVersion?.versionNumber).toBe(1);
  });

  it('upsertWithVersion increments version on existing document', async () => {
    txMock.supplierDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      issuedAt: new Date('2026-01-01'),
      expiresAt: new Date('2026-12-31'),
      versions: [{ versionNumber: 2 }],
    });
    txMock.supplierDocumentVersion.create.mockResolvedValue({
      id: 'ver-3',
      uploadedAt: new Date(),
    });
    txMock.supplierDocument.update.mockResolvedValue({});
    txMock.supplierDocument.findUnique.mockResolvedValue({
      ...documentRow,
      currentVersion: { ...currentVersionRow, id: 'ver-3', versionNumber: 3 },
    });

    const result = await repository.upsertWithVersion({
      tenantId,
      supplierId,
      documentType: SupplierDocumentType.RUT,
      storageObjectId: 'st-2',
      uploadedByUserId: 'user-1',
    });

    expect(txMock.supplierDocument.create).not.toHaveBeenCalled();
    expect(txMock.supplierDocumentVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ versionNumber: 3 }) }),
    );
    expect(result?.currentVersion?.versionNumber).toBe(3);
  });

  it('softDeleteCurrentVersion returns null when document is missing', async () => {
    txMock.supplierDocument.findFirst.mockResolvedValue(null);

    const result = await repository.softDeleteCurrentVersion({
      tenantId,
      supplierId,
      documentType: SupplierDocumentType.RUT,
      deletedByUserId: 'user-1',
    });

    expect(result).toBeNull();
  });

  it('softDeleteCurrentVersion restores previous version when available', async () => {
    const previousVersion = {
      ...currentVersionRow,
      id: 'ver-prev',
      versionNumber: 1,
      uploadedAt: new Date('2026-06-01'),
    };
    txMock.supplierDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      currentVersionId: 'ver-2',
      versions: [{ ...currentVersionRow, id: 'ver-2', versionNumber: 2 }, previousVersion],
    });
    txMock.supplierDocumentVersion.update.mockResolvedValue({});
    txMock.supplierDocument.update.mockResolvedValue({});
    txMock.supplierDocument.findUnique.mockResolvedValue({
      ...documentRow,
      status: SupplierDocumentStatus.UPLOADED,
      currentVersion: previousVersion,
    });

    const result = await repository.softDeleteCurrentVersion({
      tenantId,
      supplierId,
      documentType: SupplierDocumentType.RUT,
      deletedByUserId: 'user-1',
    });

    expect(txMock.supplierDocumentVersion.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ver-2' } }),
    );
    expect(result?.status).toBe(SupplierDocumentStatus.UPLOADED);
    expect(result?.currentVersion?.id).toBe('ver-prev');
  });

  it('softDeleteCurrentVersion sets pending when no previous version exists', async () => {
    txMock.supplierDocument.findFirst.mockResolvedValue({
      id: 'doc-1',
      currentVersionId: 'ver-1',
      versions: [{ ...currentVersionRow, id: 'ver-1' }],
    });
    txMock.supplierDocumentVersion.update.mockResolvedValue({});
    txMock.supplierDocument.update.mockResolvedValue({});
    txMock.supplierDocument.findUnique.mockResolvedValue({
      ...documentRow,
      status: SupplierDocumentStatus.PENDING,
      currentVersion: null,
    });

    const result = await repository.softDeleteCurrentVersion({
      tenantId,
      supplierId,
      documentType: SupplierDocumentType.RUT,
      deletedByUserId: 'user-1',
    });

    expect(result?.status).toBe(SupplierDocumentStatus.PENDING);
    expect(result?.currentVersion).toBeNull();
  });

  it('findVersionById maps storage metadata', async () => {
    prismaMock.supplierDocumentVersion.findFirst.mockResolvedValueOnce({
      ...currentVersionRow,
      supplierDocumentId: 'doc-1',
    });
    const found = await repository.findVersionById(
      tenantId,
      supplierId,
      SupplierDocumentType.RUT,
      'ver-1',
    );
    expect(found?.mimeType).toBe('application/pdf');

    prismaMock.supplierDocumentVersion.findFirst.mockResolvedValueOnce(null);
    const missing = await repository.findVersionById(
      tenantId,
      supplierId,
      SupplierDocumentType.RUT,
      'missing',
    );
    expect(missing).toBeNull();
  });

  it('creates audit log entry', async () => {
    prismaMock.auditLog.create.mockResolvedValue({});

    await repository.logAudit({
      tenantId,
      actorUserId: 'user-1',
      action: 'VIEW',
      entityId: 'doc-1',
      payload: { foo: 'bar' },
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ entityType: 'SupplierDocument' }),
      }),
    );
  });

  it('findAllActiveDocuments filters active rows with current version', async () => {
    prismaMock.supplierDocument.findMany.mockResolvedValue([{ id: 'doc-1' }]);

    const rows = await repository.findAllActiveDocuments();

    expect(rows).toHaveLength(1);
    expect(prismaMock.supplierDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null, currentVersionId: { not: null } }),
      }),
    );
  });

  it('findDocumentsExpiringInDays queries the target day window', async () => {
    const referenceDate = new Date('2026-07-06T12:00:00.000Z');
    prismaMock.supplierDocument.findMany.mockResolvedValue([]);

    await repository.findDocumentsExpiringInDays(15, referenceDate);

    expect(prismaMock.supplierDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: expect.objectContaining({ gte: expect.any(Date), lt: expect.any(Date) }),
        }),
      }),
    );
  });

  it('updateExpirationState updates by tenant and document id', async () => {
    await repository.updateExpirationState({
      tenantId,
      documentId: 'doc-1',
      status: SupplierDocumentStatus.EXPIRED,
      expiresAt: new Date('2026-08-01'),
    });

    expect(prismaMock.supplierDocument.updateMany).toHaveBeenCalledWith({
      where: { id: 'doc-1', tenantId },
      data: {
        status: SupplierDocumentStatus.EXPIRED,
        expiresAt: expect.any(Date),
      },
    });
  });

  it('findPreviousVersion returns null without current version id', async () => {
    const result = await repository.findPreviousVersion(
      tenantId,
      supplierId,
      SupplierDocumentType.RUT,
      null,
    );

    expect(result).toBeNull();
    expect(prismaMock.supplierDocumentVersion.findFirst).not.toHaveBeenCalled();
  });

  it('findPreviousVersion maps the latest non-current version', async () => {
    prismaMock.supplierDocumentVersion.findFirst.mockResolvedValue({
      ...currentVersionRow,
      id: 'ver-prev',
      versionNumber: 1,
    });

    const result = await repository.findPreviousVersion(
      tenantId,
      supplierId,
      SupplierDocumentType.RUT,
      'ver-2',
    );

    expect(result?.id).toBe('ver-prev');
    expect(result?.originalName).toBe('doc.pdf');
  });
});
