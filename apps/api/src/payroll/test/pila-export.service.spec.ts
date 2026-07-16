import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, PilaExportFormat, PilaPeriodExportStatus, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

import { AuditService } from '../../audit/service/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import { PilaExportService } from '../pila/pila-export.service';
import { PilaPeriodExportRepository } from '../pila/pila-period-export.repository';
import { PilaPreparationService } from '../pila/pila-preparation.service';
import { buildCleanPilaDraft } from '../pila/serializer/fixtures/pila-clean-draft.fixture';
import { PilaFixedWidthSerializer } from '../pila/serializer/pila-fixed-width.serializer';

describe('PilaExportService', () => {
  let service: PilaExportService;
  let preparationService: { preparePeriod: jest.Mock };
  let exportRepository: {
    findMaxVersion: jest.Mock;
    findActiveByPeriod: jest.Mock;
    findActiveByPeriodAnyFormat: jest.Mock;
    findWithPaymentEvidence: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    voidActiveAndCreate: jest.Mock;
    updateStorageEntityId: jest.Mock;
    markPaid: jest.Mock;
    markPaidForPeriod: jest.Mock;
    markVoided: jest.Mock;
  };
  let storageService: {
    uploadFile: jest.Mock;
    deleteFile: jest.Mock;
    getObjectBuffer: jest.Mock;
  };
  let auditService: { log: jest.Mock };
  let prisma: { tenant: { findFirst: jest.Mock } };

  const tenantId = 'tenant-a';
  const actorUserId = 'user-1';
  const period = '2026-07';
  const draft = buildCleanPilaDraft();
  const flat = new PilaFixedWidthSerializer().serialize(draft, { version: 1 });
  const checksum = createHash('sha256').update(flat.bytes).digest('hex');

  const baseRecord = {
    id: 'exp-1',
    tenantId,
    periodHealth: period,
    periodOther: '2026-06',
    format: PilaExportFormat.TXT,
    status: PilaPeriodExportStatus.GENERATED,
    version: 1,
    technicalVersion: 'anexo2-v29',
    fileName: flat.suggestedFileName,
    fileChecksum: checksum,
    employeeCount: 1,
    totalPayrollAmount: 1_500_000,
    totalContribution: 500_000,
    snapshotJson: { draft },
    storageObjectId: 'sto-1',
    generatedAt: new Date('2026-07-15T12:00:00.000Z'),
    generatedBy: actorUserId,
    paidAt: null,
    paidConfirmedBy: null,
    planNumber: null,
    paymentReference: null,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    createdAt: new Date('2026-07-15T12:00:00.000Z'),
    updatedAt: new Date('2026-07-15T12:00:00.000Z'),
  };

  beforeEach(async () => {
    preparationService = {
      preparePeriod: jest.fn().mockResolvedValue({ ok: true, data: draft, errors: [] }),
    };
    exportRepository = {
      findMaxVersion: jest.fn().mockResolvedValue(0),
      findActiveByPeriod: jest.fn().mockResolvedValue(null),
      findActiveByPeriodAnyFormat: jest.fn().mockResolvedValue([]),
      findWithPaymentEvidence: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      list: jest.fn(),
      voidActiveAndCreate: jest.fn().mockResolvedValue(baseRecord),
      updateStorageEntityId: jest.fn().mockResolvedValue(undefined),
      markPaid: jest.fn(),
      markPaidForPeriod: jest.fn(),
      markVoided: jest.fn(),
    };
    storageService = {
      uploadFile: jest.fn().mockImplementation(async (input: { file: { buffer: Buffer } }) => ({
        id: 'sto-1',
        checksum: createHash('sha256').update(input.file.buffer).digest('hex'),
      })),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getObjectBuffer: jest.fn().mockResolvedValue(Buffer.from(flat.bytes)),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    prisma = {
      tenant: { findFirst: jest.fn().mockResolvedValue({ nit: '900000000' }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PilaExportService,
        { provide: PilaPreparationService, useValue: preparationService },
        { provide: PilaPeriodExportRepository, useValue: exportRepository },
        { provide: StorageService, useValue: storageService },
        { provide: AuditService, useValue: auditService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PilaExportService);
  });

  it('crea versión 1 y StorageObject con checksum de bytes exactos', async () => {
    const result = await service.generate(tenantId, period, actorUserId);

    expect(result.version).toBe(1);
    expect(result).not.toHaveProperty('snapshotJson');
    expect(storageService.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        domain: StorageDomain.PAYROLL,
        visibility: StorageVisibility.PRIVATE,
        file: expect.objectContaining({
          buffer: expect.any(Buffer),
          mimetype: 'text/plain',
          originalname: flat.suggestedFileName,
        }),
      }),
    );
    expect(exportRepository.voidActiveAndCreate).toHaveBeenCalledWith(
      null,
      null,
      expect.objectContaining({
        version: 1,
        format: PilaExportFormat.TXT,
        fileChecksum: checksum,
        status: PilaPeriodExportStatus.GENERATED,
        generatedBy: actorUserId,
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.EXPORT,
        entityType: 'PilaPeriodExport',
      }),
    );
  });

  it('genera XLSX sin anular TXT activo del mismo período', async () => {
    exportRepository.findActiveByPeriod.mockImplementation(
      async (_t: string, _p: string, format: PilaExportFormat) =>
        format === PilaExportFormat.TXT ? baseRecord : null,
    );
    exportRepository.voidActiveAndCreate.mockResolvedValue({
      ...baseRecord,
      id: 'exp-xlsx',
      format: PilaExportFormat.XLSX,
      fileName: 'pila.xlsx',
      technicalVersion: 'anexo2-v29+aportes-en-linea-v1',
    });

    const result = await service.generate(tenantId, period, actorUserId, PilaExportFormat.XLSX);

    expect(result.format).toBe(PilaExportFormat.XLSX);
    expect(exportRepository.findActiveByPeriod).toHaveBeenCalledWith(
      tenantId,
      period,
      PilaExportFormat.XLSX,
    );
    expect(exportRepository.voidActiveAndCreate).toHaveBeenCalledWith(
      null,
      null,
      expect.objectContaining({ format: PilaExportFormat.XLSX }),
    );
    expect(storageService.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      }),
    );
  });

  it('versionado independiente: TXT v2 no afecta secuencia XLSX', async () => {
    exportRepository.findMaxVersion.mockImplementation(
      async (_t: string, _p: string, format: PilaExportFormat) =>
        format === PilaExportFormat.TXT ? 1 : 0,
    );
    exportRepository.findActiveByPeriod.mockResolvedValue({
      ...baseRecord,
      id: 'exp-old',
      version: 1,
      status: PilaPeriodExportStatus.GENERATED,
    });
    exportRepository.voidActiveAndCreate.mockResolvedValue({
      ...baseRecord,
      id: 'exp-2',
      version: 2,
    });

    const result = await service.generate(tenantId, period, actorUserId, PilaExportFormat.TXT);
    expect(result.version).toBe(2);
    expect(exportRepository.findMaxVersion).toHaveBeenCalledWith(
      tenantId,
      period,
      PilaExportFormat.TXT,
    );
  });

  it('PAID del período bloquea regeneración de TXT y XLSX', async () => {
    exportRepository.findActiveByPeriod.mockResolvedValue(null);
    exportRepository.findWithPaymentEvidence.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.PAID,
      paidAt: new Date('2026-07-16T00:00:00.000Z'),
      planNumber: 'PL-1',
    });

    await expect(
      service.generate(tenantId, period, actorUserId, PilaExportFormat.TXT),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.generate(tenantId, period, actorUserId, PilaExportFormat.XLSX),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });

  it('XLSX >20 empleados → ZIP multi-lote; TXT sigue disponible después', async () => {
    const bigDraft = buildCleanPilaDraft({ employeeCount: 21 });
    preparationService.preparePeriod.mockResolvedValue({
      ok: true,
      data: bigDraft,
      errors: [],
    });
    exportRepository.findActiveByPeriod.mockImplementation(
      async (_t: string, _p: string, format: PilaExportFormat) =>
        format === PilaExportFormat.TXT ? baseRecord : null,
    );
    exportRepository.voidActiveAndCreate.mockResolvedValue({
      ...baseRecord,
      id: 'exp-xlsx-zip',
      format: PilaExportFormat.XLSX,
      fileName: 'pila-E-900000000-2026-07-v1-lotes-02.zip',
      employeeCount: 21,
      technicalVersion: 'anexo2-v29+ael-v1+zip',
    });

    const result = await service.generate(tenantId, period, actorUserId, PilaExportFormat.XLSX);

    expect(result.format).toBe(PilaExportFormat.XLSX);
    expect(result.fileName).toMatch(/lotes-02\.zip$/);
    expect(exportRepository.voidActiveAndCreate).toHaveBeenCalledWith(
      null,
      null,
      expect.objectContaining({
        technicalVersion: 'anexo2-v29+ael-v1+zip',
      }),
    );
    expect(storageService.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({
          mimetype: 'application/zip',
          originalname: expect.stringMatching(/\.zip$/),
        }),
      }),
    );

    exportRepository.voidActiveAndCreate.mockResolvedValue({
      ...baseRecord,
      employeeCount: 21,
    });
    const txt = await service.generate(tenantId, period, actorUserId, PilaExportFormat.TXT);
    expect(txt.format).toBe(PilaExportFormat.TXT);
  });

  it('genera versión 2 y anula GENERATED previa con REGENERATED', async () => {
    exportRepository.findMaxVersion.mockResolvedValue(1);
    exportRepository.findActiveByPeriod.mockResolvedValue({
      ...baseRecord,
      id: 'exp-old',
      version: 1,
      status: PilaPeriodExportStatus.GENERATED,
    });
    exportRepository.voidActiveAndCreate.mockResolvedValue({
      ...baseRecord,
      id: 'exp-2',
      version: 2,
    });

    const result = await service.generate(tenantId, period, actorUserId);

    expect(result.version).toBe(2);
    expect(exportRepository.voidActiveAndCreate).toHaveBeenCalledWith(
      'exp-old',
      expect.objectContaining({ voidReason: 'REGENERATED', voidedBy: actorUserId }),
      expect.objectContaining({ version: 2 }),
    );
  });

  it('bloquea generación si preparation falla', async () => {
    preparationService.preparePeriod.mockResolvedValue({
      ok: false,
      data: null,
      errors: [{ code: 'ERR_MISSING_NIT', field: 'nit', message: 'faltante' }],
    });

    await expect(service.generate(tenantId, period, actorUserId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });

  it('no regenera si existe PAID activo', async () => {
    exportRepository.findActiveByPeriod.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.PAID,
    });

    await expect(service.generate(tenantId, period, actorUserId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });

  it('no regenera tras anular una PAID (evidencia de pago)', async () => {
    exportRepository.findActiveByPeriod.mockResolvedValue(null);
    exportRepository.findWithPaymentEvidence.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.VOIDED,
      paidAt: new Date('2026-07-16T00:00:00.000Z'),
      planNumber: 'PL-1',
      paidConfirmedBy: actorUserId,
      paymentReference: 'REF-1',
    });

    try {
      await service.generate(tenantId, period, actorUserId);
      fail('expected ConflictException');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictException);
      expect((err as ConflictException).getResponse()).toMatchObject({
        code: 'ERR_PAID_HISTORY_BLOCKS_REGEN',
      });
    }
    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });

  it('anular PAID conserva evidencia de pago y audita', async () => {
    const paid = {
      ...baseRecord,
      status: PilaPeriodExportStatus.PAID,
      paidAt: new Date('2026-07-16T00:00:00.000Z'),
      planNumber: 'PL-1',
      paidConfirmedBy: actorUserId,
      paymentReference: 'REF-1',
    };
    exportRepository.findById.mockResolvedValue(paid);
    exportRepository.markVoided.mockResolvedValue({
      ...paid,
      status: PilaPeriodExportStatus.VOIDED,
      voidReason: 'Error operador',
      voidedBy: actorUserId,
      voidedAt: new Date(),
    });

    const voided = await service.voidExport(tenantId, 'exp-1', actorUserId, 'Error operador');
    expect(voided.planNumber).toBe('PL-1');
    expect(voided.paidAt).toEqual(paid.paidAt);
    expect(voided.paymentReference).toBe('REF-1');
    expect(voided.paidConfirmedBy).toBe(actorUserId);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.UPDATE,
        oldValue: expect.objectContaining({ planNumber: 'PL-1', paidAt: paid.paidAt }),
        newValue: expect.objectContaining({
          status: PilaPeriodExportStatus.VOIDED,
          planNumber: 'PL-1',
        }),
      }),
    );
  });

  it('si DB ya persistió, no borra Storage ante fallo posterior', async () => {
    exportRepository.updateStorageEntityId.mockRejectedValue(new Error('entity link failed'));

    const result = await service.generate(tenantId, period, actorUserId);
    expect(result.id).toBe('exp-1');
    expect(storageService.deleteFile).not.toHaveBeenCalled();
  });

  it('concurrencia: P2002 → ConflictException', async () => {
    exportRepository.voidActiveAndCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.generate(tenantId, period, actorUserId)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(storageService.deleteFile).toHaveBeenCalledWith('sto-1', tenantId);
  });

  it('rollback storage si falla persistencia DB', async () => {
    exportRepository.voidActiveAndCreate.mockRejectedValue(new Error('db down'));

    await expect(service.generate(tenantId, period, actorUserId)).rejects.toThrow('db down');
    expect(storageService.deleteFile).toHaveBeenCalledWith('sto-1', tenantId);
  });

  it('download devuelve exactamente los mismos bytes almacenados', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);
    storageService.getObjectBuffer.mockResolvedValue(Buffer.from(flat.bytes));

    const file = await service.download(tenantId, 'exp-1');

    expect(file.bytes.equals(flat.bytes)).toBe(true);
    expect(file.checksum).toBe(checksum);
    expect(storageService.getObjectBuffer).toHaveBeenCalledWith('sto-1', tenantId);
  });

  it('downloadAnexo2ReviewXlsx genera Excel desde snapshot del TXT', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);

    const file = await service.downloadAnexo2ReviewXlsx(tenantId, 'exp-1');

    expect(file.mimeType).toContain('spreadsheetml');
    expect(file.fileName).toMatch(/anexo2-revision\.xlsx$/);
    expect(file.bytes.byteLength).toBeGreaterThan(1000);
    expect(storageService.getObjectBuffer).not.toHaveBeenCalled();
  });

  it('downloadAnexo2ReviewXlsx rechaza formato XLSX (Aportes en Línea)', async () => {
    exportRepository.findById.mockResolvedValue({
      ...baseRecord,
      format: PilaExportFormat.XLSX,
      fileName: 'pila.xlsx',
    });

    await expect(service.downloadAnexo2ReviewXlsx(tenantId, 'exp-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('list no expone snapshotJson', async () => {
    exportRepository.list.mockResolvedValue([baseRecord]);
    const rows = await service.list(tenantId, {});
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty('snapshotJson');
  });

  it('marca pagado a nivel de período (todos los GENERATED activos)', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);
    const paidRow = {
      ...baseRecord,
      status: PilaPeriodExportStatus.PAID,
      planNumber: 'PL-1',
      paidConfirmedBy: actorUserId,
      paidAt: new Date('2026-07-16T00:00:00.000Z'),
    };
    exportRepository.markPaidForPeriod.mockResolvedValue([paidRow]);

    const paid = await service.markPaid(tenantId, 'exp-1', actorUserId, {
      planNumber: 'PL-1',
      paidAt: '2026-07-16T00:00:00.000Z',
    });

    expect(paid.status).toBe(PilaPeriodExportStatus.PAID);
    expect(exportRepository.markPaidForPeriod).toHaveBeenCalledWith(
      tenantId,
      period,
      expect.objectContaining({
        paidConfirmedBy: actorUserId,
        planNumber: 'PL-1',
      }),
    );
  });

  it('transición inválida: no pagar VOIDED', async () => {
    exportRepository.findById.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.VOIDED,
    });
    await expect(
      service.markPaid(tenantId, 'exp-1', actorUserId, {
        planNumber: 'X',
        paidAt: '2026-07-16T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('anula GENERATED y también PAID (decisión explícita)', async () => {
    exportRepository.findById.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.PAID,
    });
    exportRepository.markVoided.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.VOIDED,
      voidReason: 'Error operador',
    });

    const voided = await service.voidExport(tenantId, 'exp-1', actorUserId, 'Error operador');
    expect(voided.status).toBe(PilaPeriodExportStatus.VOIDED);
  });

  it('aislamiento por tenant: id de otro tenant → NotFound', async () => {
    exportRepository.findById.mockResolvedValue(null);
    await expect(service.download(tenantId, 'exp-other')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('validatePreparation no persiste ni sube archivo', async () => {
    const result = await service.validatePreparation(tenantId, period, actorUserId);
    expect(result.ok).toBe(true);
    expect(result.summary).toEqual(
      expect.objectContaining({
        employeeCount: 1,
        period,
        xlsxMaxEmployees: 20,
        xlsxSupported: true,
        xlsxBatchCount: 1,
      }),
    );
    expect(storageService.uploadFile).not.toHaveBeenCalled();
    expect(exportRepository.voidActiveAndCreate).not.toHaveBeenCalled();
  });

  it('validatePreparation con errores no inventa summary', async () => {
    preparationService.preparePeriod.mockResolvedValue({
      ok: false,
      data: null,
      errors: [{ code: 'ERR', field: 'x', message: 'fail' }],
    });
    const result = await service.validatePreparation(tenantId, period, actorUserId);
    expect(result.ok).toBe(false);
    expect(result.summary).toBeNull();
  });

  it('rechaza format inválido', async () => {
    await expect(
      service.generate(tenantId, period, actorUserId, 'PDF' as PilaExportFormat),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('list filtra por format', async () => {
    exportRepository.list.mockResolvedValue([baseRecord]);
    await service.list(tenantId, { period, format: PilaExportFormat.TXT });
    expect(exportRepository.list).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ periodHealth: period, format: PilaExportFormat.TXT }),
    );
  });

  it('download XLSX usa mime spreadsheet', async () => {
    exportRepository.findById.mockResolvedValue({
      ...baseRecord,
      format: PilaExportFormat.XLSX,
      fileName: 'pila.xlsx',
      fileChecksum: createHash('sha256').update(Buffer.from('xlsx')).digest('hex'),
    });
    storageService.getObjectBuffer.mockResolvedValue(Buffer.from('xlsx'));
    const file = await service.download(tenantId, 'exp-1');
    expect(file.mimeType).toContain('spreadsheetml');
  });

  it('download con checksum mismatch → ConflictException', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);
    storageService.getObjectBuffer.mockResolvedValue(Buffer.from('tampered'));
    await expect(service.download(tenantId, 'exp-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('getDeadline marca PAID si hay export activa pagada', async () => {
    exportRepository.findActiveByPeriodAnyFormat.mockResolvedValue([
      { ...baseRecord, status: PilaPeriodExportStatus.PAID },
    ]);
    prisma.tenant.findFirst.mockResolvedValue({ nit: '900000000' });
    const deadline = await service.getDeadline(tenantId, period);
    expect(deadline.status).toBe('PAID');
  });

  it('getDeadline sin NIT → CONFIG_INCOMPLETE', async () => {
    exportRepository.findActiveByPeriodAnyFormat.mockResolvedValue([]);
    prisma.tenant.findFirst.mockResolvedValue({ nit: null });
    const deadline = await service.getDeadline(tenantId, period);
    expect(deadline.status).toBe('CONFIG_INCOMPLETE');
  });

  it('markPaid rechaza paidAt inválido', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);
    await expect(
      service.markPaid(tenantId, 'exp-1', actorUserId, {
        planNumber: 'PL-1',
        paidAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('markPaid acepta Date y paymentReference vacío → null', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);
    exportRepository.markPaidForPeriod.mockResolvedValue([
      {
        ...baseRecord,
        status: PilaPeriodExportStatus.PAID,
        planNumber: 'PL-2',
        paymentReference: null,
        paidAt: new Date('2026-07-16T00:00:00.000Z'),
      },
    ]);
    const paid = await service.markPaid(tenantId, 'exp-1', actorUserId, {
      planNumber: 'PL-2',
      paymentReference: '   ',
      paidAt: new Date('2026-07-16T00:00:00.000Z'),
    });
    expect(paid.planNumber).toBe('PL-2');
    expect(exportRepository.markPaidForPeriod).toHaveBeenCalledWith(
      tenantId,
      period,
      expect.objectContaining({ paymentReference: null }),
    );
  });

  it('markPaid sin filas actualizadas → ConflictException', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);
    exportRepository.markPaidForPeriod.mockResolvedValue([]);
    await expect(
      service.markPaid(tenantId, 'exp-1', actorUserId, {
        planNumber: 'PL-1',
        paidAt: '2026-07-16T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('markPaid sobre PAID activo → transición inválida', async () => {
    exportRepository.findById.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.PAID,
    });
    await expect(
      service.markPaid(tenantId, 'exp-1', actorUserId, {
        planNumber: 'PL-1',
        paidAt: '2026-07-16T00:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('void ya VOIDED → ConflictException', async () => {
    exportRepository.findById.mockResolvedValue({
      ...baseRecord,
      status: PilaPeriodExportStatus.VOIDED,
    });
    await expect(service.voidExport(tenantId, 'exp-1', actorUserId, 'x')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('void con reason vacío → BadRequestException', async () => {
    exportRepository.findById.mockResolvedValue(baseRecord);
    await expect(service.voidExport(tenantId, 'exp-1', actorUserId, '  ')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('cleanup Storage best-effort si deleteFile falla tras error DB', async () => {
    exportRepository.voidActiveAndCreate.mockRejectedValue(new Error('db down'));
    storageService.deleteFile.mockRejectedValue(new Error('storage down'));
    await expect(service.generate(tenantId, period, actorUserId)).rejects.toThrow('db down');
  });

  it('falla si Storage reporta checksum distinto al generado', async () => {
    storageService.uploadFile.mockResolvedValue({
      id: 'sto-bad',
      checksum: '0'.repeat(64),
    });
    await expect(service.generate(tenantId, period, actorUserId)).rejects.toThrow(
      /Storage checksum mismatch/,
    );
  });

  it('Bogotá acepta ciudad BOGOTA en XLSX', async () => {
    const draftWithCity = buildCleanPilaDraft({ employeeCount: 1 });
    draftWithCity.cotizantes[0].locationCityName = 'BOGOTA';
    preparationService.preparePeriod.mockResolvedValue({
      ok: true,
      data: draftWithCity,
      errors: [],
    });
    exportRepository.voidActiveAndCreate.mockResolvedValue({
      ...baseRecord,
      format: PilaExportFormat.XLSX,
      fileName: 'pila.xlsx',
    });
    const result = await service.generate(tenantId, period, actorUserId, PilaExportFormat.XLSX);
    expect(result.format).toBe(PilaExportFormat.XLSX);
  });
});
