import { ConflictException, Injectable } from '@nestjs/common';
import { FinalSettlement, FinalSettlementStatus, Prisma, SettlementLine } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  ApproveFinalSettlementData,
  ApproveSideEffect,
  CreateFinalSettlementData,
  FinalSettlementRecord,
  IFinalSettlementRepository,
  MarkPaidFinalSettlementData,
  RecalculateFinalSettlementData,
  SettlementAuditEvent,
  SettlementLineInput,
  SettlementLineRecord,
  VoidFinalSettlementData,
} from '../interfaces/final-settlement.interfaces';

type FinalSettlementWithLines = FinalSettlement & { lines: SettlementLine[] };

/**
 * OS-591 (fase 2) — Persistencia de liquidaciones definitivas y sus líneas.
 *
 * Invariante de "solo una liquidación activa por contrato": reforzada en DOS capas:
 * 1. Aquí, antes de cada `create()`: si ya existe una liquidación no anulada para
 *    el mismo `contractId` se lanza `ConflictException`. Para reemplazarla, primero
 *    anularla con `void()`.
 * 2. En la base de datos: índice único parcial `final_settlements_active_per_contract_key`
 *    (migración 20260714200000). Si la validación de aplicación no detectara una
 *    condición de carrera, Postgres lanzará un P2002 que se captura aquí y se
 *    convierte en `ConflictException`.
 */
