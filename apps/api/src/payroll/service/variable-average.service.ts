import { Injectable } from '@nestjs/common';
import { OvertimeStatus, Prisma } from '@prisma/client';

import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VariableAverageResult } from '../interfaces/final-settlement.interfaces';
import {
  computeApprovedOvertimeMoney,
  type ApprovedOvertimeRequestSlice,
} from '../utils/approved-overtime-money.util';

/**
 * OS-591 (fase 2, cierre de hallazgos) — Promedio de ingresos variables de los últimos 6 meses.
 *
 * Fuente primaria de "variable": horas extra y recargos aprobados
 * (`OvertimeRequest.status = 'APROBADA'`) causados en los 6 meses
 * calendario anteriores a `effectiveTerminationDate`.
 *
 * ## Clasificación de horas extra — reutiliza NOM-07 (OS-606 Task-08/09)
 *
 * `OvertimeRequest.type` (`DETECCION_AUTOMATICA` | `SOLICITUD_ADMINISTRATIVA`) es solo el
 * **origen** de la solicitud, NO una clasificación legal de recargo. La tarifa proviene
 * de `classifyOvertimeSurcharge` sobre intervalos liquidables (marcación OVERTIME real ∩
 * ventanas aprobadas) o, en legacy CONN-04a, sobre `accumulatedMinutes` con horario de
 * detección — nunca de `type`, `proposedMinutes` ni motivo de catálogo.
 *
 * ## Decisiones y limitaciones documentadas
 *
 * 1. **Fuente**: no hay tabla de "pagos de HE liquidadas"; se valoriza con salario
 *    histórico + tasas legales vigentes por fecha del intervalo/solicitud.
 *
 * 2. **Menos de 6 meses**: `monthsCovered` refleja el período real desde contrato.
 *
 * 3. **Meses sin pagos variables**: se incluyen en el divisor.
 *
 * 4. **Solo APROBADA**: pendiente/objetada no aportan.
 *
 * 5. **Admin sin marcación**: 0 (intersección vacía).
 *
 * 6. **Auto + admin**: unión de intervalos por `payrollPeriod` (sin doble conteo).
 *
 * 7. **Unresolvable**: overtime aprobado sin salario histórico → `unresolvable = true`.
 */
