import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, PilaExportFormat, PilaPeriodExportStatus, Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';

import { AuditService } from '../../audit/service/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import { getPilaDeadlineStatus, type PilaDeadlineResult } from '../utils/pila-deadline.util';
import { PILA_TECHNICAL_VERSION } from './serializer/pila-fixed-width.constants';
import { PilaFixedWidthSerializer } from './serializer/pila-fixed-width.serializer';
import {
  PILA_XLSX_MAX_EMPLOYEES,
  PILA_XLSX_TEMPLATE_VERSION,
} from './serializer/pila-xlsx-catalog.maps';
import { PilaXlsxSerializationError, PilaXlsxSerializer } from './serializer/pila-xlsx.serializer';
import type { PilaPeriodDraft, PilaPreparationResult } from './pila-preparation.interfaces';
import { PilaPreparationService } from './pila-preparation.service';
import type { PilaPeriodExportRecord } from './pila-period-export.interfaces';
import { PilaPeriodExportRepository } from './pila-period-export.repository';

const VOID_REASON_REGENERATED = 'REGENERATED';
const PILA_MIME_TXT = 'text/plain';
const PILA_MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Alias explícito del serializador TXT (Anexo 2). */
export { PilaFixedWidthSerializer as PilaTxtSerializer };

export type PilaExportListItem = Omit<PilaPeriodExportRecord, 'snapshotJson'>;

export type PilaExportDownloadResult = {
  fileName: string;
  mimeType: string;
  checksum: string;
  bytes: Buffer;
};

export type PilaGenerateFormat = PilaExportFormat;

@Injectable()
export class PilaExportService {
  private readonly txtSerializer = new PilaFixedWidthSerializer();
  private readonly xlsxSerializer = new PilaXlsxSerializer();

