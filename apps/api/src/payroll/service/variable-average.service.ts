import { Injectable } from '@nestjs/common';
import { OvertimeStatus, Prisma } from '@prisma/client';

import { normalizeWorkDate } from '../../attendance/repository/attendance.repository';
import { getBogotaHour } from '../../attendance/utils/attendance-calculation.util';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { PrismaService } from '../../prisma/prisma.service';
import { isColombianHoliday } from '../../reports/service/colombia-holidays.util';
import { VariableAverageResult } from '../interfaces/final-settlement.interfaces';
import { classifyOvertimeSurcharge } from '../utils/overtime-surcharge.util';

/**
 * OS-591 (fase 2, cierre de hallazgos) — Promedio de ingresos variables de los últimos 6 meses.
 *
 * Fuente primaria de "variable": horas extra y recargos aprobados
 * (`OvertimeRequest.status = 'APROBADA'`) causados en los 6 meses
 * calendario anteriores a `effectiveTerminationDate`.
 *
 * ## Clasificación de horas extra — reutiliza el motor de nómina real, no una regla propia
 *
 * `OvertimeRequest.type` (`DETECCION_AUTOMATICA` | `SOLICITUD_ADMINISTRATIVA`) es solo el
 * **origen** de la solicitud (quién la generó), NO una clasificación legal de recargo — no
 * existe ninguna relación entre ese campo y si el tramo fue diurno/nocturno/festivo. La
 * clasificación legal real (`AttendanceOvertimeType`: DIURNO/NOCTURNO/FESTIVO_DIURNO/
 * FESTIVO_NOCTURNO) es la que ya usa `PayrollCalculationService` vía
 * `ReportsService.buildAttendanceSummary`, resuelta a partir de la hora de entrada/salida
 * (zona horaria Bogotá) y el calendario de festivos colombiano — ver
 * `payroll/utils/overtime-surcharge.util.ts` (`classifyOvertimeSurcharge`, la MISMA función
 * que usa el motor real, no una copia). Este servicio deriva `isNocturno`/`isFestivo` de
 * `OvertimeRequest.shiftEndTime`/`actualEndTime` con las mismas reglas
 * (`getBogotaHour`, `normalizeWorkDate`, `isColombianHoliday`) en vez de mirar `type`.
 *
 * ## Decisiones y limitaciones documentadas
 *
 * 1. **Fuente única disponible**: el único registro de pagos variables en el repo es
 *    `OvertimeRequest.accumulatedMinutes`. No existe una tabla de "pagos de horas extra
 *    liquidadas" que vincule cada solicitud a un monto pagado; el monto se genera en
 *    `PayrollCalculationService` en tiempo de nómina y se almacena en
 *    `EmployeePaymentHistory.grossAmount` (sin desglose de overtime). Por tanto, la
 *    conversión de minutos a dinero usa el salario histórico vigente al período de cada
 *    solicitud y las tasas de recargo legales vigentes en la fecha exacta de cada solicitud
 *    (no una sola tasa fija para toda la ventana de 6 meses).
 *
 * 2. **Menos de 6 meses**: si el contrato comenzó después de la ventana de 6 meses, se
 *    cubre solo el período disponible; `monthsCovered` refleja los meses reales.
 *
 * 3. **Meses sin pagos variables**: se incluyen en el divisor (`monthsCovered`) para
 *    calcular el promedio mensual, siguiendo el criterio de "promedio por mes calendario
 *    cubierto", no "promedio por mes con pago".
 *
 * 4. **Valores anulados/no aprobados**: se excluyen (`status != APROBADA` o `deletedAt`
 *    no nulo) — solo `APROBADA` es un estado elegible; `PENDIENTE_ADMIN`,
 *    `PENDIENTE_GERENCIA_OPERACIONES`, `PENDIENTE_GERENCIA_GENERAL` y `OBJETADA` no
 *    representan un pago variable causado.
 *
 * 5. **Pagos retroactivos**: se considera la fecha del turno (`shiftEndTime`), no la fecha
 *    de aprobación — esto captura el período económico correcto.
 *
 * 6. **Fecha de corte**: `effectiveTerminationDate` es el día final del período (inclusive).
 *    Los seis meses van desde el primer día del mes `(effectiveTerminationDate - 6 meses)`
 *    hasta `effectiveTerminationDate`.
 *
 * 7. **Unresolvable**: si se detectan registros de overtime aprobados pero el salario
 *    histórico no está disponible para ninguno de los períodos, `unresolvable = true`
 *    bloquea la aprobación automática.
 *
 * ## Conexión con prima y cesantías
 *
 * `monthlyAverage` de este servicio es la fuente del `variableAverageAmount` que el
 * aggregator suma a la base de cesantías y prima del tramo de liquidación definitiva.
 * No se duplica el cálculo — ambos dominios consumen el mismo resultado.
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
    // Solo APROBADA es un estado elegible — PENDIENTE_* y OBJETADA (rechazada) quedan
    // fuera; deletedAt excluye solicitudes anuladas.
    const overtimeRequests = await this.prisma.overtimeRequest.findMany({
      where: {
        tenantId,
        employeeId: employeeDetailsId,
        status: OvertimeStatus.APROBADA,
        deletedAt: null,
        shiftEndTime: {
          gte: effectivePeriodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        accumulatedMinutes: true,
        shiftEndTime: true,
        actualEndTime: true,
        payrollPeriod: true,
      },
      orderBy: { shiftEndTime: 'asc' },
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

    // ── 4. Tasas legales — resueltas por la fecha exacta de cada solicitud ─────
    // Igual patrón que CesantiasService/PrimaService: preload una vez para todo el rango,
    // luego numberAt(key, date) por registro — evita N+1 y resuelve correctamente si las
    // tasas cambiaron a mitad de la ventana de 6 meses (a diferencia de tomar un solo
    // snapshot en effectiveTerminationDate para todas las solicitudes).
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

    // Monthly hours base: estándar colombiano = 240 horas/mes (CST art. 161, 48 h/sem × 4.33 sem)
    const MONTHLY_HOURS_BASE = 240;

    let totalVariable = new Prisma.Decimal(0);
    const payrollSources: string[] = [];
    const includedConcepts = new Set<string>();
    let missingSalaryForSomeRequest = false;

    for (const req of overtimeRequests) {
      const requestDate = normalizeWorkDate(req.shiftEndTime);
      const salaryAtDate = this.resolveSalaryAt(salaryHistory, requestDate);
      if (!salaryAtDate) {
        missingSalaryForSomeRequest = true;
        continue;
      }

      const hours = req.accumulatedMinutes / 60;
      const monthlySalary = new Prisma.Decimal(salaryAtDate.salaryAmount.toString());
      const hourlyRate = monthlySalary.dividedBy(MONTHLY_HOURS_BASE);

      // Misma regla que el motor de nómina real (ReportsService.buildAttendanceSummary):
      // nocturno = hora de entrada O salida (Bogotá) ≥ HORARIO_NOCTURNO_INICIO vigente ese
      // día; festivo = calendario de festivos colombiano. Nunca se deriva de OvertimeRequest.type.
      const nocturnoStartHour = legalSnapshot.numberAt('HORARIO_NOCTURNO_INICIO', requestDate);
      const entryHour = getBogotaHour(req.shiftEndTime);
      const exitHour = getBogotaHour(req.actualEndTime);
      const isNocturno = entryHour >= nocturnoStartHour || exitHour >= nocturnoStartHour;
      const isFestivo = isColombianHoliday(requestDate);

      const { type, surchargeRate } = classifyOvertimeSurcharge(isNocturno, isFestivo, {
        recargoHoraExtraDiurna: legalSnapshot.numberAt('RECARGO_HORA_EXTRA_DIURNA', requestDate),
        recargoHoraExtraNocturna: legalSnapshot.numberAt(
          'RECARGO_HORA_EXTRA_NOCTURNA',
          requestDate,
        ),
        recargoDominicalFestivo: legalSnapshot.numberAt('RECARGO_DOMINICAL_FESTIVO', requestDate),
      });

      const amount = hourlyRate.times(new Prisma.Decimal(1).plus(surchargeRate)).times(hours);
      totalVariable = totalVariable.plus(amount);
      payrollSources.push(`OvertimeRequest:${req.id}`);
      includedConcepts.add(`OVERTIME:${type}`);
    }

    if (missingSalaryForSomeRequest) {
      warnings.push(
        'variable_avg_salary_gap — al menos una solicitud de horas extra no tiene salario histórico vigente en su fecha; se excluyó del cálculo',
      );
    }

    const monthlyAverage = totalVariable
      .dividedBy(monthsCovered)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const totalVariableRounded = totalVariable.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      periodStart: effectivePeriodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      monthsCovered,
      daysCovered,
      totalVariable: totalVariableRounded.toFixed(2),
      monthlyAverage: monthlyAverage.toFixed(2),
      includedConcepts: Array.from(includedConcepts),
      payrollSources,
      unresolvable: false,
      warnings,
    };
  }

  /** Tramo de EmployeeSalaryHistory vigente en `date` (effectiveFrom <= date < effectiveTo). */
  private resolveSalaryAt<T extends { effectiveFrom: Date; effectiveTo: Date | null }>(
    history: T[],
    date: Date,
  ): T | null {
    return (
      history.find(
        (entry): boolean =>
          entry.effectiveFrom <= date && (entry.effectiveTo === null || entry.effectiveTo > date),
      ) ?? null
    );
  }
}