@Injectable()
export class FinalSettlementRepository implements IFinalSettlementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, id: string): Promise<FinalSettlementRecord | null> {
    const row = await this.prisma.finalSettlement.findFirst({
      where: { id, tenantId },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    return row ? this.map(row) : null;
  }

  async findActiveByContract(
    tenantId: string,
    contractId: string,
  ): Promise<FinalSettlementRecord | null> {
    const row = await this.prisma.finalSettlement.findFirst({
      where: {
        tenantId,
        contractId,
        status: { not: FinalSettlementStatus.VOIDED },
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.map(row) : null;
  }

  async findAllByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<FinalSettlementRecord[]> {
    const rows = await this.prisma.finalSettlement.findMany({
      where: { tenantId, employeeDetailsId },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row): FinalSettlementRecord => this.map(row));
  }

  async create(data: CreateFinalSettlementData): Promise<FinalSettlementRecord> {
    // ── Invariante: solo una liquidación activa por contrato (capa aplicación) ─
    const existing = await this.findActiveByContract(data.tenantId, data.contractId);
    if (existing) {
      throw new ConflictException(
        `Ya existe una liquidación activa (id=${existing.id}, status=${existing.status}) para el contrato ${data.contractId}. Anúlala antes de crear una nueva.`,
      );
    }

    const now = new Date();
    const auditEvent: SettlementAuditEvent = {
      event: data.mode === 'MANUAL' ? 'MANUAL_CREATED' : 'DRAFT_CREATED',
      actor: data.createdBy ?? null,
      timestamp: now.toISOString(),
      totals: {
        grossDevengados: data.grossDevengados.toFixed(2),
        totalDeducciones: data.totalDeducciones.toFixed(2),
        netAmount: data.netAmount.toFixed(2),
        netNegativeAmount: data.snapshotNetNegativeAmount.greaterThan(0)
          ? data.snapshotNetNegativeAmount.toFixed(2)
          : undefined,
      },
    };

    try {
      const row = await this.prisma.finalSettlement.create({
        data: {
          tenantId: data.tenantId,
          employeeDetailsId: data.employeeDetailsId,
          contractId: data.contractId,
          effectiveTerminationDate: data.effectiveTerminationDate,
          terminationReason: data.terminationReason,
          status: FinalSettlementStatus.CALCULATED,
          mode: data.mode,
          snapshotContractType: data.snapshotContractType,
          snapshotContractStartDate: data.snapshotContractStartDate,
          snapshotAgreedEndDate: data.snapshotAgreedEndDate ?? null,
          snapshotSalaryType: data.snapshotSalaryType,
          snapshotSalaryAmount: data.snapshotSalaryAmount,
          snapshotSmlvAmount: data.snapshotSmlvAmount,
          snapshotTransportSubsidyAmount: data.snapshotTransportSubsidyAmount,
          snapshotFormulaVersion: data.snapshotFormulaVersion,
          snapshotSmlvThreshold: data.snapshotSmlvThreshold,
          snapshotVariableAvgMonthsCovered: data.snapshotVariableAvgMonthsCovered,
          snapshotVariableAvgTotal: data.snapshotVariableAvgTotal,
          snapshotVariableAvgMonthly: data.snapshotVariableAvgMonthly,
          grossDevengados: data.grossDevengados,
          totalDeducciones: data.totalDeducciones,
          netAmount: data.netAmount,
          snapshotNetNegativeAmount: data.snapshotNetNegativeAmount,
          manualJustification: data.manualJustification ?? null,
          manualReference: data.manualReference ?? null,
          manualResponsible: data.manualResponsible ?? null,
          acceptedWarnings: data.acceptedWarnings ?? [],
          auditTrail: [auditEvent] as unknown as Prisma.InputJsonValue,
          createdBy: data.createdBy ?? null,
          calculatedBy: data.createdBy ?? null,
          calculatedAt: now,
          lines: {
            create: this.buildLinesCreate(data.tenantId, data.lines),
          },
        },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
      return this.map(row);
    } catch (err) {
      // Índice único parcial violado (carrera concurrente) — mismo código que app-level check
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          `Conflicto de concurrencia: ya existe una liquidación activa para el contrato ${data.contractId}. Reintente o anule la liquidación existente.`,
        );
      }
      throw err;
    }
  }

  async recalculate(data: RecalculateFinalSettlementData): Promise<FinalSettlementRecord> {
    const now = new Date();

    // Borrar líneas antiguas y recrear + verificar estado dentro de la misma transacción
    // para evitar condiciones de carrera (dos recálculos concurrentes del mismo settlement).
    const row = await this.prisma.$transaction(async (tx): Promise<FinalSettlementWithLines> => {
      // Leer el estado actual DENTRO de la transacción para bloquear estados inválidos
      // y prevenir condiciones de carrera en recálculos concurrentes.
      const current = await tx.finalSettlement.findFirst({
        where: { id: data.id, tenantId: data.tenantId },
        select: { status: true, auditTrail: true, acceptedWarnings: true },
      });

      if (!current) {
        throw new Error(`Liquidación ${data.id} no encontrada`);
      }

      if (current.status !== FinalSettlementStatus.CALCULATED) {
        throw new ConflictException(
          `No se puede recalcular: la liquidación tiene status=${current.status} (se requiere CALCULATED).`,
        );
      }

      const previousTrail = (current.auditTrail as SettlementAuditEvent[]) ?? [];
      const recalcEvent: SettlementAuditEvent = {
        event: 'RECALCULATED',
        actor: data.calculatedBy ?? null,
        timestamp: now.toISOString(),
        totals: {
          grossDevengados: data.grossDevengados.toFixed(2),
          totalDeducciones: data.totalDeducciones.toFixed(2),
          netAmount: data.netAmount.toFixed(2),
          netNegativeAmount: data.snapshotNetNegativeAmount.greaterThan(0)
            ? data.snapshotNetNegativeAmount.toFixed(2)
            : undefined,
        },
      };
      const updatedTrail = [...previousTrail, recalcEvent];

      await tx.settlementLine.deleteMany({ where: { settlementId: data.id } });

      return tx.finalSettlement.update({
        where: { id: data.id },
        data: {
          grossDevengados: data.grossDevengados,
          totalDeducciones: data.totalDeducciones,
          netAmount: data.netAmount,
          snapshotNetNegativeAmount: data.snapshotNetNegativeAmount,
          snapshotVariableAvgMonthsCovered: data.snapshotVariableAvgMonthsCovered,
          snapshotVariableAvgTotal: data.snapshotVariableAvgTotal,
          snapshotVariableAvgMonthly: data.snapshotVariableAvgMonthly,
          acceptedWarnings: (data.acceptedWarnings ??
            (current.acceptedWarnings as string[])) as unknown as Prisma.InputJsonValue,
          auditTrail: updatedTrail as unknown as Prisma.InputJsonValue,
          calculatedBy: data.calculatedBy ?? null,
          calculatedAt: now,
          lines: {
            create: this.buildLinesCreate(data.tenantId, data.lines),
          },
        },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
    });
    return this.map(row);
  }

  async void(data: VoidFinalSettlementData): Promise<FinalSettlementRecord> {
    const existing = await this.findById(data.tenantId, data.id);
    if (!existing) {
      throw new Error(`Liquidación ${data.id} no encontrada`);
    }

    const now = new Date();
    const voidEvent: SettlementAuditEvent = {
      event: 'VOIDED',
      actor: data.voidedBy ?? null,
      timestamp: now.toISOString(),
      detail: data.voidReason,
    };
    const updatedTrail = [...existing.auditTrail, voidEvent];

    const row = await this.prisma.finalSettlement.update({
      where: { id: data.id },
      data: {
        status: FinalSettlementStatus.VOIDED,
        voidedBy: data.voidedBy ?? null,
        voidedAt: now,
        voidReason: data.voidReason,
        auditTrail: updatedTrail as unknown as Prisma.InputJsonValue,
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    return this.map(row);
  }

  async approve(
    data: ApproveFinalSettlementData,
    sideEffect?: ApproveSideEffect,
  ): Promise<FinalSettlementRecord> {
    const now = new Date();

    // Atomicidad (tasks/OS-591.md §15.3/§15.4): re-lee el estado DENTRO de la transacción
    // (misma técnica que `recalculate`) y ejecuta `sideEffect` (terminar el contrato activo
    // + `EmployeeDetails.isActive=false`) en la MISMA transacción que el cambio de estado.
    // Si `sideEffect` lanza, o si el estado ya no es CALCULATED, todo hace rollback — la
    // liquidación NUNCA queda APPROVED sin que el contrato también haya sido terminado.
    const row = await this.prisma.$transaction(async (tx): Promise<FinalSettlementWithLines> => {
      const current = await tx.finalSettlement.findFirst({
        where: { id: data.id, tenantId: data.tenantId },
        select: { status: true, auditTrail: true },
      });

      if (!current) {
        throw new Error(`Liquidación ${data.id} no encontrada`);
      }

      if (current.status !== FinalSettlementStatus.CALCULATED) {
        throw new ConflictException(
          `No se puede aprobar: estado actual ${current.status} (se requiere CALCULATED).`,
        );
      }

      if (sideEffect) {
        await sideEffect(tx);
      }

      const previousTrail = (current.auditTrail as SettlementAuditEvent[]) ?? [];
      const approveEvent: SettlementAuditEvent = {
        event: 'APPROVED',
        actor: data.approvedBy,
        timestamp: now.toISOString(),
      };
      const updatedTrail = [...previousTrail, approveEvent];

      return tx.finalSettlement.update({
        where: { id: data.id },
        data: {
          status: FinalSettlementStatus.APPROVED,
          approvedBy: data.approvedBy,
          approvedAt: now,
          auditTrail: updatedTrail as unknown as Prisma.InputJsonValue,
        },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return this.map(row);
  }

  async markPaid(data: MarkPaidFinalSettlementData): Promise<FinalSettlementRecord> {
    const existing = await this.findById(data.tenantId, data.id);
    if (!existing) {
      throw new Error(`Liquidación ${data.id} no encontrada`);
    }

    const now = new Date();
    const paidEvent: SettlementAuditEvent = {
      event: 'PAID',
      actor: data.paidBy,
      timestamp: now.toISOString(),
      detail: `Referencia: ${data.paymentReference} — fecha de pago: ${data.paymentDate.toISOString().slice(0, 10)}`,
    };
    const updatedTrail = [...existing.auditTrail, paidEvent];

    const result = await this.prisma.finalSettlement.updateMany({
      where: { id: data.id, tenantId: data.tenantId, status: FinalSettlementStatus.APPROVED },
      data: {
        status: FinalSettlementStatus.PAID,
        paidBy: data.paidBy,
        paidAt: now,
        paymentReference: data.paymentReference,
        paymentDate: data.paymentDate,
        auditTrail: updatedTrail as unknown as Prisma.InputJsonValue,
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        `No se pudo marcar como pagada la liquidación ${data.id}: el estado cambió antes de completar la operación (se esperaba APPROVED).`,
      );
    }

    return (await this.findById(data.tenantId, data.id))!;
  }

  async appendAuditEvent(tenantId: string, id: string, event: SettlementAuditEvent): Promise<void> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      throw new Error(`Liquidación ${id} no encontrada`);
    }
    const updatedTrail = [...existing.auditTrail, event];
    await this.prisma.finalSettlement.update({
      where: { id },
      data: { auditTrail: updatedTrail as unknown as Prisma.InputJsonValue },
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private buildLinesCreate(
    tenantId: string,
    lines: SettlementLineInput[],
  ): Prisma.SettlementLineCreateWithoutSettlementInput[] {
    return lines.map(
      (l): Prisma.SettlementLineCreateWithoutSettlementInput => ({
        tenantId,
        code: l.code,
        name: l.name,
        type: l.type,
        origin: l.origin,
        sourceReference: l.sourceReference ?? null,
        baseAmount: l.baseAmount ?? null,
        quantity: l.quantity ?? null,
        rate: l.rate ?? null,
        amount: l.amount,
        metadata: (l.metadata ?? {}) as Prisma.InputJsonValue,
        manualJustification: l.manualJustification ?? null,
        sortOrder: l.sortOrder ?? 0,
      }),
    );
  }

  private map(row: FinalSettlementWithLines): FinalSettlementRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeDetailsId: row.employeeDetailsId,
      contractId: row.contractId,
      effectiveTerminationDate: row.effectiveTerminationDate,
      terminationReason: row.terminationReason,
      status: row.status,
      mode: row.mode,
      snapshotContractType: row.snapshotContractType,
      snapshotContractStartDate: row.snapshotContractStartDate,
      snapshotAgreedEndDate: row.snapshotAgreedEndDate,
      snapshotSalaryType: row.snapshotSalaryType,
      snapshotSalaryAmount: row.snapshotSalaryAmount.toFixed(2),
      snapshotSmlvAmount: row.snapshotSmlvAmount.toFixed(2),
      snapshotTransportSubsidyAmount: row.snapshotTransportSubsidyAmount.toFixed(2),
      snapshotFormulaVersion: row.snapshotFormulaVersion,
      snapshotSmlvThreshold: row.snapshotSmlvThreshold.toFixed(2),
      snapshotVariableAvgMonthsCovered: row.snapshotVariableAvgMonthsCovered,
      snapshotVariableAvgTotal: row.snapshotVariableAvgTotal.toFixed(2),
      snapshotVariableAvgMonthly: row.snapshotVariableAvgMonthly.toFixed(2),
      grossDevengados: row.grossDevengados.toFixed(2),
      totalDeducciones: row.totalDeducciones.toFixed(2),
      netAmount: row.netAmount.toFixed(2),
      snapshotNetNegativeAmount: row.snapshotNetNegativeAmount.toFixed(2),
      manualJustification: row.manualJustification,
      manualReference: row.manualReference,
      manualResponsible: row.manualResponsible,
      acceptedWarnings: (row.acceptedWarnings as string[]) ?? [],
      auditTrail: (row.auditTrail as SettlementAuditEvent[]) ?? [],
      createdBy: row.createdBy,
      calculatedBy: row.calculatedBy,
      calculatedAt: row.calculatedAt,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt,
      paidBy: row.paidBy,
      paidAt: row.paidAt,
      paymentReference: row.paymentReference,
      paymentDate: row.paymentDate,
      voidedBy: row.voidedBy,
      voidedAt: row.voidedAt,
      voidReason: row.voidReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lines: row.lines.map((l): SettlementLineRecord => this.mapLine(l)),
    };
  }

  private mapLine(l: SettlementLine): SettlementLineRecord {
    return {
      id: l.id,
      tenantId: l.tenantId,
      settlementId: l.settlementId,
      code: l.code,
      name: l.name,
      type: l.type,
      origin: l.origin,
      sourceReference: l.sourceReference,
      baseAmount: l.baseAmount?.toFixed(2) ?? null,
      quantity: l.quantity?.toFixed(4) ?? null,
      rate: l.rate?.toFixed(6) ?? null,
      amount: l.amount.toFixed(2),
      metadata: (l.metadata as Record<string, unknown>) ?? {},
      manualJustification: l.manualJustification,
      sortOrder: l.sortOrder,
      createdAt: l.createdAt,
    };
  }
}