  constructor(
    private readonly preparationService: PilaPreparationService,
    private readonly exportRepository: PilaPeriodExportRepository,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async validatePreparation(
    tenantId: string,
    period: string,
    actorUserId: string,
  ): Promise<PilaPreparationResult & { summary: Record<string, unknown> | null }> {
    const result = await this.preparationService.preparePeriod(tenantId, period, {
      userId: actorUserId,
      roleCode: '',
    });
    if (!result.ok) {
      return { ...result, summary: null };
    }
    return {
      ...result,
      summary: this.buildSummary(result.data),
    };
  }

  async generate(
    tenantId: string,
    period: string,
    actorUserId: string,
    format: PilaGenerateFormat = PilaExportFormat.TXT,
  ): Promise<PilaExportListItem> {
    if (format !== PilaExportFormat.TXT && format !== PilaExportFormat.XLSX) {
      throw new BadRequestException({
        message: 'format must be TXT or XLSX',
        code: 'ERR_PILA_INVALID_FORMAT',
      });
    }

    const preparation = await this.preparationService.preparePeriod(tenantId, period, {
      userId: actorUserId,
      roleCode: '',
    });
    if (!preparation.ok) {
      throw new BadRequestException({
        message: 'PILA preparation failed',
        code: 'PILA_VALIDATION_FAILED',
        errors: preparation.errors,
      });
    }

    const draft = preparation.data;
    const active = await this.exportRepository.findActiveByPeriod(tenantId, period, format);
    if (active?.status === PilaPeriodExportStatus.PAID) {
      throw new ConflictException({
        message: 'Cannot regenerate a PAID PILA export without voiding first',
        code: 'ERR_ALREADY_PAID',
        exportId: active.id,
        version: active.version,
        format,
      });
    }

    const paidEvidence = await this.exportRepository.findWithPaymentEvidence(tenantId, period);
    if (paidEvidence) {
      throw new ConflictException({
        message:
          'Cannot regenerate PILA after a paid export exists for this period (including voided paid)',
        code: 'ERR_PAID_HISTORY_BLOCKS_REGEN',
        exportId: paidEvidence.id,
        version: paidEvidence.version,
        status: paidEvidence.status,
        format: paidEvidence.format,
      });
    }

    const maxVersion = await this.exportRepository.findMaxVersion(tenantId, period, format);
    const nextVersion = maxVersion + 1;

    let fileName: string;
    let bytes: Buffer;
    let mimeType: string;
    let technicalVersion: string;

    try {
      if (format === PilaExportFormat.TXT) {
        const flat = this.txtSerializer.serialize(draft, { version: nextVersion });
        fileName = flat.suggestedFileName;
        bytes = flat.bytes;
        mimeType = PILA_MIME_TXT;
        technicalVersion = PILA_TECHNICAL_VERSION;
      } else {
        const xlsx = await this.xlsxSerializer.serializeAsync(draft, { version: nextVersion });
        fileName = xlsx.suggestedFileName;
        bytes = xlsx.bytes;
        mimeType = PILA_MIME_XLSX;
        technicalVersion = `${PILA_TECHNICAL_VERSION}+${PILA_XLSX_TEMPLATE_VERSION}`;
      }
    } catch (err) {
      if (err instanceof PilaXlsxSerializationError) {
        throw new BadRequestException({
          message: err.message,
          code: err.details.code,
          field: err.field,
          internalValue: err.details.internalValue,
          expectedHint: err.details.expectedHint,
          employeeId: err.details.employeeId,
          employeeName: err.details.employeeName,
          actualCount: err.details.actualCount,
          maxAllowed: err.details.maxAllowed,
          recommendedAction: err.details.recommendedAction,
        });
      }
      throw err;
    }

    const checksum = createHash('sha256').update(bytes).digest('hex');

    let storageId: string | null = null;
    let persistedExportId: string | null = null;
    try {
      const stored = await this.storageService.uploadFile({
        tenantId,
        uploadedBy: actorUserId,
        domain: StorageDomain.PAYROLL,
        entityType: 'PilaPeriodExport',
        visibility: StorageVisibility.PRIVATE,
        file: {
          buffer: bytes,
          mimetype: mimeType,
          originalname: fileName,
          size: bytes.byteLength,
        },
      });
      storageId = stored.id;

      if (stored.checksum !== checksum) {
        throw new Error('Storage checksum mismatch vs generated PILA bytes');
      }

      const now = new Date();
      const createData = {
        tenantId,
        periodHealth: draft.aportante.periodHealth,
        periodOther: draft.aportante.periodOther,
        format,
        status: PilaPeriodExportStatus.GENERATED,
        version: nextVersion,
        technicalVersion,
        fileName,
        fileChecksum: checksum,
        employeeCount: draft.totals.employeeCount,
        totalPayrollAmount: Math.round(draft.totals.totalPayrollCost),
        totalContribution: Math.round(
          draft.totals.totalEmployeeContributions + draft.totals.totalEmployerContributions,
        ),
        snapshotJson: this.buildSnapshot(draft, preparation, format) as Prisma.InputJsonValue,
        storageObjectId: stored.id,
        generatedAt: now,
        generatedBy: actorUserId,
      };

      let record: PilaPeriodExportRecord;
      try {
        record = await this.exportRepository.voidActiveAndCreate(
          active?.status === PilaPeriodExportStatus.GENERATED ? active.id : null,
          active?.status === PilaPeriodExportStatus.GENERATED
            ? {
                voidedAt: now,
                voidedBy: actorUserId,
                voidReason: VOID_REASON_REGENERATED,
              }
            : null,
          createData,
        );
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new ConflictException({
            message: 'Concurrent PILA generation produced a duplicate version',
            code: 'ERR_PILA_VERSION_CONFLICT',
            format,
          });
        }
        throw err;
      }
      persistedExportId = record.id;

      try {
        await this.exportRepository.updateStorageEntityId(stored.id, record.id);
      } catch {
        // entityId queda null
      }

      try {
        await this.auditService.log({
          tenantId,
          action: AuditAction.EXPORT,
          entityType: 'PilaPeriodExport',
          entityId: record.id,
          actorUserId,
          payload: {
            periodHealth: record.periodHealth,
            format: record.format,
            version: record.version,
            fileChecksum: record.fileChecksum,
            previousExportId: active?.id ?? null,
            previousVoidReason:
              active?.status === PilaPeriodExportStatus.GENERATED ? VOID_REASON_REGENERATED : null,
          },
        });
      } catch {
        // best-effort
      }

      return this.toListItem(record);
    } catch (err) {
      if (storageId && !persistedExportId) {
        try {
          await this.storageService.deleteFile(storageId, tenantId);
        } catch {
          // best-effort cleanup
        }
      }
      throw err;
    }
  }

