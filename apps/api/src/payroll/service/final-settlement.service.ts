import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, FinalSettlementStatus, Prisma } from '@prisma/client';

import { FinalSettlementAggregatorService } from './final-settlement-aggregator.service';
import { PayrollConceptsService } from './payroll-concepts.service';
import { AuditService } from '../../audit/service/audit.service';
import {
  CalculateAndSaveInput,
  FinalSettlementRecord,
  IFinalSettlementService,
  ManualSettlementInput,
  MarkPaidInput,
  PreviewSettlementInput,
  SettlementAggregateResult,
  SettlementLineInput,
} from '../interfaces/final-settlement.interfaces';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { FinalSettlementRepository } from '../repository/final-settlement.repository';
import { LegalFormulaValidationRepository } from '../repository/legal-formula-validation.repository';
import { PendingSalaryReconciliationRepository } from '../repository/pending-salary-reconciliation.repository';

/**
 * OS-591 (fase 2+3) — Servicio principal de liquidación definitiva.
 *
 * Orquesta el ciclo de vida completo (ver tasks/OS-591.md §15.3):
 * CALCULATED → APPROVED → PAID
 *      │            │
 *      └───void()───┘
 *
 * Reglas de transición de estado:
 * - CALCULATED: cualquier liquidación persistida arranca aquí.
 * - APPROVED: `approve()` valida bloqueos de aprobación (liquidación sin líneas,
 *   indemnización automática sin validación legal activa, salario pendiente sin
 *   reconciliación, soporte manual insuficiente — MANUAL nunca evade estos gates) y
 *   TERMINA el contrato activo del empleado (ese es el momento exacto de
 *   terminación contractual, §15.4). La terminación del contrato, la actualización de
 *   `EmployeeDetails.isActive` y la transición de estado ocurren en UNA SOLA
 *   transacción de base de datos (`FinalSettlementRepository.approve` + `sideEffect`)
 *   — si cualquiera falla, todo hace rollback; la liquidación nunca queda APPROVED
 *   sin que el contrato también se haya terminado.
 * - PAID: transición final desde APPROVED. Inmutable — no se puede recalcular,
 *   re-aprobar ni anular (requeriría un flujo de reversión formal, fuera de
 *   alcance de este ticket).
 * - VOIDED: permitido desde DRAFT/CALCULATED únicamente. Ya NO desde APPROVED
 *   (antes solo bloqueaba PAID) — aprobar ya disparó la terminación real del
 *   contrato; anular después dejaría un contrato TERMINADO sin liquidación que
 *   lo respalde. Tampoco desde PAID.
 * - Recalcular una liquidación CALCULATED es explícito y auditable (nuevo evento
 *   RECALCULATED en auditTrail). No está permitido sobre APPROVED/PAID.
 *
 * Auditoría: el repositorio escribe el auditTrail propio de cada liquidación;
 * además este servicio emite eventos nombrados vía `AuditService.log()` (registro
 * general, ver tasks/OS-591.md §15.7) para acciones que trascienden una sola
 * liquidación (terminación de contrato, aprobación/pago/anulación).
 *
 * `deactivateEmployee`/`PayrollService.update` NO llaman a este servicio
 * directamente — pasan por `EmployeeDeactivationGuardService`, que consulta el
 * estado de la liquidación activa del contrato (§15.5).
 */
@Injectable()
export class FinalSettlementService implements IFinalSettlementService {
  constructor(
    private readonly repository: FinalSettlementRepository,
    private readonly aggregator: FinalSettlementAggregatorService,
    private readonly contractRepository: EmployeeContractRepository,
    private readonly legalFormulaValidationRepository: LegalFormulaValidationRepository,
    private readonly pendingSalaryReconciliationRepository: PendingSalaryReconciliationRepository,
    private readonly auditService: AuditService,
    private readonly payrollConcepts: PayrollConceptsService,
  ) {}

