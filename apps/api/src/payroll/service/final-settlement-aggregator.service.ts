import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CesantiasService } from './cesantias.service';
import { IndemnificationCalculationService } from './indemnification-calculation.service';
import { PendingSalaryService } from './pending-salary.service';
import { PayrollConceptsService } from './payroll-concepts.service';
import { PrimaService } from './prima.service';
import { VariableAverageService } from './variable-average.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VacationsService } from '../../vacations/service/vacations.service';
import {
  IndemnificationInputs,
  PreviewSettlementInput,
  SettlementAggregateResult,
  SettlementLineInput,
} from '../interfaces/final-settlement.interfaces';
import type { PayrollConceptCode } from '../payroll-concepts.constants';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import { EmployeeHistoryRepository } from '../repository/employee-history.repository';

/**
 * OS-591 (fase 2) — Agrega todos los conceptos de una liquidación definitiva.
 *
 * Consume los contratos públicos de la Fase 1:
 * - `CesantiasService.getEmployeeBalanceAsOf` (cesantías + intereses pendientes)
 * - `PrimaService.getPrimaBalanceAsOf` (prima pendiente)
 * - `VacationsService.calculateBalanceAsOf` (vacaciones pendientes en días)
 * - `EmployeeHistoryRepository.findSalaryAtDate` (salario vigente)
 * - `EmployeeContractRepository.findActiveContract` (contrato ACTIVO)
 *
 * Reglas:
 * - No duplica lógica de cálculo de cesantías/prima/vacaciones.
 * - netAmount = max(0, grossDevengados - totalDeducciones). Si el resultado sería
 *   negativo, lo congela en 0 y emite warning "net_negative".
 * - `blocks`: condiciones que impiden persistir la liquidación (el preview puede
 *   devolver blocks — la capa de servicio los convertirá en ConflictException).
 */
