import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import {
  CreatePendingSalaryReconciliationData,
  IPendingSalaryReconciliationService,
  PendingSalaryReconciliationRecord,
} from '../interfaces/pending-salary-reconciliation.interfaces';
import { FinalSettlementRepository } from '../repository/final-settlement.repository';
import { PendingSalaryReconciliationRepository } from '../repository/pending-salary-reconciliation.repository';

/**
 * OS-591 (fase 3) — Reconciliación auditable de salario pendiente. Ver tasks/OS-591.md §15.2.
 * Nunca borra ni edita la advertencia `pending_salary_double_payment_risk` que emite
 * `PendingSalaryService` — este registro es evidencia adicional de revisión humana.
 */
@Injectable()
export class PendingSalaryReconciliationService implements IPendingSalaryReconciliationService {
  constructor(
    private readonly repository: PendingSalaryReconciliationRepository,
    private readonly finalSettlementRepository: FinalSettlementRepository,
    private readonly auditService: AuditService,
  ) {}

  async findBySettlement(
    tenantId: string,
    settlementId: string,
  ): Promise<PendingSalaryReconciliationRecord | null> {
    return this.repository.findBySettlement(tenantId, settlementId);
  }

  async reconcile(
    data: CreatePendingSalaryReconciliationData,
  ): Promise<PendingSalaryReconciliationRecord> {
    const settlement = await this.finalSettlementRepository.findById(
      data.tenantId,
      data.settlementId,
    );
    if (!settlement) {
      throw new NotFoundException(`Liquidación ${data.settlementId} no encontrada`);
    }

    if (settlement.status !== 'CALCULATED') {
      throw new ConflictException(
        `No se puede reconciliar: la liquidación tiene estado ${settlement.status} (se requiere CALCULATED, antes de aprobar).`,
      );
    }

    const pendingSalaryLine = settlement.lines.find((l): boolean => l.code === 'SAL_PENDIENTE');
    if (!pendingSalaryLine) {
      throw new BadRequestException(
        'La liquidación no tiene un tramo de salario pendiente (línea SAL_PENDIENTE) — no aplica reconciliación.',
      );
    }

    const existing = await this.repository.findBySettlement(data.tenantId, data.settlementId);
    if (existing) {
      throw new ConflictException(
        `Ya existe una reconciliación registrada (id=${existing.id}) para la liquidación ${data.settlementId}.`,
      );
    }

    if (!data.responsible?.trim()) {
      throw new BadRequestException('responsible es obligatorio');
    }
    if (!data.observation?.trim()) {
      throw new BadRequestException('observation es obligatorio');
    }

    // Consistencia numérica (tasks/OS-591.md §15.2, cierre): ni negativos ni valores que
    // excedan el salario causado (`SAL_PENDIENTE.amount`, el único monto de referencia
    // disponible — no existe una tabla de pagos previos reales, ver PendingSalaryService).
    const causado = new Prisma.Decimal(pendingSalaryLine.amount);
    const previouslyPaid = new Prisma.Decimal(data.previouslyPaidAmount);
    const recognizedBalance = new Prisma.Decimal(data.recognizedBalance);

    if (previouslyPaid.lessThan(0)) {
      throw new BadRequestException('previouslyPaidAmount no puede ser negativo');
    }
    if (recognizedBalance.lessThan(0)) {
      throw new BadRequestException('recognizedBalance no puede ser negativo');
    }
    if (previouslyPaid.greaterThan(causado)) {
      throw new BadRequestException(
        `previouslyPaidAmount (${previouslyPaid.toFixed(2)}) no puede ser mayor que el salario causado (${causado.toFixed(2)})`,
      );
    }
    if (recognizedBalance.greaterThan(causado)) {
      throw new BadRequestException(
        `recognizedBalance (${recognizedBalance.toFixed(2)}) no puede ser mayor que el salario causado (${causado.toFixed(2)})`,
      );
    }
    // Saldo reconocido inconsistente: si se reconoce un saldo pendiente, la suma con lo ya
    // pagado no puede superar el causado (evita "reconocer" más de lo que existía).
    if (previouslyPaid.plus(recognizedBalance).greaterThan(causado)) {
      throw new BadRequestException(
        `previouslyPaidAmount (${previouslyPaid.toFixed(2)}) + recognizedBalance (${recognizedBalance.toFixed(2)}) no puede superar el salario causado (${causado.toFixed(2)})`,
      );
    }

    const record = await this.repository.create(data);

    await this.finalSettlementRepository.appendAuditEvent(data.tenantId, data.settlementId, {
      event: 'PENDING_SALARY_RECONCILED',
      actor: data.createdBy ?? null,
      timestamp: new Date().toISOString(),
      detail: `Reconciliado por ${data.responsible}: ${data.observation}`,
    });

    await this.auditService.log({
      tenantId: data.tenantId,
      action: AuditAction.CREATE,
      entityType: 'PendingSalaryReconciliation',
      entityId: record.id,
      actorUserId: data.createdBy ?? null,
      payload: {
        event: 'pending_salary_reconciled',
        settlementId: data.settlementId,
        recognizedBalance: record.recognizedBalance,
      },
    });

    return record;
  }
}