  async list(
    tenantId: string,
    filter: { period?: string; status?: PilaPeriodExportStatus; format?: PilaExportFormat },
  ): Promise<PilaExportListItem[]> {
    const rows = await this.exportRepository.list(tenantId, {
      periodHealth: filter.period,
      status: filter.status,
      format: filter.format,
    });
    return rows.map((row) => this.toListItem(row));
  }

  async getDeadline(tenantId: string, period: string): Promise<PilaDeadlineResult> {
    const [tenant, actives] = await Promise.all([
      this.prisma.tenant.findFirst({
        where: { id: tenantId, deletedAt: null },
        select: { nit: true },
      }),
      this.exportRepository.findActiveByPeriodAnyFormat(tenantId, period),
    ]);

    const isPaid = actives.some((row) => row.status === PilaPeriodExportStatus.PAID);

    return getPilaDeadlineStatus({
      period,
      nit: tenant?.nit ?? null,
      isPaid,
    });
  }

  async download(tenantId: string, exportId: string): Promise<PilaExportDownloadResult> {
    const record = await this.requireExport(tenantId, exportId);
    const bytes = await this.storageService.getObjectBuffer(record.storageObjectId, tenantId);
    const checksum = createHash('sha256').update(bytes).digest('hex');
    if (checksum !== record.fileChecksum) {
      throw new ConflictException({
        message: 'Stored PILA bytes checksum does not match export metadata',
        code: 'ERR_PILA_CHECKSUM_MISMATCH',
      });
    }
    return {
      fileName: record.fileName,
      mimeType: record.format === PilaExportFormat.XLSX ? PILA_MIME_XLSX : PILA_MIME_TXT,
      checksum,
      bytes,
    };
  }

  /**
   * Pago por período: evidencia única aplicada a todos los GENERATED activos del período.
   */
  async markPaid(
    tenantId: string,
    exportId: string,
    actorUserId: string,
    body: { planNumber: string; paymentReference?: string; paidAt: string | Date },
  ): Promise<PilaExportListItem> {
    const record = await this.requireExport(tenantId, exportId);
    if (record.status === PilaPeriodExportStatus.VOIDED) {
      throw new ConflictException({
        message: 'Cannot mark a VOIDED PILA export as paid',
        code: 'ERR_PILA_VOIDED',
      });
    }
    if (record.status !== PilaPeriodExportStatus.GENERATED) {
      throw new ConflictException({
        message: 'Only GENERATED exports can be marked as PAID',
        code: 'ERR_PILA_INVALID_TRANSITION',
        status: record.status,
      });
    }

    const paidAt = body.paidAt instanceof Date ? body.paidAt : new Date(body.paidAt);
    if (Number.isNaN(paidAt.getTime())) {
      throw new BadRequestException('paidAt must be a valid ISO date');
    }

    const payment = {
      paidAt,
      paidConfirmedBy: actorUserId,
      planNumber: body.planNumber.trim(),
      paymentReference: body.paymentReference?.trim() || null,
    };

    const updatedRows = await this.exportRepository.markPaidForPeriod(
      tenantId,
      record.periodHealth,
      payment,
    );
    const updated = updatedRows.find((row) => row.id === record.id) ?? updatedRows[0];
    if (!updated) {
      throw new ConflictException({
        message: 'No active GENERATED exports to mark as paid',
        code: 'ERR_PILA_INVALID_TRANSITION',
      });
    }

    await this.auditService.log({
      tenantId,
      action: AuditAction.UPDATE,
      entityType: 'PilaPeriodExport',
      entityId: updated.id,
      actorUserId,
      payload: {
        from: PilaPeriodExportStatus.GENERATED,
        to: PilaPeriodExportStatus.PAID,
        scope: 'period',
        periodHealth: record.periodHealth,
        formatsPaid: updatedRows.map((row) => row.format),
        planNumber: updated.planNumber,
        paymentReference: updated.paymentReference,
        paidAt: updated.paidAt,
      },
    });

    return this.toListItem(updated);
  }