  /**
   * Preview sin persistencia. Puede devolver `blocks` — el caller decide si
   * mostrarlos o bloquear la persistencia.
   */
  async preview(input: PreviewSettlementInput): Promise<SettlementAggregateResult> {
    const result = await this.aggregator.aggregate({
      ...input,
      estimatedRemainingDays: undefined,
      estimatedRemainingDaysJustification: undefined,
    });
    const { snapshots: _, ...aggregate } = result;
    return aggregate;
  }

  /**
   * Calcula y persiste la liquidación en un único paso.
   *
   * Si el aggregator retorna `blocks`, lanza `ConflictException` con el detalle.
   * Si hay warnings no aceptados relevantes (variable avg unresolvable), también bloquea.
   */
  async calculateAndSave(input: CalculateAndSaveInput): Promise<FinalSettlementRecord> {
    const { tenantId, employeeDetailsId, mode, acceptedWarnings, createdBy } = input;

    const aggregate = await this.aggregator.aggregate({
      tenantId,
      employeeDetailsId,
      effectiveTerminationDate: input.effectiveTerminationDate,
      terminationReason: input.terminationReason,
      estimatedRemainingDays: input.estimatedRemainingDays,
      estimatedRemainingDaysJustification: input.estimatedRemainingDaysJustification,
    });

    if (aggregate.blocks.length > 0) {
      throw new ConflictException(
        `La liquidación tiene bloqueos que impiden persistirla: ${aggregate.blocks.join('; ')}`,
      );
    }

    // Validar modo MANUAL: requiere justificación, referencia y responsable
    if (mode === 'MANUAL') {
      if (!input.manualJustification?.trim()) {
        throw new BadRequestException(
          'El modo MANUAL requiere un campo manualJustification no vacío',
        );
      }
      if (!input.manualReference?.trim()) {
        throw new BadRequestException('El modo MANUAL requiere un campo manualReference no vacío');
      }
      if (!input.manualResponsible?.trim()) {
        throw new BadRequestException(
          'El modo MANUAL requiere un campo manualResponsible no vacío',
        );
      }
    }

    // Obtener contrato activo para contractId
    const contract = await this.contractRepository.findActiveContract(tenantId, employeeDetailsId);
    if (!contract) {
      throw new NotFoundException(`El empleado ${employeeDetailsId} no tiene un contrato ACTIVO`);
    }

    const { snapshots } = aggregate;

    return this.repository.create({
      tenantId,
      employeeDetailsId,
      contractId: contract.id,
      effectiveTerminationDate: input.effectiveTerminationDate,
      terminationReason: input.terminationReason,
      mode: mode ?? 'AUTOMATIC',
      snapshotContractType: contract.contractType,
      snapshotContractStartDate: contract.startDate,
      snapshotAgreedEndDate: contract.agreedEndDate,
      snapshotSalaryType: snapshots.salaryType as import('@prisma/client').SalaryType,
      snapshotSalaryAmount: snapshots.monthlySalary,
      snapshotSmlvAmount: snapshots.smlvAmount,
      snapshotTransportSubsidyAmount: snapshots.transportSubsidyAmount,
      snapshotFormulaVersion: snapshots.formulaVersion,
      snapshotSmlvThreshold: snapshots.smlvThreshold,
      snapshotVariableAvgMonthsCovered: snapshots.variableAvgMonthsCovered,
      snapshotVariableAvgTotal: snapshots.variableAvgTotal,
      snapshotVariableAvgMonthly: snapshots.variableAvgMonthly,
      grossDevengados: new Prisma.Decimal(aggregate.grossDevengados),
      totalDeducciones: new Prisma.Decimal(aggregate.totalDeducciones),
      netAmount: new Prisma.Decimal(aggregate.netAmount),
      snapshotNetNegativeAmount: new Prisma.Decimal(aggregate.netNegativeAmount),
      lines: aggregate.lines,
      acceptedWarnings: acceptedWarnings ?? [],
      manualJustification: input.manualJustification ?? null,
      manualReference: input.manualReference ?? null,
      manualResponsible: input.manualResponsible ?? null,
      createdBy: createdBy ?? null,
    });
  }

