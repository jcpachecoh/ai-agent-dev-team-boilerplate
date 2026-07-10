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
  CesantiasCalculateForYearResult,
  CesantiasSkippedEmployee,
  ICesantiasService,
} from '../interfaces/cesantias-service.interfaces';
import {
  CesantiasLiquidationRecord,
  UpsertCesantiasLiquidationData,
} from '../interfaces/cesantias.interfaces';
import { CesantiasRepository } from '../repository/cesantias.repository';
import { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import { PayrollRepository } from '../repository/payroll.repository';
import { resolveFundAtDate, resolveSalarySegments } from '../utils/cesantias-days.util';

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
 */
const CESANTIAS_EXEMPT_CONTRACT_TYPES = new Set<EmployeeContractType>([
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

  async listByYear(
    tenantId: string,
    year: number | undefined,
    pagination: { limit?: number; offset?: number },
  ): Promise<{ items: CesantiasLiquidationRecord[]; total: number }> {
    const filters = { tenantId, year, limit: pagination.limit, offset: pagination.offset };
    const [items, total] = await Promise.all([
      this.cesantiasRepository.findByTenantAndYear(filters),
      this.cesantiasRepository.countByTenantAndYear(filters),
    ]);
    return { items, total };
  }

  async getDetail(tenantId: string, id: string): Promise<CesantiasLiquidationRecord> {
    const record = await this.cesantiasRepository.findById(tenantId, id);
    if (!record) {
      throw new NotFoundException(`Liquidación de cesantías "${id}" no encontrada`);
    }
    return record;
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