@Injectable()
export class VariableAverageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legalParamsService: LaborLegalParametersService,
  ) {}

  async calculate(
    tenantId: string,
    employeeDetailsId: string,
    effectiveTerminationDate: Date,
    contractStartDate: Date,
  ): Promise<VariableAverageResult> {
    const warnings: string[] = [];

    // ── 1. Calcular ventana de 6 meses ─────────────────────────────────────
    const periodEnd = new Date(effectiveTerminationDate);

    // Inicio de ventana: 6 meses antes de effectiveTerminationDate
    const windowStart = new Date(effectiveTerminationDate);
    windowStart.setMonth(windowStart.getMonth() - 6);
    windowStart.setDate(1);
    windowStart.setHours(0, 0, 0, 0);

    // Si el contrato es más reciente que la ventana, ajustar
    const effectivePeriodStart = contractStartDate > windowStart ? contractStartDate : windowStart;

    const daysCovered = Math.max(
      0,
      Math.ceil((periodEnd.getTime() - effectivePeriodStart.getTime()) / (1000 * 60 * 60 * 24)),
    );

    // monthsCovered en meses completos — mínimo 1 para evitar división por cero
    const monthsCovered = Math.max(
      1,
      Math.round(
        (periodEnd.getTime() - effectivePeriodStart.getTime()) / (30.4375 * 24 * 60 * 60 * 1000),
      ),
    );

    if (contractStartDate > windowStart) {
      warnings.push(
        `variable_avg_less_than_6_months — contrato inició ${contractStartDate.toISOString().slice(0, 10)}, solo ${monthsCovered} mes(es) cubiertos`,
      );
    }

    // ── 2. Consultar overtime aprobado en la ventana ───────────────────────
    const overtimeRequests = await this.prisma.overtimeRequest.findMany({
      where: {
        tenantId,
        employeeId: employeeDetailsId,
        status: OvertimeStatus.APROBADA,
        deletedAt: null,
        OR: [
          {
            shiftEndTime: {
              gte: effectivePeriodStart,
              lte: periodEnd,
            },
          },
          {
            workDate: {
              gte: effectivePeriodStart,
              lte: periodEnd,
            },
          },
          {
            proposedStartTime: {
              gte: effectivePeriodStart,
              lte: periodEnd,
            },
          },
        ],
      },
      select: {
        id: true,
        type: true,
        payrollPeriod: true,
        accumulatedMinutes: true,
        shiftEndTime: true,
        actualEndTime: true,
        workDate: true,
        proposedStartTime: true,
        proposedEndTime: true,
        proposedMinutes: true,
      },
      orderBy: [{ workDate: 'asc' }, { shiftEndTime: 'asc' }],
    });

    if (overtimeRequests.length === 0) {
      return {
        periodStart: effectivePeriodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        monthsCovered,
        daysCovered,
        totalVariable: '0.00',
        monthlyAverage: '0.00',
        includedConcepts: [],
        payrollSources: [],
        unresolvable: false,
        warnings,
      };
    }

    // ── 3. Salario vigente por solicitud ────────────────────────────────────
    const salaryHistory = await this.prisma.employeeSalaryHistory.findMany({
      where: {
        tenantId,
        employeeDetailsId,
        effectiveFrom: { lte: periodEnd },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectivePeriodStart } }],
      },
      orderBy: { effectiveFrom: 'asc' },
    });

    const hasSalaryChanges = salaryHistory.length > 1;
    if (hasSalaryChanges) {
      warnings.push(
        'variable_avg_salary_changed_in_window — el salario cambió en la ventana de 6 meses; cada solicitud usa el salario vigente en su propia fecha',
      );
    }

    if (salaryHistory.length === 0) {
      warnings.push(
        'variable_avg_no_salary_history — sin historial salarial disponible; no se puede calcular el valor monetario del overtime',
      );
      return {
        periodStart: effectivePeriodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        monthsCovered,
        daysCovered,
        totalVariable: '0.00',
        monthlyAverage: '0.00',
        includedConcepts: ['OVERTIME'],
        payrollSources: overtimeRequests.map((r): string => `OvertimeRequest:${r.id}`),
        unresolvable: true,
        warnings,
      };
    }

    const attendanceLogs = await this.prisma.attendanceLog.findMany({
      where: {
        tenantId,
        employeeId: employeeDetailsId,
        isActive: true,
        timestamp: {
          gte: effectivePeriodStart,
          lte: new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      select: {
        eventType: true,
        timestamp: true,
        isActive: true,
        markingScope: true,
      },
    });

    const legalSnapshot = await this.legalParamsService.preload(
      [
        'HORARIO_NOCTURNO_INICIO',
        'RECARGO_DOMINICAL_FESTIVO',
        'RECARGO_HORA_EXTRA_DIURNA',
        'RECARGO_HORA_EXTRA_NOCTURNA',
      ],
      effectivePeriodStart,
      periodEnd,
      tenantId,
    );

    const money = computeApprovedOvertimeMoney({
      requests: overtimeRequests as ApprovedOvertimeRequestSlice[],
      logs: attendanceLogs,
      rangeStart: effectivePeriodStart,
      rangeEnd: periodEnd,
      legalSnapshot,
      resolveSalaryAt: (date: Date): Prisma.Decimal | null => {
        const entry = this.resolveSalaryAt(salaryHistory, date);
        return entry ? new Prisma.Decimal(entry.salaryAmount.toString()) : null;
      },
    });

    if (money.sourceIds.length < overtimeRequests.length) {
      warnings.push(
        'variable_avg_salary_gap — al menos una solicitud de horas extra no aportó monto (sin salario vigente o sin minutos liquidables); se excluyó del cálculo',
      );
    }

    const monthlyAverage = money.amount
      .dividedBy(monthsCovered)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const totalVariableRounded = money.amount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      periodStart: effectivePeriodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      monthsCovered,
      daysCovered,
      totalVariable: totalVariableRounded.toFixed(2),
      monthlyAverage: monthlyAverage.toFixed(2),
      includedConcepts: money.concepts,
      payrollSources: money.sourceIds.map((id): string => `OvertimeRequest:${id}`),
      unresolvable: false,
      warnings,
    };
  }

  /** Tramo de EmployeeSalaryHistory vigente en `date` (effectiveFrom <= date < effectiveTo). */
  private resolveSalaryAt<
    T extends { effectiveFrom: Date; effectiveTo: Date | null; salaryAmount: Prisma.Decimal },
  >(history: T[], date: Date): T | null {
    return (
      history.find(
        (entry): boolean =>
          entry.effectiveFrom <= date && (entry.effectiveTo === null || entry.effectiveTo > date),
      ) ?? null
    );
  }
}