@Injectable()
export class FinalSettlementAggregatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legalParams: LaborLegalParametersService,
    private readonly employeeHistoryRepository: EmployeeHistoryRepository,
    private readonly employeeContractRepository: EmployeeContractRepository,
    private readonly cesantiasService: CesantiasService,
    private readonly primaService: PrimaService,
    private readonly vacationsService: VacationsService,
    private readonly indemnificationService: IndemnificationCalculationService,
    private readonly pendingSalaryService: PendingSalaryService,
    private readonly variableAverageService: VariableAverageService,
    private readonly payrollConcepts: PayrollConceptsService,
  ) {}

  /**
   * OS-612 — snapshot de línea automática: code + displayName efectivo + conceptId GLOBAL.
   * No altera cálculos ni SettlementLine.type.
   */
  private async resolveAutomaticLineLabel(
    tenantId: string,
    code: PayrollConceptCode,
  ): Promise<{ code: string; name: string; conceptId: string }> {
    const effective = await this.payrollConcepts.resolveEffective(tenantId, code);
    return {
      code: effective.code,
      name: effective.displayName,
      conceptId: effective.id,
    };
  }

  async aggregate(
    input: PreviewSettlementInput & {
      estimatedRemainingDays?: number | null;
      estimatedRemainingDaysJustification?: string | null;
    },
  ): Promise<
    SettlementAggregateResult & {
      snapshots: {
        monthlySalary: Prisma.Decimal;
        salaryType: string;
        smlvAmount: Prisma.Decimal;
        smlvThreshold: Prisma.Decimal;
        transportSubsidyAmount: Prisma.Decimal;
        formulaVersion: number;
        variableAvgMonthsCovered: number;
        variableAvgTotal: Prisma.Decimal;
        variableAvgMonthly: Prisma.Decimal;
        contractType: string;
        contractStartDate: Date;
        agreedEndDate: Date | null;
      };
    }
  > {
    const {
      tenantId,
      employeeDetailsId,
      effectiveTerminationDate,
      terminationReason,
      estimatedRemainingDays,
      estimatedRemainingDaysJustification,
    } = input;

    const warnings: string[] = [];
    const blocks: string[] = [];
    const lines: SettlementLineInput[] = [];

    // ── 1. Resolver contrato ACTIVO ────────────────────────────────────────
    const contract = await this.employeeContractRepository.findActiveContract(
      tenantId,
      employeeDetailsId,
    );
    if (!contract) {
      blocks.push('no_active_contract — el empleado no tiene un contrato ACTIVO');
    }

    // ── 2. Resolver salario vigente ────────────────────────────────────────
    const salaryRecord = await this.prisma.employeeSalaryHistory.findFirst({
      where: {
        tenantId,
        employeeDetailsId,
        effectiveFrom: { lte: effectiveTerminationDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveTerminationDate } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!salaryRecord) {
      blocks.push('no_salary_history — sin historial salarial vigente a la fecha de terminación');
    }

    const monthlySalary = salaryRecord
      ? new Prisma.Decimal(salaryRecord.salaryAmount.toString())
      : new Prisma.Decimal(0);

    const salaryType = salaryRecord?.salaryType ?? 'ORDINARIO';

    // ── 3. Resolver parámetros legales ─────────────────────────────────────
    const [smlvAmount, transportSubsidyAmount, formulaVersionRaw, smlvThreshold] =
      await Promise.all([
        this.legalParams
          .getValueAt('SMLV', effectiveTerminationDate)
          .then((v: number): Prisma.Decimal => new Prisma.Decimal(v))
          .catch((): Prisma.Decimal => new Prisma.Decimal(0)),
        this.legalParams
          .getValueAt('AUXILIO_TRANSPORTE', effectiveTerminationDate)
          .then((v: number): Prisma.Decimal => new Prisma.Decimal(v))
          .catch((): Prisma.Decimal => new Prisma.Decimal(0)),
        this.legalParams
          .getValueAt('INDEMNIZACION_FORMULA_VERSION', effectiveTerminationDate)
          .then((v: number): number => Math.round(v))
          .catch((): number => 1),
        this.legalParams
          .getValueAt('INDEMNIZACION_UMBRAL_SMLV', effectiveTerminationDate)
          .then((v: number): Prisma.Decimal => new Prisma.Decimal(v))
          .catch((): Prisma.Decimal => new Prisma.Decimal(10)),
      ]);

    const formulaVersion = formulaVersionRaw;

    // ── 4. Promedio variable de 6 meses ────────────────────────────────────
    const contractStartDate = contract?.startDate ?? effectiveTerminationDate;
    const variableAvg = await this.variableAverageService.calculate(
      tenantId,
      employeeDetailsId,
      effectiveTerminationDate,
      contractStartDate,
    );

    if (variableAvg.warnings.length) {
      warnings.push(...variableAvg.warnings);
    }

    if (variableAvg.unresolvable) {
      blocks.push(
        'variable_avg_unresolvable — hay horas extra aprobadas pero el promedio variable no pudo resolverse; se requiere revisión manual antes de aprobar',
      );
    }

    const variableAvgMonthly = new Prisma.Decimal(variableAvg.monthlyAverage);

    // ── 5. Salario pendiente ────────────────────────────────────────────────
    const pendingSalary = await this.pendingSalaryService.calculate(
      tenantId,
      employeeDetailsId,
      effectiveTerminationDate,
      contractStartDate,
    );

    if (pendingSalary.warnings.length) {
      warnings.push(...pendingSalary.warnings);
    }

    const pendingSalaryAmount = new Prisma.Decimal(pendingSalary.totalPendingSalary);
    if (pendingSalaryAmount.greaterThan(0)) {
      const label = await this.resolveAutomaticLineLabel(tenantId, 'SAL_PENDIENTE');
      lines.push({
        code: label.code,
        name: label.name,
        conceptId: label.conceptId,
        type: 'DEVENGO',
        origin: 'AUTOMATIC',
        sourceReference: null,
        baseAmount: monthlySalary,
        quantity: new Prisma.Decimal(pendingSalary.commercialDays),
        rate: null,
        amount: pendingSalaryAmount,
        metadata: {
          periodStart: pendingSalary.periodStart.toISOString(),
          periodEnd: pendingSalary.periodEnd.toISOString(),
          calendarDays: pendingSalary.calendarDays,
          commercialDays: pendingSalary.commercialDays,
          breakdown: pendingSalary.breakdown,
          sources: pendingSalary.sources,
        },
        sortOrder: 10,
      });
    }

    // ── 6. Cesantías (años anteriores pendientes + tramo del año en curso) ─
    let cesantiasBalance: Awaited<ReturnType<CesantiasService['getEmployeeBalanceAsOf']>> | null =
      null;
    try {
      cesantiasBalance = await this.cesantiasService.getEmployeeBalanceAsOf(
        tenantId,
        employeeDetailsId,
        effectiveTerminationDate,
      );
    } catch {
      warnings.push('cesantias_balance_error — no se pudo obtener el saldo de cesantías');
    }

    if (cesantiasBalance) {
      const pendingCesantias = new Prisma.Decimal(cesantiasBalance.pendingCesantias);
      const pendingInterest = new Prisma.Decimal(cesantiasBalance.pendingInterest);

      if (pendingCesantias.greaterThan(0)) {
        const label = await this.resolveAutomaticLineLabel(tenantId, 'CESANTIAS');
        lines.push({
          code: label.code,
          name: label.name,
          conceptId: label.conceptId,
          type: 'DEVENGO',
          origin: 'AUTOMATIC',
          sourceReference:
            cesantiasBalance.sourceLiquidations
              .map((s): string => `CesantiasLiquidation:${s.id}`)
              .join(',') || null,
          baseAmount: new Prisma.Decimal(cesantiasBalance.calculationBase),
          quantity: null,
          rate: null,
          amount: pendingCesantias,
          metadata: {
            statesConsidered: cesantiasBalance.statesConsidered,
            sourceLiquidations: cesantiasBalance.sourceLiquidations,
            legalParametersSnapshot: cesantiasBalance.legalParametersSnapshot,
          },
          sortOrder: 20,
        });
      }

      if (pendingInterest.greaterThan(0)) {
        const label = await this.resolveAutomaticLineLabel(tenantId, 'INTERESES_CESANTIAS');
        lines.push({
          code: label.code,
          name: label.name,
          conceptId: label.conceptId,
          type: 'DEVENGO',
          origin: 'AUTOMATIC',
          sourceReference: null,
          baseAmount: pendingCesantias,
          quantity: null,
          rate: new Prisma.Decimal(cesantiasBalance.legalParametersSnapshot.interestRate),
          amount: pendingInterest,
          metadata: {
            rateUsed: cesantiasBalance.legalParametersSnapshot.interestRate,
          },
          sortOrder: 25,
        });
      }
    }

    // ── 7. Prima (saldo pendiente) ─────────────────────────────────────────
    let primaBalance: Awaited<ReturnType<PrimaService['getPrimaBalanceAsOf']>> | null = null;
    try {
      primaBalance = await this.primaService.getPrimaBalanceAsOf(
        tenantId,
        employeeDetailsId,
        effectiveTerminationDate,
      );
    } catch {
      warnings.push('prima_balance_error — no se pudo obtener el saldo de prima');
    }

    if (primaBalance) {
      const pendingPrima = new Prisma.Decimal(primaBalance.pendingAmount);
      if (pendingPrima.greaterThan(0)) {
        const label = await this.resolveAutomaticLineLabel(tenantId, 'PRIMA');
        lines.push({
          code: label.code,
          name: label.name,
          conceptId: label.conceptId,
          type: 'DEVENGO',
          origin: 'AUTOMATIC',
          sourceReference:
            primaBalance.sourceLiquidations
              .map((s): string => `PrimaLiquidation:${s.id}`)
              .join(',') || null,
          baseAmount: new Prisma.Decimal(primaBalance.baseAmount),
          quantity: null,
          rate: null,
          amount: pendingPrima,
          metadata: {
            sourceLiquidations: primaBalance.sourceLiquidations,
            segments: primaBalance.segments,
          },
          sortOrder: 30,
        });
      }
    }

    // ── 8. Vacaciones (días pendientes → valor monetario) ──────────────────
    let vacationsBalance: {
      pendingDays: Prisma.Decimal;
    } | null = null;
    try {
      vacationsBalance = await this.vacationsService.calculateBalanceAsOf(
        tenantId,
        employeeDetailsId,
        effectiveTerminationDate,
      );
    } catch {
      warnings.push('vacations_balance_error — no se pudo obtener el saldo de vacaciones');
    }

    if (vacationsBalance) {
      const pendingVacDays = vacationsBalance.pendingDays;
      if (pendingVacDays.greaterThan(0)) {
        // Valor monetario: pendingDays × (monthlySalary / 30)
        const dailySalary = monthlySalary.dividedBy(30);
        const vacAmount = pendingVacDays
          .times(dailySalary)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        const label = await this.resolveAutomaticLineLabel(tenantId, 'VACACIONES');
        lines.push({
          code: label.code,
          name: label.name,
          conceptId: label.conceptId,
          type: 'DEVENGO',
          origin: 'AUTOMATIC',
          sourceReference: null,
          baseAmount: monthlySalary,
          quantity: pendingVacDays,
          rate: null,
          amount: vacAmount,
          metadata: { pendingDays: pendingVacDays.toFixed(4) },
          sortOrder: 40,
        });
      }
    }

    // ── 9. Indemnización ───────────────────────────────────────────────────
    if (contract) {
      const indemnInputs: IndemnificationInputs = {
        contractType: contract.contractType,
        terminationReason,
        contractStartDate: contract.startDate,
        effectiveTerminationDate,
        monthlySalary,
        smlvAmount,
        smlvThreshold,
        agreedEndDate: contract.agreedEndDate,
        estimatedRemainingDays: estimatedRemainingDays ?? null,
        estimatedRemainingDaysJustification: estimatedRemainingDaysJustification ?? null,
        formulaVersion,
      };

      const indemnResult = this.indemnificationService.calculate(indemnInputs);
      if (indemnResult.warnings.length) {
        warnings.push(...indemnResult.warnings);
      }

      const indemnAmount = new Prisma.Decimal(indemnResult.amount);
      if (indemnAmount.greaterThan(0)) {
        const label = await this.resolveAutomaticLineLabel(tenantId, 'INDEMNIZACION');
        lines.push({
          code: label.code,
          name: label.name,
          conceptId: label.conceptId,
          type: 'DEVENGO',
          origin: 'AUTOMATIC',
          sourceReference: null,
          baseAmount: monthlySalary,
          quantity: new Prisma.Decimal(indemnResult.indemnifiedDays),
          rate: null,
          amount: indemnAmount,
          metadata: {
            appliedRule: indemnResult.appliedRule,
            formulaVersion: indemnResult.formulaVersion,
            inputs: indemnResult.inputs,
          },
          sortOrder: 50,
        });
      }
    }

    // ── 10. Calcular totales ──────────────────────────────────────────────
    const devengos = lines.filter((l): boolean => l.type === 'DEVENGO');
    const deducciones = lines.filter((l): boolean => l.type === 'DEDUCCION');

    const grossDevengados = devengos
      .reduce((acc, l): Prisma.Decimal => acc.plus(l.amount), new Prisma.Decimal(0))
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const totalDeducciones = deducciones
      .reduce((acc, l): Prisma.Decimal => acc.plus(l.amount), new Prisma.Decimal(0))
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const rawNet = grossDevengados
      .minus(totalDeducciones)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    let netAmount: Prisma.Decimal;
    let netNegativeAmount: Prisma.Decimal;

    if (rawNet.lessThan(0)) {
      // Neto negativo: no se oculta con un floor silencioso — se convierte en BLOQUEO.
      // El actor humano debe resolver el saldo a cargo antes de aprobar (Fase 3).
      netNegativeAmount = rawNet.negated().toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      netAmount = new Prisma.Decimal(0);
      blocks.push(
        `net_negative — saldo a cargo del empleado: ${netNegativeAmount.toFixed(2)} COP. Las deducciones (${totalDeducciones.toFixed(2)}) superan los devengos (${grossDevengados.toFixed(2)}). Se requiere resolución explícita antes de aprobar.`,
      );
    } else {
      netAmount = rawNet;
      netNegativeAmount = new Prisma.Decimal(0);
    }

    return {
      lines,
      grossDevengados: grossDevengados.toFixed(2),
      totalDeducciones: totalDeducciones.toFixed(2),
      netAmount: netAmount.toFixed(2),
      netNegativeAmount: netNegativeAmount.toFixed(2),
      warnings,
      blocks,
      snapshots: {
        monthlySalary,
        salaryType,
        smlvAmount,
        smlvThreshold,
        transportSubsidyAmount,
        formulaVersion,
        variableAvgMonthsCovered: variableAvg.monthsCovered,
        variableAvgTotal: new Prisma.Decimal(variableAvg.totalVariable),
        variableAvgMonthly,
        contractType: contract?.contractType ?? 'INDEFINIDO',
        contractStartDate,
        agreedEndDate: contract?.agreedEndDate ?? null,
      },
    };
  }
}
