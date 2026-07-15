import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CesantiasFundChannel,
  EmployeeCatalogType,
  EmployeeContractType,
  EmployeeDetails,
  Prisma,
} from '@prisma/client';

import {
  CesantiasCalculationService,
  CesantiasSegmentInput,
} from './cesantias-calculation.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import {
  CesantiasAlertSummary,
  CesantiasCalculateForYearResult,
  CesantiasExportAvailability,
  CesantiasSkippedEmployee,
  CesantiasSourceLiquidation,
  EmployeeCesantiasBalanceAsOf,
  ICesantiasService,
} from '../interfaces/cesantias-service.interfaces';
import {
  CesantiasLiquidationRecord,
  CesantiasLiquidationSummary,
  ListCesantiasLiquidationsFilters,
  UpsertCesantiasLiquidationData,
} from '../interfaces/cesantias.interfaces';
import { CesantiasRepository } from '../repository/cesantias.repository';
import { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import { PayrollRepository } from '../repository/payroll.repository';
import { resolveFundAtDate, resolveSalarySegments } from '../utils/cesantias-days.util';
import {
  resolveCesantiasDeadline,
  resolveCesantiasTargetYear,
} from '../utils/cesantias-deadline.util';

/**
 * OS-588 (fase 2) — contratos que, bajo el régimen laboral colombiano, no causan cesantías
 * tradicionales:
 *  - PRESTACION: contrato civil/comercial, no es una relación laboral (no aplica CST).
 *  - APRENDIZAJE: régimen especial SENA (Ley 789 de 2002) con tratamiento distinto según
 *    etapa lectiva/práctica — NO se modeló ese detalle en esta fase (fuera de alcance,
 *    requiere validación legal explícita). Se excluye por precaución en vez de liquidar
 *    con una regla adivinada — ver tasks/OS-588.md.
 * No se reutiliza el `EXEMPT_CONTRACT_TYPES` privado de PayrollCalculationService (mismos
 * dos valores, pero es un concepto legal distinto — exención de aportes a seguridad social,
 * no de cesantías — coincide en los miembros por motivos diferentes, no se debe importar
 * como si fuera la misma regla).
 *
 * OS-591 (fase 1) — SÍ se reutiliza (exportado) para prima de servicios
 * (PrimaService/CESANTIAS_EXEMPT_CONTRACT_TYPES en prima.service.ts): a diferencia del caso
 * anterior, aquí la razón legal ES la misma para ambas prestaciones — sin relación laboral
 * (PRESTACION) o bajo régimen especial sin validar (APRENDIZAJE) no se causa NINGUNA
 * prestación social del CST, ni cesantías ni prima. No se duplica el Set.
 */
export const CESANTIAS_EXEMPT_CONTRACT_TYPES = new Set<EmployeeContractType>([
  EmployeeContractType.PRESTACION,
  EmployeeContractType.APRENDIZAJE,
]);

const MIN_YEAR = 2000;

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
type CesantiasCandidate = {
  employee: EmployeeDetails;
  windowStart: Date;
  windowEndExclusive: Date;
};

@Injectable()
export class CesantiasService implements ICesantiasService {
  constructor(
    private readonly cesantiasRepository: CesantiasRepository,
    private readonly payrollRepository: PayrollRepository,
    private readonly employeeHistoryRepository: EmployeeHistoryRepository,
    private readonly cesantiasCalculationService: CesantiasCalculationService,
    private readonly legalParametersService: LaborLegalParametersService,
  ) {}

  async calculateForYear(
    tenantId: string,
    year: number,
    userId?: string,
  ): Promise<CesantiasCalculateForYearResult> {
    this.assertValidYear(year);

    const { periodStart, periodEndExclusive, periodEndInclusive } = this.resolveYearWindow(year);

    // ── 1. Empleados candidatos (una sola query, incluye inactivos/retirados) ──────────
    const allEmployees = await this.payrollRepository.findAll({
      tenantId,
      includeInactive: true,
    });

    const candidates = allEmployees
      .map((employee): CesantiasCandidate => {
        const hireDate = this.toUtcMidnight(employee.hireDate);
        const contractEndExclusive = employee.contractEnd
          ? this.addDays(this.toUtcMidnight(employee.contractEnd), 1)
          : null;

        const windowStart = hireDate > periodStart ? hireDate : periodStart;
        const windowEndExclusive =
          contractEndExclusive && contractEndExclusive < periodEndExclusive
            ? contractEndExclusive
            : periodEndExclusive;

        return { employee, windowStart, windowEndExclusive };
      })
      .filter(({ windowStart, windowEndExclusive }): boolean => windowStart < windowEndExclusive);

    const skipped: CesantiasSkippedEmployee[] = [];
    const candidateIds = new Set(candidates.map((c): string => c.employee.id));
    for (const employee of allEmployees) {
      if (!candidateIds.has(employee.id)) {
        skipped.push({ employeeId: employee.id, reason: 'SIN_TRASLAPE_EN_EL_ANIO' });
      }
    }

    if (candidates.length === 0) {
      return {
        tenantId,
        year,
        totalEmployeesEvaluated: allEmployees.length,
        created: 0,
        updated: 0,
        skipped,
        liquidations: [],
      };
    }

    // ── 2. Historiales en batch (evita N+1) ─────────────────────────────────────────────
    const employeeIds = candidates.map((c): string => c.employee.id);
    const [salaryHistoryByEmployee, fundHistoryByEmployee, existingByEmployee] = await Promise.all([
      this.employeeHistoryRepository.findSalaryHistoryByEmployees(tenantId, employeeIds),
      this.employeeHistoryRepository.findFundHistoryByEmployees(
        tenantId,
        employeeIds,
        EmployeeCatalogType.CESANTIAS_FUND,
      ),
      this.cesantiasRepository.findMapByTenantAndYear(tenantId, year),
    ]);

    // ── 3. Parámetros legales — una sola resolución para todo el periodo (ver nota abajo) ──
    // AUXILIO_TRANSPORTE y SMLV tienen vigencias que arrancan el 1 de enero, así que nunca
    // cambian a mitad de un periodo que ya está acotado a un solo año calendario (igual
    // criterio que ReportsService.getPayrollReport: "resolved once, at period's last day").
    // INTERES_CESANTIAS y DIVISOR_CESANTIAS son estables desde 2020, pero se resuelven por
    // fecha igual — si algún día cambian a mitad de año, esto seguiría siendo correcto para
    // el snapshot (la tasa vigente AL CIERRE es la que se guarda, por diseño).
    const legalSnapshot = await this.legalParametersService.preload(
      ['INTERES_CESANTIAS', 'DIVISOR_CESANTIAS', 'AUXILIO_TRANSPORTE', 'SMLV'],
      periodStart,
      periodEndInclusive,
      tenantId,
    );
    const interestRate = new Prisma.Decimal(
      legalSnapshot.numberAt('INTERES_CESANTIAS', periodEndInclusive),
    );
    const divisor = new Prisma.Decimal(
      legalSnapshot.numberAt('DIVISOR_CESANTIAS', periodEndInclusive),
    );
    const smlv = legalSnapshot.numberAt('SMLV', periodEndInclusive);
    const transportSubsidyAmount = new Prisma.Decimal(
      legalSnapshot.numberAt('AUXILIO_TRANSPORTE', periodEndInclusive),
    );
    const transportSubsidyThreshold = new Prisma.Decimal(smlv * 2);

    // ── 4. Cálculo puro por empleado (sin DB) ───────────────────────────────────────────
    const toWrite: UpsertCesantiasLiquidationData[] = [];

    for (const { employee, windowStart, windowEndExclusive } of candidates) {
      if (CESANTIAS_EXEMPT_CONTRACT_TYPES.has(employee.contractType)) {
        skipped.push({ employeeId: employee.id, reason: 'TIPO_CONTRATO_EXCLUIDO' });
        continue;
      }

      const existing = existingByEmployee.get(employee.id);
      if (
        existing &&
        (existing.cesantiasStatus === 'CONSIGNADA' || existing.interestStatus === 'PAGADO')
      ) {
        skipped.push({ employeeId: employee.id, reason: 'LIQUIDACION_CERRADA' });
        continue;
      }

      const salaryHistory = salaryHistoryByEmployee.get(employee.id) ?? [];
      if (salaryHistory.length === 0) {
        skipped.push({ employeeId: employee.id, reason: 'SIN_HISTORIAL_SALARIAL' });
        continue;
      }

      const rawSegments = resolveSalarySegments(salaryHistory, windowStart, windowEndExclusive);
      if (rawSegments.some((s): boolean => new Prisma.Decimal(s.salaryAmount).lte(0))) {
        skipped.push({ employeeId: employee.id, reason: 'BASE_INVALIDA' });
        continue;
      }

      const fundHistory = fundHistoryByEmployee.get(employee.id) ?? [];
      const asOfDate = new Date(windowEndExclusive.getTime() - 1);
      const fund = resolveFundAtDate(fundHistory, EmployeeCatalogType.CESANTIAS_FUND, asOfDate);
      if (!fund) {
        skipped.push({ employeeId: employee.id, reason: 'SIN_FONDO_CESANTIAS_VIGENTE' });
        continue;
      }

      const segmentInputs: CesantiasSegmentInput[] = rawSegments.map(
        (s): CesantiasSegmentInput => ({
          salaryType: s.salaryType,
          salaryAmount: new Prisma.Decimal(s.salaryAmount),
          commercialDays: s.commercialDays,
        }),
      );

      const result = this.cesantiasCalculationService.calculate(
        segmentInputs,
        employee.hasTransportSubsidy,
        { interestRate, divisor, transportSubsidyAmount, transportSubsidyThreshold },
        rawSegments.map((s): { start: Date; endExclusive: Date } => ({
          start: s.start,
          endExclusive: s.endExclusive,
        })),
      );

      toWrite.push({
        tenantId,
        employeeId: employee.id,
        year,
        periodStart: windowStart,
        periodEnd: new Date(windowEndExclusive.getTime() - 1),
        accrualDays: result.accrualDays,
        calculationBase: result.calculationBase,
        cesantiasAmount: result.cesantiasAmount,
        interestAmount: result.interestAmount,
        interestRateSnapshot: interestRate,
        fundNameSnapshot: fund.fundName,
        fundChannelSnapshot: this.deriveFundChannel(fund.fundName),
        calculatedBy: userId,
      });
    }

    // ── 5. Escritura — una sola transacción para todo el lote ───────────────────────────
    const saved = await this.cesantiasRepository.saveCalculations(toWrite);
    const created = saved.filter((s): boolean => !existingByEmployee.has(s.employeeId)).length;
    const updated = saved.length - created;

    return {
      tenantId,
      year,
      totalEmployeesEvaluated: allEmployees.length,
      created,
      updated,
      skipped,
      liquidations: saved,
    };
  }

  /**
   * OS-588 (fase 4) — agrega `employeeName` a cada fila (resuelto en batch, una sola
   * query adicional vía PayrollRepository, no N+1) para que el frontend nunca tenga que
   * mostrar `employeeId` técnico. No es una fuente nueva de datos: `EmployeeDetails.name`
   * es el mismo campo que ya usa el resto del módulo payroll para mostrar empleados.
   */
  async listByYear(
    tenantId: string,
    year: number | undefined,
    pagination: Omit<ListCesantiasLiquidationsFilters, 'tenantId' | 'year'>,
  ): Promise<{ items: CesantiasLiquidationSummary[]; total: number }> {
    const filters: ListCesantiasLiquidationsFilters = { tenantId, year, ...pagination };
    const [items, total] = await Promise.all([
      this.cesantiasRepository.findByTenantAndYear(filters),
      this.cesantiasRepository.countByTenantAndYear(filters),
    ]);

    const employeeIds = items.map((item): string => item.employeeId);
    const employees = await this.payrollRepository.findManyWithPersonalDataByIds(
      tenantId,
      employeeIds,
    );
    const nameByEmployeeId = new Map(employees.map((e): [string, string] => [e.id, e.name]));

    const withNames: CesantiasLiquidationSummary[] = items.map(
      (item): CesantiasLiquidationSummary => ({
        ...item,
        employeeName: nameByEmployeeId.get(item.employeeId) ?? 'Empleado no encontrado',
      }),
    );

    return { items: withNames, total };
  }

  async getDetail(tenantId: string, id: string): Promise<CesantiasLiquidationRecord> {
    const record = await this.cesantiasRepository.findById(tenantId, id);
    if (!record) {
      throw new NotFoundException(`Liquidación de cesantías "${id}" no encontrada`);
    }
    return record;
  }

  /**
   * OS-588 (fase 4) — resumen para la alerta de vencimiento del dashboard/pantalla de
   * cesantías. Año objetivo = último año calendario cerrado (ver
   * cesantias-deadline.util.ts); día/mes límite vienen de LaborLegalParameter
   * (CESANTIAS_PLAZO_DIA/CESANTIAS_PLAZO_MES) — nunca hardcodeados. No recalcula ni
   * modifica ninguna liquidación, solo lee el conteo de pendientes ya persistido.
   */
  async getAlertSummary(tenantId: string): Promise<CesantiasAlertSummary> {
    const today = new Date();
    // Misma regla que usa resolveCesantiasDeadline internamente (evita reimplementarla
    // dos veces) — se necesita antes, por separado, para poder pedir el conteo de
    // pendientes en paralelo con los parámetros legales.
    const targetYear = resolveCesantiasTargetYear(today);

    const [plazoDia, plazoMes, pendingCount] = await Promise.all([
      this.legalParametersService.getValueAt('CESANTIAS_PLAZO_DIA', today, tenantId),
      this.legalParametersService.getValueAt('CESANTIAS_PLAZO_MES', today, tenantId),
      this.cesantiasRepository.countPendingByTenantAndYear(tenantId, targetYear),
    ]);

    const deadline = resolveCesantiasDeadline(today, plazoDia, plazoMes, pendingCount);

    return {
      targetYear: deadline.targetYear,
      deadlineDate: deadline.deadlineDate,
      pendingCount,
      daysUntilDeadline: deadline.daysUntilDeadline,
      status: deadline.status,
    };
  }

  /**
   * OS-588 (fase 4, revisión previa a commit) — usado por los botones de descarga del
   * frontend para habilitarse/deshabilitarse. Reutiliza
   * `countExportableByTenantYearAndChannel` (misma regla — `EXPORTABLE_CESANTIAS_STATUSES`
   * — que usa `CesantiasExportService`/`findExportableByTenantAndYear` para decidir qué
   * se incluye en el archivo real), así que nunca puede haber un botón habilitado cuyo
   * archivo resultante esté vacío por un estado no exportable, ni viceversa.
   */
  async getExportAvailability(
    tenantId: string,
    year: number,
  ): Promise<CesantiasExportAvailability> {
    this.assertValidYear(year);

    const [fnaCount, privateCount] = await Promise.all([
      this.cesantiasRepository.countExportableByTenantYearAndChannel(
        tenantId,
        year,
        CesantiasFundChannel.FNA,
      ),
      this.cesantiasRepository.countExportableByTenantYearAndChannel(
        tenantId,
        year,
        CesantiasFundChannel.PRIVATE_OPERATOR,
      ),
    ]);

    return { fna: fnaCount > 0, privateOperator: privateCount > 0 };
  }

  /**
   * OS-591 (fase 1) — saldo pendiente de cesantías/intereses de UN empleado a una fecha
   * arbitraria. Deliberadamente NO usa `calculateForYear` (batch de todo el tenant, con el
   * riesgo de recalcular/afectar a otros empleados ya documentado en tasks/OS-588.md) — el
   * tramo del año en curso se calcula aquí mismo, en memoria, sin persistir nada.
   *
   * Anti-doble-pago: años anteriores solo se cuentan como pendientes si su estado es
   * CALCULADA/CALCULADO — CONSIGNADA/PAGADO se excluye (ya pagado) y ANULADA/ANULADO
   * también (liquidación sin efecto). Documentado explícitamente en `statesConsidered` para
   * que el caller (fase 2) no tenga que adivinar la regla.
   */
  async getEmployeeBalanceAsOf(
    tenantId: string,
    employeeId: string,
    asOfDate: Date,
  ): Promise<EmployeeCesantiasBalanceAsOf> {
    const employee = await this.payrollRepository.findById(employeeId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Empleado ${employeeId} no encontrado`);
    }

    const asOfYear = asOfDate.getUTCFullYear();
    const allLiquidations = await this.cesantiasRepository.findAllByEmployee(tenantId, employeeId);

    const sourceLiquidations: CesantiasSourceLiquidation[] = allLiquidations.map(
      (l): CesantiasSourceLiquidation => ({
        id: l.id,
        year: l.year,
        cesantiasStatus: l.cesantiasStatus,
        interestStatus: l.interestStatus,
        cesantiasAmount: l.cesantiasAmount,
        interestAmount: l.interestAmount,
      }),
    );

    const currentYearRecord = allLiquidations.find((l): boolean => l.year === asOfYear);

    let pendingCesantias = allLiquidations
      .filter((l): boolean => l.year !== asOfYear && l.cesantiasStatus === 'CALCULADA')
      .reduce((sum, l): Prisma.Decimal => sum.plus(l.cesantiasAmount), new Prisma.Decimal(0));
    let pendingInterest = allLiquidations
      .filter((l): boolean => l.year !== asOfYear && l.interestStatus === 'CALCULADO')
      .reduce((sum, l): Prisma.Decimal => sum.plus(l.interestAmount), new Prisma.Decimal(0));

    // El año en curso: si ya está CONSIGNADA/PAGADO, no contribuye a lo pendiente (ya
    // resuelto, no se proyecta nada). Si ya existe un cálculo persistido vigente
    // (CALCULADA, no ANULADA), su monto SE CONSOLIDA una sola vez (no se descarta ni se
    // recalcula desde cero) y el tramo en vivo arranca justo después de su `periodEnd` —
    // nunca se solapa con lo ya consolidado, así que no hay riesgo de sumar el valor
    // persistido y una proyección duplicada del mismo tramo. Si está ANULADA, su monto no
    // cuenta (sin efecto) y sí se recalcula limpio desde el inicio del año.
    const { periodStart, periodEndExclusive, periodEndInclusive } = this.resolveYearWindowAsOf(
      asOfYear,
      asOfDate,
    );

    const isCurrentYearClosed =
      currentYearRecord !== undefined &&
      (currentYearRecord.cesantiasStatus === 'CONSIGNADA' ||
        currentYearRecord.interestStatus === 'PAGADO');
    const isCurrentYearAnulada = currentYearRecord?.cesantiasStatus === 'ANULADA';
    const hasConsolidatableCurrentYearRecord =
      currentYearRecord !== undefined && !isCurrentYearClosed && !isCurrentYearAnulada;

    if (hasConsolidatableCurrentYearRecord) {
      pendingCesantias = pendingCesantias.plus(currentYearRecord.cesantiasAmount);
      pendingInterest = pendingInterest.plus(currentYearRecord.interestAmount);
    }

    let calculationBase = new Prisma.Decimal(0);
    let currentPeriodStart = periodStart;
    let legalParametersSnapshot = {
      interestRate: '0',
      divisor: '0',
      transportSubsidyAmount: '0',
      transportSubsidyThreshold: '0',
    };

    const shouldProjectCurrentYear =
      !isCurrentYearClosed && !CESANTIAS_EXEMPT_CONTRACT_TYPES.has(employee.contractType);

    if (shouldProjectCurrentYear) {
      const hireDate = this.toUtcMidnight(employee.hireDate);
      const contractEndExclusive = employee.contractEnd
        ? this.addDays(this.toUtcMidnight(employee.contractEnd), 1)
        : null;
      const baseWindowStart = this.maxDateOf(hireDate, periodStart);
      // Si hay un registro consolidable, el tramo en vivo solo cubre el hueco después de
      // su cierre — evita recalcular (y potencialmente divergir de) lo ya persistido.
      const windowStart = hasConsolidatableCurrentYearRecord
        ? this.maxDateOf(
            baseWindowStart,
            this.addDays(this.toUtcMidnight(currentYearRecord.periodEnd), 1),
          )
        : baseWindowStart;
      const windowEndExclusive = contractEndExclusive
        ? this.minDateOf(contractEndExclusive, periodEndExclusive)
        : periodEndExclusive;
      currentPeriodStart = windowStart;

      if (windowStart < windowEndExclusive) {
        const salaryHistory = await this.employeeHistoryRepository.findSalaryHistoryByEmployee(
          tenantId,
          employeeId,
        );
        const rawSegments = resolveSalarySegments(salaryHistory, windowStart, windowEndExclusive);

        const legalSnapshot = await this.legalParametersService.preload(
          ['INTERES_CESANTIAS', 'DIVISOR_CESANTIAS', 'AUXILIO_TRANSPORTE', 'SMLV'],
          periodStart,
          periodEndInclusive,
          tenantId,
        );
        const interestRate = new Prisma.Decimal(
          legalSnapshot.numberAt('INTERES_CESANTIAS', periodEndInclusive),
        );
        const divisor = new Prisma.Decimal(
          legalSnapshot.numberAt('DIVISOR_CESANTIAS', periodEndInclusive),
        );
        const smlv = legalSnapshot.numberAt('SMLV', periodEndInclusive);
        const transportSubsidyAmount = new Prisma.Decimal(
          legalSnapshot.numberAt('AUXILIO_TRANSPORTE', periodEndInclusive),
        );
        const transportSubsidyThreshold = new Prisma.Decimal(smlv * 2);

        const segmentInputs: CesantiasSegmentInput[] = rawSegments.map(
          (s): CesantiasSegmentInput => ({
            salaryType: s.salaryType,
            salaryAmount: new Prisma.Decimal(s.salaryAmount),
            commercialDays: s.commercialDays,
          }),
        );

        const result = this.cesantiasCalculationService.calculate(
          segmentInputs,
          employee.hasTransportSubsidy,
          { interestRate, divisor, transportSubsidyAmount, transportSubsidyThreshold },
          rawSegments.map((s): { start: Date; endExclusive: Date } => ({
            start: s.start,
            endExclusive: s.endExclusive,
          })),
        );

        pendingCesantias = pendingCesantias.plus(result.cesantiasAmount);
        pendingInterest = pendingInterest.plus(result.interestAmount);
        calculationBase = result.calculationBase;
        legalParametersSnapshot = {
          interestRate: interestRate.toString(),
          divisor: divisor.toString(),
          transportSubsidyAmount: transportSubsidyAmount.toString(),
          transportSubsidyThreshold: transportSubsidyThreshold.toString(),
        };
      }
    }

    return {
      asOfDate,
      currentPeriodStart,
      currentPeriodEnd: asOfDate,
      calculationBase: calculationBase.toString(),
      pendingCesantias: pendingCesantias
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        .toString(),
      pendingInterest: pendingInterest.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString(),
      sourceLiquidations,
      statesConsidered: {
        pendingCesantiasStatuses: ['CALCULADA'],
        excludedCesantiasStatuses: ['CONSIGNADA', 'ANULADA'],
        pendingInterestStatuses: ['CALCULADO'],
        excludedInterestStatuses: ['PAGADO', 'ANULADO'],
      },
      legalParametersSnapshot,
    };
  }

  /**
   * OS-591 (fase 1) — variante de `resolveYearWindow` que acota al `asOfDate` pedido en vez
   * de "hoy" (permite previsualizar el saldo a una fecha pasada o futura dentro del año,
   * no solo "hasta hoy"). No reemplaza a `resolveYearWindow` (que sigue usando `new Date()`
   * para el batch anual real) para no cambiar el comportamiento de `calculateForYear`.
   */
  private resolveYearWindowAsOf(
    year: number,
    asOfDate: Date,
  ): { periodStart: Date; periodEndExclusive: Date; periodEndInclusive: Date } {
    const periodStart = new Date(Date.UTC(year, 0, 1));
    const fullYearEndExclusive = new Date(Date.UTC(year + 1, 0, 1));
    const asOfExclusive = this.addDays(this.toUtcMidnight(asOfDate), 1);
    const periodEndExclusive =
      asOfExclusive < fullYearEndExclusive ? asOfExclusive : fullYearEndExclusive;
    const periodEndInclusive = new Date(periodEndExclusive.getTime() - 1);
    return { periodStart, periodEndExclusive, periodEndInclusive };
  }

  private maxDateOf(a: Date, b: Date): Date {
    return a > b ? a : b;
  }

  private minDateOf(a: Date, b: Date): Date {
    return a < b ? a : b;
  }

  private deriveFundChannel(fundName: string): CesantiasFundChannel {
    return fundName === 'Fondo Nacional del Ahorro'
      ? CesantiasFundChannel.FNA
      : CesantiasFundChannel.PRIVATE_OPERATOR;
  }

  private assertValidYear(year: number): void {
    const currentYear = new Date().getUTCFullYear();
    if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear + 1) {
      throw new BadRequestException(
        `Año inválido: "${year}". Debe estar entre ${MIN_YEAR} y ${currentYear + 1}`,
      );
    }
  }

  private resolveYearWindow(year: number): {
    periodStart: Date;
    periodEndExclusive: Date;
    periodEndInclusive: Date;
  } {
    const periodStart = new Date(Date.UTC(year, 0, 1));
    const fullYearEndExclusive = new Date(Date.UTC(year + 1, 0, 1));
    const now = new Date();
    const todayExclusive = this.addDays(this.toUtcMidnight(now), 1);
    const periodEndExclusive =
      todayExclusive < fullYearEndExclusive ? todayExclusive : fullYearEndExclusive;
    const periodEndInclusive = new Date(periodEndExclusive.getTime() - 1);
    return { periodStart, periodEndExclusive, periodEndInclusive };
  }

  private toUtcMidnight(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
