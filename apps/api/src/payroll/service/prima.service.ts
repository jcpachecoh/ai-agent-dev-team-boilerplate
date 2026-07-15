import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type EmployeeContractType, type PrimaHalf } from '@prisma/client';

import { CESANTIAS_EXEMPT_CONTRACT_TYPES } from './cesantias.service';
import { PrimaCalculationService, PrimaSegmentInput } from './prima-calculation.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IPrimaService,
  PrimaBalanceAsOf,
  PrimaBalanceSegment,
  PrimaSourceLiquidation,
} from '../interfaces/prima-service.interfaces';
import { PrimaLiquidationRecord } from '../interfaces/prima.interfaces';
import { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import { PayrollRepository } from '../repository/payroll.repository';
import { PrimaRepository } from '../repository/prima.repository';
import { resolveSalarySegments } from '../utils/cesantias-days.util';
import {
  previousPrimaHalf,
  resolvePrimaHalfForDate,
  resolvePrimaHalfWindow,
} from '../utils/prima-days.util';

const MIN_YEAR = 2000;

@Injectable()
export class PrimaService implements IPrimaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly primaRepository: PrimaRepository,
    private readonly payrollRepository: PayrollRepository,
    private readonly employeeHistoryRepository: EmployeeHistoryRepository,
    private readonly primaCalculationService: PrimaCalculationService,
    private readonly legalParametersService: LaborLegalParametersService,
  ) {}

  /**
   * OS-591 (fase 1) — contrato de consulta requerido por el ticket. Consolida TODAS las
   * liquidaciones no ANULADAS ya persistidas (histórico completo, cualquier año/semestre)
   * más el tramo del semestre EN CURSO calculado en vivo (no persistido) desde el último
   * cierre registrado (o el inicio del semestre/ingreso, lo que sea posterior) hasta
   * `asOfDate`. No escribe nada en la base de datos — pura previsualización.
   */
  async getPrimaBalanceAsOf(
    tenantId: string,
    employeeId: string,
    asOfDate: Date,
  ): Promise<PrimaBalanceAsOf> {
    const employee = await this.findEmployeeOrThrow(tenantId, employeeId);
    const { year, half } = resolvePrimaHalfForDate(asOfDate);
    const { periodStart: halfStart, periodEndExclusive: halfEndExclusive } = resolvePrimaHalfWindow(
      year,
      half,
    );

    const divisor = await this.legalParametersService.getValueAt(
      'PRIMA_DIVISOR_DIAS',
      asOfDate,
      tenantId,
    );

    const allLiquidations = await this.primaRepository.findAllByEmployee(tenantId, employeeId);
    const nonAnuladas = allLiquidations.filter((l): boolean => l.status !== 'ANULADA');

    const sourceLiquidations: PrimaSourceLiquidation[] = allLiquidations.map(
      (l): PrimaSourceLiquidation => ({
        id: l.id,
        year: l.year,
        half: l.half,
        status: l.status,
        accruedAmount: l.accruedAmount,
        paidAmount: l.paidAmount,
      }),
    );

    const closedAccrued = nonAnuladas.reduce(
      (sum, l): Prisma.Decimal => sum.plus(l.accruedAmount),
      new Prisma.Decimal(0),
    );
    const totalPaid = nonAnuladas.reduce(
      (sum, l): Prisma.Decimal => sum.plus(l.paidAmount),
      new Prisma.Decimal(0),
    );

    // Si ya existe un cierre persistido para el semestre en curso (no ANULADA), el tramo
    // en vivo solo cubre el hueco entre ese cierre y asOfDate — evita contar dos veces los
    // días ya calculados por ese registro (mismo criterio anti-doble-pago que cesantías).
    const currentPeriodRecord = nonAnuladas.find(
      (l): boolean => l.year === year && l.half === half,
    );
    const liveWindowStart = currentPeriodRecord
      ? this.addDays(this.toUtcMidnight(currentPeriodRecord.periodEnd), 1)
      : this.maxDate(halfStart, this.toUtcMidnight(employee.hireDate));
    const liveWindowEndExclusive = this.addDays(this.toUtcMidnight(asOfDate), 1);

    let liveAmount = new Prisma.Decimal(0);
    let liveBase = new Prisma.Decimal(0);
    let segments: PrimaBalanceSegment[] = [];

    const isExempt = CESANTIAS_EXEMPT_CONTRACT_TYPES.has(employee.contractType);
    if (
      !isExempt &&
      liveWindowStart < liveWindowEndExclusive &&
      liveWindowStart < halfEndExclusive
    ) {
      const salaryHistory = await this.employeeHistoryRepository.findSalaryHistoryByEmployee(
        tenantId,
        employeeId,
      );
      const cappedEnd = this.minDate(liveWindowEndExclusive, halfEndExclusive);
      const rawSegments = resolveSalarySegments(salaryHistory, liveWindowStart, cappedEnd);

      const legalSnapshot = await this.legalParametersService.preload(
        ['AUXILIO_TRANSPORTE', 'SMLV'],
        liveWindowStart,
        asOfDate,
        tenantId,
      );
      const smlv = legalSnapshot.numberAt('SMLV', asOfDate);
      const transportSubsidyAmount = new Prisma.Decimal(
        legalSnapshot.numberAt('AUXILIO_TRANSPORTE', asOfDate),
      );
      const transportSubsidyThreshold = new Prisma.Decimal(smlv * 2);

      const segmentInputs: PrimaSegmentInput[] = rawSegments.map(
        (s): PrimaSegmentInput => ({
          salaryType: s.salaryType,
          salaryAmount: new Prisma.Decimal(s.salaryAmount),
          commercialDays: s.commercialDays,
        }),
      );

      const result = this.primaCalculationService.calculate(
        segmentInputs,
        employee.hasTransportSubsidy,
        { divisor: new Prisma.Decimal(divisor), transportSubsidyAmount, transportSubsidyThreshold },
        rawSegments.map((s): { start: Date; endExclusive: Date } => ({
          start: s.start,
          endExclusive: s.endExclusive,
        })),
      );

      liveAmount = result.primaAmount;
      liveBase = result.calculationBase;
      segments = result.segments.map(
        (s): PrimaBalanceSegment => ({
          start: s.start,
          endExclusive: s.endExclusive,
          salaryAmount: s.salaryAmount,
          commercialDays: s.commercialDays,
          includedInBase: s.includedInBase,
          transportSubsidyApplied: s.transportSubsidyApplied,
          transportSubsidyAmount: s.transportSubsidyAmount,
          variableAverageAmount: s.variableAverageAmount,
          segmentBase: s.segmentBase,
          segmentPrima: s.segmentPrima,
        }),
      );
    }

    const accruedAmount = closedAccrued.plus(liveAmount);
    const pendingAmount = accruedAmount.minus(totalPaid);
    const overpaymentAmount = totalPaid.minus(accruedAmount);

    return {
      asOfDate,
      currentPeriodStart: halfStart,
      currentPeriodEnd: asOfDate,
      baseAmount: liveBase.toString(),
      accruedAmount: accruedAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toString(),
      paidAmount: totalPaid.toString(),
      overpaymentAmount: (overpaymentAmount.isNegative()
        ? new Prisma.Decimal(0)
        : overpaymentAmount
      )
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        .toString(),
      pendingAmount: (pendingAmount.isNegative() ? new Prisma.Decimal(0) : pendingAmount)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        .toString(),
      segments,
      sourceLiquidations,
      divisorSnapshot: divisor.toString(),
    };
  }

  /**
   * OS-591 (fase 1) — cálculo POR EMPLEADO (a diferencia de CesantiasService.calculateForYear,
   * que es batch de todo el tenant y no debe reutilizarse para un flujo de un solo empleado —
   * ver auditoría OS-591). Persiste un cierre de semestre; no se invoca desde ningún flujo de
   * liquidación definitiva todavía (esa conexión es de fase 2).
   */
  async calculateForEmployeeSemester(
    tenantId: string,
    employeeId: string,
    year: number,
    half: PrimaHalf,
    userId?: string,
  ): Promise<PrimaLiquidationRecord> {
    this.assertValidYear(year);
    const employee = await this.findEmployeeOrThrow(tenantId, employeeId);

    if (CESANTIAS_EXEMPT_CONTRACT_TYPES.has(employee.contractType)) {
      throw new BadRequestException(
        `El tipo de contrato ${employee.contractType} no causa prima de servicios`,
      );
    }

    const existing = await this.primaRepository.findByEmployeeAndPeriod(
      tenantId,
      employeeId,
      year,
      half,
    );
    if (existing?.status === 'PAGADA') {
      throw new ConflictException(
        'La prima de este semestre ya fue pagada — no se puede recalcular',
      );
    }

    const { periodStart: halfStart, periodEndExclusive: halfEndExclusive } = resolvePrimaHalfWindow(
      year,
      half,
    );
    const hireDate = this.toUtcMidnight(employee.hireDate);
    const contractEndExclusive = employee.contractEnd
      ? this.addDays(this.toUtcMidnight(employee.contractEnd), 1)
      : null;
    const todayExclusive = this.addDays(this.toUtcMidnight(new Date()), 1);

    const windowStart = this.maxDate(halfStart, hireDate);
    const windowEndExclusive = this.minDate(
      halfEndExclusive,
      contractEndExclusive ?? halfEndExclusive,
      todayExclusive,
    );

    if (windowStart >= windowEndExclusive) {
      throw new BadRequestException(
        'No hay traslape entre el semestre solicitado y la relación laboral del empleado',
      );
    }

    const salaryHistory = await this.employeeHistoryRepository.findSalaryHistoryByEmployee(
      tenantId,
      employeeId,
    );
    if (salaryHistory.length === 0) {
      throw new BadRequestException('El empleado no tiene historial salarial registrado');
    }

    const rawSegments = resolveSalarySegments(salaryHistory, windowStart, windowEndExclusive);
    const periodEndInclusive = new Date(windowEndExclusive.getTime() - 1);

    const divisor = await this.legalParametersService.getValueAt(
      'PRIMA_DIVISOR_DIAS',
      periodEndInclusive,
      tenantId,
    );
    const legalSnapshot = await this.legalParametersService.preload(
      ['AUXILIO_TRANSPORTE', 'SMLV'],
      windowStart,
      periodEndInclusive,
      tenantId,
    );
    const smlv = legalSnapshot.numberAt('SMLV', periodEndInclusive);
    const transportSubsidyAmount = new Prisma.Decimal(
      legalSnapshot.numberAt('AUXILIO_TRANSPORTE', periodEndInclusive),
    );
    const transportSubsidyThreshold = new Prisma.Decimal(smlv * 2);

    const segmentInputs: PrimaSegmentInput[] = rawSegments.map(
      (s): PrimaSegmentInput => ({
        salaryType: s.salaryType,
        salaryAmount: new Prisma.Decimal(s.salaryAmount),
        commercialDays: s.commercialDays,
      }),
    );

    const result = this.primaCalculationService.calculate(
      segmentInputs,
      employee.hasTransportSubsidy,
      { divisor: new Prisma.Decimal(divisor), transportSubsidyAmount, transportSubsidyThreshold },
      rawSegments.map((s): { start: Date; endExclusive: Date } => ({
        start: s.start,
        endExclusive: s.endExclusive,
      })),
    );

    return this.prismaService.$transaction(
      (tx): Promise<PrimaLiquidationRecord> =>
        this.primaRepository.upsertCalculationTx(tx, {
          tenantId,
          employeeId,
          year,
          half,
          periodStart: windowStart,
          periodEnd: periodEndInclusive,
          accrualDays: result.accrualDays,
          calculationBase: result.calculationBase,
          accruedAmount: result.primaAmount,
          divisorSnapshot: new Prisma.Decimal(divisor),
          calculatedBy: userId,
        }),
    );
  }

  /**
   * OS-591 (fase 1, cierre de hallazgos) — transición de estado explícita según el
   * `paidAmount` acumulado resultante frente a `accruedAmount`:
   *  - Pago parcial (paidAmount resultante < accruedAmount) → permanece CALCULADA. Es
   *    exactamente el caso "prima parcial" (saldo pendiente > 0, ver getPrimaBalanceAsOf).
   *  - Pago que alcanza o supera lo causado (paidAmount resultante >= accruedAmount) →
   *    PAGADA. El sobrepago (paidAmount > accruedAmount) NO es un estado aparte — es un
   *    hecho numérico derivado (ver overpaymentAmount en getPrimaBalanceAsOf), la
   *    liquidación igual queda PAGADA.
   * Ningún estado queda sin transición: CALCULADA (default) → CALCULADA|PAGADA (pago) →
   * ANULADA (vía `annul`, bloquea pagos futuros).
   */
  async registerPayment(
    tenantId: string,
    id: string,
    amount: number | string,
  ): Promise<PrimaLiquidationRecord> {
    const record = await this.primaRepository.findById(tenantId, id);
    if (!record) {
      throw new NotFoundException(`Liquidación de prima "${id}" no encontrada`);
    }
    if (record.status === 'ANULADA') {
      throw new ConflictException('No se puede registrar un pago sobre una liquidación ANULADA');
    }
    const decimalAmount = new Prisma.Decimal(amount);
    if (decimalAmount.lte(0)) {
      throw new BadRequestException('El monto pagado debe ser mayor a 0');
    }

    const resultingPaidAmount = new Prisma.Decimal(record.paidAmount).plus(decimalAmount);
    const nextStatus = resultingPaidAmount.gte(new Prisma.Decimal(record.accruedAmount))
      ? 'PAGADA'
      : 'CALCULADA';

    return this.prismaService.$transaction(
      (tx): Promise<PrimaLiquidationRecord> =>
        this.primaRepository.registerPaymentTx(tx, id, decimalAmount, nextStatus),
    );
  }

  async annul(tenantId: string, id: string): Promise<PrimaLiquidationRecord> {
    const record = await this.primaRepository.findById(tenantId, id);
    if (!record) {
      throw new NotFoundException(`Liquidación de prima "${id}" no encontrada`);
    }
    return this.prismaService.$transaction(
      (tx): Promise<PrimaLiquidationRecord> => this.primaRepository.annulTx(tx, id),
    );
  }

  private async findEmployeeOrThrow(
    tenantId: string,
    employeeId: string,
  ): Promise<{
    id: string;
    contractType: EmployeeContractType;
    hasTransportSubsidy: boolean;
    hireDate: Date;
    contractEnd: Date | null;
  }> {
    const employee = await this.payrollRepository.findById(employeeId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Empleado ${employeeId} no encontrado`);
    }
    return employee;
  }

  private assertValidYear(year: number): void {
    const currentYear = new Date().getUTCFullYear();
    if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear + 1) {
      throw new BadRequestException(
        `Año inválido: "${year}". Debe estar entre ${MIN_YEAR} y ${currentYear + 1}`,
      );
    }
  }

  private toUtcMidnight(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private maxDate(...dates: Date[]): Date {
    return dates.reduce((max, d): Date => (d > max ? d : max));
  }

  private minDate(...dates: Date[]): Date {
    return dates.reduce((min, d): Date => (d < min ? d : min));
  }
}

// Reexportado para que otros módulos (fase 2) puedan resolver el semestre anterior sin
// importar directamente el util interno — mantiene PrimaService como fachada del dominio.
export { previousPrimaHalf };