  /**
   * Recalcula una liquidación CALCULATED. No permitido sobre APPROVED/PAID.
   * Genera un evento RECALCULATED en auditTrail.
   */
  async recalculate(
    tenantId: string,
    id: string,
    calculatedBy?: string,
  ): Promise<FinalSettlementRecord> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Liquidación ${id} no encontrada`);
    }

    if (
      existing.status === FinalSettlementStatus.APPROVED ||
      existing.status === FinalSettlementStatus.PAID
    ) {
      throw new ConflictException(
        `No se puede recalcular una liquidación con status=${existing.status}. Para modificarla debe anularse y crearse una nueva.`,
      );
    }

    if (existing.status === FinalSettlementStatus.VOIDED) {
      throw new ConflictException(`La liquidación ${id} está anulada y no puede recalcularse`);
    }

    // Recalcular usando los mismos parámetros de entrada originales
    const aggregate = await this.aggregator.aggregate({
      tenantId,
      employeeDetailsId: existing.employeeDetailsId,
      effectiveTerminationDate: existing.effectiveTerminationDate,
      terminationReason: existing.terminationReason,
    });

    if (aggregate.blocks.length > 0) {
      throw new ConflictException(`El recálculo tiene bloqueos: ${aggregate.blocks.join('; ')}`);
    }

    const { snapshots } = aggregate;

    return this.repository.recalculate({
      tenantId,
      id,
      grossDevengados: new Prisma.Decimal(aggregate.grossDevengados),
      totalDeducciones: new Prisma.Decimal(aggregate.totalDeducciones),
      netAmount: new Prisma.Decimal(aggregate.netAmount),
      snapshotNetNegativeAmount: new Prisma.Decimal(aggregate.netNegativeAmount),
      snapshotVariableAvgMonthsCovered: snapshots.variableAvgMonthsCovered,
      snapshotVariableAvgTotal: snapshots.variableAvgTotal,
      snapshotVariableAvgMonthly: snapshots.variableAvgMonthly,
      lines: aggregate.lines,
      acceptedWarnings: existing.acceptedWarnings,
      calculatedBy: calculatedBy ?? null,
    });
  }

  /**
   * Anula una liquidación. Permitido desde DRAFT/CALCULATED únicamente.
   * NO desde APPROVED (ya se disparó la terminación real del contrato — anular
   * requeriría un flujo de reversión formal, fuera de alcance) ni desde PAID.
   */
  async void(
    tenantId: string,
    id: string,
    voidReason: string,
    actor?: string,
  ): Promise<FinalSettlementRecord> {
    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Liquidación ${id} no encontrada`);
    }

    if (existing.status === FinalSettlementStatus.VOIDED) {
      throw new ConflictException(`La liquidación ${id} ya está anulada`);
    }

    if (existing.status === FinalSettlementStatus.PAID) {
      throw new ConflictException(
        'No se puede anular una liquidación PAID. Requiere un flujo formal de reversión de pago, fuera de alcance de este ticket.',
      );
    }

    if (existing.status === FinalSettlementStatus.APPROVED) {
      throw new ConflictException(
        `No se puede anular la liquidación ${id}: ya está APPROVED y disparó la terminación del contrato ${existing.contractId}. Requiere un flujo formal de reversión, fuera de alcance de este ticket.`,
      );
    }

    if (!voidReason?.trim()) {
      throw new BadRequestException('El motivo de anulación (voidReason) es obligatorio');
    }

    const voided = await this.repository.void({
      tenantId,
      id,
      voidReason,
      voidedBy: actor ?? null,
    });

    await this.auditService.log({
      tenantId,
      action: AuditAction.REJECT,
      entityType: 'FinalSettlement',
      entityId: id,
      actorUserId: actor ?? null,
      payload: { event: 'final_settlement_voided', voidReason },
    });

    return voided;
  }

  /**
   * CALCULATED → APPROVED. Ver reglas de bloqueo en el docstring de la clase y en
   * tasks/OS-591.md §15.3. Si pasa todos los gates, termina el contrato ACTIVO del
   * empleado ANTES de transicionar el estado — si la terminación falla (p.ej. el
   * contrato ya no está ACTIVO por una carrera), la liquidación permanece
   * CALCULATED y la operación puede reintentarse con seguridad.
   */
  async approve(tenantId: string, id: string, approvedBy: string): Promise<FinalSettlementRecord> {
    if (!approvedBy?.trim()) {
      throw new BadRequestException('approvedBy es obligatorio');
    }

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Liquidación ${id} no encontrada`);
    }

    if (existing.status !== FinalSettlementStatus.CALCULATED) {
      throw new ConflictException(
        `No se puede aprobar: estado actual ${existing.status} (se requiere CALCULATED).`,
      );
    }

    const blocks: string[] = [];

    if (existing.lines.length === 0) {
      blocks.push('empty_settlement — la liquidación no tiene líneas, no puede aprobarse');
    }

    const indemnLine = existing.lines.find((l): boolean => l.code === 'INDEMNIZACION');
    if (indemnLine && existing.mode === 'AUTOMATIC') {
      const validation = await this.legalFormulaValidationRepository.findActive(
        tenantId,
        existing.snapshotFormulaVersion,
      );
      if (!validation) {
        blocks.push(
          `legal_formula_not_validated — la versión de fórmula ${existing.snapshotFormulaVersion} usada en la indemnización no tiene una validación legal activa`,
        );
      }
    }

    const pendingSalaryLine = existing.lines.find((l): boolean => l.code === 'SAL_PENDIENTE');
    if (pendingSalaryLine) {
      const reconciliation = await this.pendingSalaryReconciliationRepository.findBySettlement(
        tenantId,
        id,
      );
      if (!reconciliation) {
        blocks.push(
          'pending_salary_not_reconciled — existe un tramo de salario pendiente sin reconciliación auditable registrada',
        );
      }
    }

    if (existing.mode === 'MANUAL') {
      if (
        !existing.manualJustification?.trim() ||
        !existing.manualReference?.trim() ||
        !existing.manualResponsible?.trim()
      ) {
        blocks.push(
          'manual_settlement_insufficient_support — falta justificación/referencia/responsable',
        );
      }
    }

    if (blocks.length > 0) {
      throw new ConflictException(`No se puede aprobar la liquidación: ${blocks.join(' | ')}`);
    }

    // Atomicidad (tasks/OS-591.md §15.3/§15.4): terminar el contrato activo,
    // actualizar `EmployeeDetails.isActive` y transicionar el estado de la liquidación
    // ocurren en UNA SOLA transacción de base de datos (ver
    // `FinalSettlementRepository.approve`) — si terminar el contrato falla (p.ej. ya no
    // está ACTIVO por una carrera), TODA la transacción hace rollback y la liquidación
    // permanece CALCULATED; nunca queda aprobada sin que el contrato también se termine.
    const approved = await this.repository.approve(
      { tenantId, id, approvedBy },
      (tx): Promise<void> =>
        this.contractRepository
          .terminateActiveContractTx(tx, {
            tenantId,
            employeeDetailsId: existing.employeeDetailsId,
            terminationDate: existing.effectiveTerminationDate,
            terminationReason: existing.terminationReason,
            terminationNotes: `Terminación por liquidación definitiva ${id}, aprobada por ${approvedBy}`,
            changedBy: approvedBy,
          })
          .then((): void => undefined),
    );

    // Auditoría general (AuditLog) — best-effort, fuera de la transacción atómica: son
    // registros informativos adicionales, no el estado autoritativo del workflow (que ya
    // quedó garantizado atómicamente arriba).
    await this.auditService.log({
      tenantId,
      action: AuditAction.UPDATE,
      entityType: 'EmploymentContract',
      entityId: existing.contractId,
      actorUserId: approvedBy,
      payload: {
        event: 'employment_contract_terminated',
        settlementId: id,
        terminationDate: existing.effectiveTerminationDate.toISOString(),
        terminationReason: existing.terminationReason,
      },
    });

    await this.auditService.log({
      tenantId,
      action: AuditAction.APPROVE,
      entityType: 'FinalSettlement',
      entityId: id,
      actorUserId: approvedBy,
      payload: {
        event:
          existing.mode === 'MANUAL'
            ? 'final_settlement_manual_approved'
            : 'final_settlement_approved',
        netAmount: existing.netAmount,
      },
    });

    return approved;
  }

  /**
   * APPROVED → PAID. Transición final, sin efectos colaterales adicionales sobre el
   * contrato (ya se terminó en `approve()`, §15.4).
   *
   * Reintentar `markPaid` sobre una liquidación ya PAID es un CONFLICTO explícito (409),
   * no una respuesta idempotente — no existe una clave de idempotencia que permita
   * distinguir "el mismo request reintentado tras un timeout" de "un segundo pago real
   * por error"; exigir que el caller relea el estado (GET) antes de reintentar es más
   * seguro que asumir que un segundo request es inofensivo. Ver
   * `final-settlement.service.spec.ts` (describe `markPaid`) para el comportamiento
   * exacto ante doble invocación y carreras concurrentes.
   */
  async markPaid(
    tenantId: string,
    id: string,
    data: MarkPaidInput,
  ): Promise<FinalSettlementRecord> {
    const { paidBy, paymentReference, paymentDate } = data;

    if (!paidBy?.trim()) {
      throw new BadRequestException('paidBy es obligatorio');
    }
    if (!paymentReference?.trim()) {
      throw new BadRequestException('paymentReference es obligatorio');
    }
    if (!paymentDate || Number.isNaN(paymentDate.getTime())) {
      throw new BadRequestException('paymentDate es obligatorio y debe ser una fecha válida');
    }
    if (paymentDate.getTime() > Date.now()) {
      throw new BadRequestException('paymentDate no puede estar en el futuro');
    }

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Liquidación ${id} no encontrada`);
    }

    if (existing.status !== FinalSettlementStatus.APPROVED) {
      throw new ConflictException(
        `No se puede marcar como pagada: estado actual ${existing.status} (se requiere APPROVED).`,
      );
    }

    if (existing.approvedAt && paymentDate.getTime() < existing.approvedAt.getTime()) {
      throw new BadRequestException(
        'paymentDate no puede ser anterior a la fecha de aprobación de la liquidación',
      );
    }

    const paid = await this.repository.markPaid({
      tenantId,
      id,
      paidBy,
      paymentReference,
      paymentDate,
    });

    await this.auditService.log({
      tenantId,
      action: AuditAction.UPDATE,
      entityType: 'FinalSettlement',
      entityId: id,
      actorUserId: paidBy,
      payload: {
        event: 'final_settlement_paid',
        netAmount: existing.netAmount,
        paymentReference,
        paymentDate: paymentDate.toISOString(),
      },
    });

    return paid;
  }

  /**
   * Crea una liquidación MANUAL directamente con los valores proporcionados.
   * Requiere justificación, referencia y responsable.
   * Todas las líneas deben ser de origen MANUAL con justificación.
   */
  async createManual(input: ManualSettlementInput): Promise<FinalSettlementRecord> {
    const {
      tenantId,
      employeeDetailsId,
      effectiveTerminationDate,
      terminationReason,
      lines: inputLines,
      manualJustification,
      manualReference,
      manualResponsible,
      createdBy,
    } = input;

    if (!manualJustification?.trim()) {
      throw new BadRequestException('manualJustification es obligatorio en liquidación manual');
    }
    if (!manualReference?.trim()) {
      throw new BadRequestException('manualReference es obligatorio en liquidación manual');
    }
    if (!manualResponsible?.trim()) {
      throw new BadRequestException('manualResponsible es obligatorio en liquidación manual');
    }

    if (inputLines.length === 0) {
      throw new BadRequestException(
        'Una liquidación manual debe contener al menos una línea desglosada.',
      );
    }

    // Validar que cada línea manual tiene justificación
    for (const l of inputLines) {
      if (!l.manualJustification?.trim()) {
        throw new BadRequestException(
          `La línea ${l.code} (${l.name}) no tiene manualJustification. Todas las líneas de una liquidación manual son obligatoriamente auditables.`,
        );
      }
      if (!l.name?.trim()) {
        throw new BadRequestException(
          'Cada línea manual requiere name (descripción snapshot del ajuste).',
        );
      }
      // OS-612 — no códigos dinámicos desde texto; solo AJUSTE_MANUAL (o vacío → se fuerza).
      if (l.code?.trim() && l.code.trim() !== 'AJUSTE_MANUAL') {
        throw new BadRequestException(
          `Las líneas manuales deben usar code AJUSTE_MANUAL; recibido "${l.code}". ` +
            'La descripción del usuario va en name; type discrimina DEVENGO/DEDUCCION.',
        );
      }
    }

    // Catálogo: code + conceptId GLOBAL; name = descripción del usuario (snapshot).
    const ajuste = await this.payrollConcepts.resolveEffective(tenantId, 'AJUSTE_MANUAL');

    const settlementLines: SettlementLineInput[] = inputLines.map(
      (l, idx): SettlementLineInput => ({
        code: ajuste.code,
        name: l.name.trim(),
        conceptId: ajuste.id,
        type: l.type,
        origin: 'MANUAL' as const,
        sourceReference: null,
        baseAmount: null,
        quantity: null,
        rate: null,
        amount: l.amount,
        metadata: l.metadata ?? {},
        manualJustification: l.manualJustification,
        sortOrder: l.sortOrder ?? idx * 10,
      }),
    );

    const grossDevengados = settlementLines
      .filter((l): boolean => l.type === 'DEVENGO')
      .reduce((acc, l): Prisma.Decimal => acc.plus(l.amount), new Prisma.Decimal(0));

    const totalDeducciones = settlementLines
      .filter((l): boolean => l.type === 'DEDUCCION')
      .reduce((acc, l): Prisma.Decimal => acc.plus(l.amount), new Prisma.Decimal(0));

    const rawNetManual = grossDevengados.minus(totalDeducciones);
    const netNegativeAmountManual = rawNetManual.lessThan(0)
      ? rawNetManual.negated().toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : new Prisma.Decimal(0);
    const netAmount = rawNetManual.lessThan(0) ? new Prisma.Decimal(0) : rawNetManual;

    // Resolver contrato activo server-side (ver nota en ManualSettlementInput) y snapshots mínimos
    const contract = await this.contractRepository.findActiveContract(tenantId, employeeDetailsId);
    if (!contract) {
      throw new NotFoundException(`El empleado ${employeeDetailsId} no tiene un contrato ACTIVO`);
    }

    return this.repository.create({
      tenantId,
      employeeDetailsId,
      contractId: contract.id,
      effectiveTerminationDate,
      terminationReason,
      mode: 'MANUAL',
      snapshotContractType: contract.contractType,
      snapshotContractStartDate: contract.startDate,
      snapshotAgreedEndDate: contract.agreedEndDate,
      snapshotSalaryType: 'ORDINARIO' as import('@prisma/client').SalaryType,
      snapshotSalaryAmount: new Prisma.Decimal(0),
      snapshotSmlvAmount: new Prisma.Decimal(0),
      snapshotTransportSubsidyAmount: new Prisma.Decimal(0),
      snapshotFormulaVersion: 0,
      snapshotSmlvThreshold: new Prisma.Decimal(0),
      snapshotVariableAvgMonthsCovered: 0,
      snapshotVariableAvgTotal: new Prisma.Decimal(0),
      snapshotVariableAvgMonthly: new Prisma.Decimal(0),
      grossDevengados,
      totalDeducciones,
      netAmount,
      snapshotNetNegativeAmount: netNegativeAmountManual,
      lines: settlementLines,
      acceptedWarnings: [],
      manualJustification,
      manualReference,
      manualResponsible,
      createdBy: createdBy ?? null,
    });
  }

  async findById(tenantId: string, id: string): Promise<FinalSettlementRecord> {
    const record = await this.repository.findById(tenantId, id);
    if (!record) {
      throw new NotFoundException(`Liquidación ${id} no encontrada`);
    }
    return record;
  }

  async findAllByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<FinalSettlementRecord[]> {
    return this.repository.findAllByEmployee(tenantId, employeeDetailsId);
  }
}