  async voidExport(
    tenantId: string,
    exportId: string,
    actorUserId: string,
    reason: string,
  ): Promise<PilaExportListItem> {
    const record = await this.requireExport(tenantId, exportId);
    if (record.status === PilaPeriodExportStatus.VOIDED) {
      throw new ConflictException({
        message: 'Export is already VOIDED',
        code: 'ERR_PILA_ALREADY_VOIDED',
      });
    }
    if (
      record.status !== PilaPeriodExportStatus.GENERATED &&
      record.status !== PilaPeriodExportStatus.PAID
    ) {
      throw new ConflictException({
        message: 'Invalid status for void',
        code: 'ERR_PILA_INVALID_TRANSITION',
        status: record.status,
      });
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('reason is required');
    }

    const updated = await this.exportRepository.markVoided(record.id, tenantId, {
      voidedAt: new Date(),
      voidedBy: actorUserId,
      voidReason: trimmed,
    });

    await this.auditService.log({
      tenantId,
      action: AuditAction.UPDATE,
      entityType: 'PilaPeriodExport',
      entityId: updated.id,
      actorUserId,
      oldValue: {
        status: record.status,
        format: record.format,
        paidAt: record.paidAt,
        planNumber: record.planNumber,
        paymentReference: record.paymentReference,
        paidConfirmedBy: record.paidConfirmedBy,
      },
      newValue: {
        status: PilaPeriodExportStatus.VOIDED,
        format: updated.format,
        voidReason: trimmed,
        paidAt: updated.paidAt,
        planNumber: updated.planNumber,
        paymentReference: updated.paymentReference,
        paidConfirmedBy: updated.paidConfirmedBy,
      },
    });

    return this.toListItem(updated);
  }

  private async requireExport(tenantId: string, exportId: string): Promise<PilaPeriodExportRecord> {
    const record = await this.exportRepository.findById(exportId, tenantId);
    if (!record) {
      throw new NotFoundException(`PILA export ${exportId} not found`);
    }
    return record;
  }

  private toListItem(record: PilaPeriodExportRecord): PilaExportListItem {
    const { snapshotJson: _snapshot, ...rest } = record;
    return rest;
  }

  private buildSummary(draft: PilaPeriodDraft): Record<string, unknown> {
    const employeeCount = draft.totals.employeeCount;
    return {
      period: draft.period,
      periodHealth: draft.aportante.periodHealth,
      periodOther: draft.aportante.periodOther,
      employeeCount,
      totalPayrollCost: draft.totals.totalPayrollCost,
      totalEmployeeContributions: draft.totals.totalEmployeeContributions,
      totalEmployerContributions: draft.totals.totalEmployerContributions,
      nit: draft.aportante.nit,
      xlsxMaxEmployees: PILA_XLSX_MAX_EMPLOYEES,
      xlsxSupported: employeeCount <= PILA_XLSX_MAX_EMPLOYEES,
      formats: {
        TXT: { available: true },
        XLSX: {
          available: employeeCount <= PILA_XLSX_MAX_EMPLOYEES,
          maxEmployees: PILA_XLSX_MAX_EMPLOYEES,
        },
      },
    };
  }

  private buildSnapshot(
    draft: PilaPeriodDraft,
    preparation: Extract<PilaPreparationResult, { ok: true }>,
    format: PilaExportFormat,
  ): Record<string, unknown> {
    return {
      technicalVersion: PILA_TECHNICAL_VERSION,
      format,
      xlsxTemplateVersion: format === PilaExportFormat.XLSX ? PILA_XLSX_TEMPLATE_VERSION : null,
      preparedAt: new Date().toISOString(),
      validationOk: preparation.ok,
      encodingNote:
        'snapshot keeps original legal names; ASCII sanitization applies only to TXT flat file bytes',
      draft,
    };
  }
}
