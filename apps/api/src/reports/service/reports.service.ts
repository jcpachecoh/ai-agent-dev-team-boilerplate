import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { AttendanceEventType, AttendanceLog, OvertimeStatus } from '@prisma/client';
import { COLOMBIA_TZ, REGULAR_DAY_MINUTES } from '../../attendance/attendance.constants';
import { AttendanceOvertimeType } from '../../payroll/payroll.constants';
import { isColombianHoliday } from './colombia-holidays.util';
import { IReportsService, ReportsActor } from '../interfaces/reports.interfaces';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import {
  AttendanceMonthSummary,
  EmployeePayrollInput,
  OvertimeMinutesEntry,
  PayrollLegalRates,
} from '../../payroll/interfaces/payroll-report.interfaces';
import { PayrollCalculationService } from '../../payroll/service/payroll-calculation.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { EmployeeWithUserAndLocation, ReportsRepository } from '../repository/reports.repository';
import { PayrollRepository } from '../../payroll/repository/payroll.repository';
import { AttendanceQueryDto, PeriodQueryDto } from '../controller/dto/report-query.dto';
import { EmployeeListExportQueryDto } from '../controller/dto/employee-list-export-query.dto';
import {
  AttendanceExportQueryDto,
  AttendanceReportStatusFilter,
} from '../controller/dto/attendance-export-query.dto';
import {
  EmployeeListReportResponseDto,
  EmployeeListRowDto,
} from '../controller/dto/employee-list-report-response.dto';
import { MAX_EXPORT_ROWS } from '../reports.constants';
import { buildAttendanceFiltersSummary } from './export-filters-summary.util';
import { OvertimeRepository } from '../../overtime/repository/overtime.repository';
import { buildEmployeeListFiltersSummary } from './export-filters-summary.util';
import {
  LocationPayrollTotalsDto,
  PayrollEmployeeRowDto,
  PayrollReportResponseDto,
  TenantPayrollTotalsDto,
} from '../controller/dto/payroll-report-response.dto';
import {
  AttendanceEmployeeRowDto,
  AttendanceReportResponseDto,
} from '../controller/dto/attendance-report-response.dto';
import {
  SocialSecurityEmployeeRowDto,
  SocialSecurityReportResponseDto,
} from '../controller/dto/social-security-report-response.dto';
import { VacationsService } from '../../vacations/service/vacations.service';
import { countApprovedVacationDaysInRange } from '../../attendance/service/vacation-attendance.guard';
import { MedicalLeavesRepository } from '../../medical-leaves/repository/medical-leaves.repository';
import { PayrollNovedadesRepository } from '../../payroll-novedades/repository/payroll-novedades.repository';
import { calculateMedicalLeaveMonthAdjustment } from '../../payroll/utils/medical-leave-payroll.utils';
import { calculatePayrollNovedadMonthAdjustment } from '../../payroll/utils/payroll-novedad-payroll.utils';

// CST art. 168: maximum 2h/day and 12h/week of extra (overtime) hours.
// These are OT-only caps — distinct from the total jornada limit (Ley 2101/2021), which is
// versioned via LaborLegalParametersService.getValueAt('JORNADA_MAX_SEMANAL', date) — OS-585.
const DAILY_OVERTIME_LIMIT_MINUTES = 120;
const WEEKLY_OVERTIME_LIMIT_MINUTES = 720;

// ── Pure helpers ─────────────────────────────────────────────────────────────

function parsePeriod(period: string): { year: number; month: number } {
  const [y, m] = period.split('-').map(Number);
  return { year: y, month: m };
}

function firstDayOfMonth(year: number, month: number): Date {
  // workDate is stored as midnight UTC for the Colombia calendar date (see normalizeWorkDate)
  return new Date(Date.UTC(year, month - 1, 1));
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function parseDateArgToUtcStart(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

function parseDateArgToUtcEnd(dateStr: string): Date {
  return new Date(dateStr + 'T23:59:59.999Z');
}

/** Parses a "YYYY-MM-DD" dateKey (see buildDayRecords) into UTC midnight for legal-parameter lookups. */
function parseCalendarDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function getBogotaHour(ts: Date): number {
  const str = new Intl.DateTimeFormat('en', {
    timeZone: COLOMBIA_TZ,
    hour: 'numeric',
    hour12: false,
    hourCycle: 'h23',
  }).format(ts);
  const h = parseInt(str, 10);
  return isNaN(h) ? 0 : h;
}

/** ISO week key for weekly overtime grouping: YYYY-Www.
 *  Uses UTC date methods because workDate is stored as UTC-midnight for the Colombia calendar date. */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Days between two UTC-midnight dates, inclusive. */
function daysBetweenInclusive(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

/**
 * Builds per-day attendance data from raw logs for one employee.
 * Only counts complete ENTRY/EXIT pairs (unpaired entries are skipped).
 *
 * Overtime classification (consumed by buildAttendanceSummary):
 * - isFestivo: true when workDate is a Colombian public holiday (Ley 51/1983)
 * - isNocturno: true when entry OR exit hour ≥ nocturnoStartHourAt(day) (HORARIO_NOCTURNO_INICIO, OS-585)
 * The combination of these two flags determines FESTIVO_DIURNO / FESTIVO_NOCTURNO / DIURNO / NOCTURNO.
 */
function buildDayRecords(
  logs: AttendanceLog[],
  nocturnoStartHourAt: (date: Date) => number,
): {
  dateKey: string;
  workedMinutes: number;
  overtimeMinutes: number;
  isNocturno: boolean;
  isFestivo: boolean;
}[] {
  const byDate = new Map<string, AttendanceLog[]>();
  for (const log of logs) {
    const key = log.workDate.toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(log);
  }

  const records: {
    dateKey: string;
    workedMinutes: number;
    overtimeMinutes: number;
    isNocturno: boolean;
    isFestivo: boolean;
  }[] = [];

  for (const [dateKey, dayLogs] of byDate.entries()) {
    const entries = dayLogs
      .filter((l) => l.eventType === AttendanceEventType.ENTRY)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const exits = dayLogs
      .filter((l) => l.eventType === AttendanceEventType.EXIT)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let dayWorkedMinutes = 0;
    let dayIsNocturno = false;
    let hasPair = false;
    const nocturnoStartHour = nocturnoStartHourAt(parseCalendarDateKey(dateKey));

    const pairCount = Math.min(entries.length, exits.length);
    for (let i = 0; i < pairCount; i++) {
      const entry = entries[i];
      const exit = exits[i];
      const durationMs = exit.timestamp.getTime() - entry.timestamp.getTime();
      if (durationMs <= 0) continue; // invalid pair — skip

      dayWorkedMinutes += Math.floor(durationMs / 60_000);
      hasPair = true;

      if (!dayIsNocturno) {
        const entryHour = getBogotaHour(entry.timestamp);
        const exitHour = getBogotaHour(exit.timestamp);
        if (entryHour >= nocturnoStartHour || exitHour >= nocturnoStartHour) {
          dayIsNocturno = true;
        }
      }
    }

    if (hasPair) {
      records.push({
        dateKey,
        workedMinutes: dayWorkedMinutes,
        overtimeMinutes: Math.max(0, dayWorkedMinutes - REGULAR_DAY_MINUTES),
        isNocturno: dayIsNocturno,
        isFestivo: isColombianHoliday(dateKey),
      });
    }
  }

  return records;
}

/**
 * Legal-rate resolvers used while building an AttendanceMonthSummary — each is called with
 * the actual calendar date the minutes were worked (OS-586), not the period's last day.
 */
export type OvertimeLegalRateResolvers = {
  nocturnoStartHourAt: (date: Date) => number;
  recargoDominicalFestivoAt: (date: Date) => number;
  recargoHoraExtraDiurnaAt: (date: Date) => number;
  recargoHoraExtraNocturnaAt: (date: Date) => number;
  /** JORNADA_MAX_SEMANAL(date) × 5 — see payroll-report.interfaces.ts OvertimeMinutesEntry. */
  monthlyHoursBaseAt: (date: Date) => number;
};

/** Adds minutes to the matching (type, monthlyHoursBase, surchargeRate) bucket, or opens a new one. */
function addOvertimeMinutes(
  entries: OvertimeMinutesEntry[],
  type: AttendanceOvertimeType,
  minutes: number,
  monthlyHoursBase: number,
  surchargeRate: number,
): void {
  const existing = entries.find(
    (e): boolean =>
      e.type === type &&
      e.monthlyHoursBase === monthlyHoursBase &&
      e.surchargeRate === surchargeRate,
  );
  if (existing) {
    existing.minutes += minutes;
  } else {
    entries.push({ type, minutes, monthlyHoursBase, surchargeRate });
  }
}

function buildAttendanceSummary(
  employeeId: string,
  logs: AttendanceLog[],
  period: { year: number; month: number },
  totalCalendarDays: number,
  vacationDays = 0,
  resolvers: OvertimeLegalRateResolvers,
): AttendanceMonthSummary {
  const dayRecords = buildDayRecords(logs, resolvers.nocturnoStartHourAt);

  const presentDays = dayRecords.length;
  const totalWorkedMinutes = dayRecords.reduce((s, r) => s + r.workedMinutes, 0);
  const regularMinutes = dayRecords.reduce(
    (s, r) => s + Math.min(r.workedMinutes, REGULAR_DAY_MINUTES),
    0,
  );
  const overtimeMinutes = dayRecords.reduce((s, r) => s + r.overtimeMinutes, 0);

  const overtimeEntries: OvertimeMinutesEntry[] = [];
  for (const r of dayRecords) {
    if (r.overtimeMinutes <= 0) continue;
    const date = parseCalendarDateKey(r.dateKey);
    // Ley 51/1983: festivo + nocturno → FESTIVO_NOCTURNO (surcharge nocturno + dominical/festivo)
    //              festivo + diurno  → FESTIVO_DIURNO  (surcharge RECARGO_DOMINICAL_FESTIVO)
    //              non-festivo       → NOCTURNO / DIURNO, surcharge RECARGO_HORA_EXTRA_*
    let type: AttendanceOvertimeType;
    let surchargeRate: number;
    if (r.isFestivo) {
      if (r.isNocturno) {
        type = AttendanceOvertimeType.FESTIVO_NOCTURNO;
        surchargeRate =
          resolvers.recargoHoraExtraNocturnaAt(date) + resolvers.recargoDominicalFestivoAt(date);
      } else {
        type = AttendanceOvertimeType.FESTIVO_DIURNO;
        surchargeRate = resolvers.recargoDominicalFestivoAt(date);
      }
    } else if (r.isNocturno) {
      type = AttendanceOvertimeType.NOCTURNO;
      surchargeRate = resolvers.recargoHoraExtraNocturnaAt(date);
    } else {
      type = AttendanceOvertimeType.DIURNO;
      surchargeRate = resolvers.recargoHoraExtraDiurnaAt(date);
    }
    const monthlyHoursBase = resolvers.monthlyHoursBaseAt(date);
    addOvertimeMinutes(overtimeEntries, type, r.overtimeMinutes, monthlyHoursBase, surchargeRate);
  }

  return {
    employeeId,
    period,
    presentDays,
    absentDays: Math.max(0, totalCalendarDays - presentDays - vacationDays),
    totalWorkedMinutes,
    regularMinutes,
    overtimeMinutes,
    overtimeEntries,
  };
}

/**
 * Returns true when any day exceeds DAILY_OVERTIME_LIMIT_MINUTES
 * or any ISO week exceeds WEEKLY_OVERTIME_LIMIT_MINUTES.
 */
function checkExceededOvertimeLimit(
  dayRecords: { dateKey: string; overtimeMinutes: number }[],
): boolean {
  for (const r of dayRecords) {
    if (r.overtimeMinutes > DAILY_OVERTIME_LIMIT_MINUTES) return true;
  }

  const weekly = new Map<string, number>();
  for (const r of dayRecords) {
    const week = isoWeekKey(new Date(r.dateKey + 'T00:00:00Z'));
    weekly.set(week, (weekly.get(week) ?? 0) + r.overtimeMinutes);
  }
  for (const total of weekly.values()) {
    if (total > WEEKLY_OVERTIME_LIMIT_MINUTES) return true;
  }

  return false;
}

function mapToPayrollEmployeeRow(
  emp: EmployeeWithUserAndLocation,
  _input: EmployeePayrollInput,
  calc: ReturnType<PayrollCalculationService['calculateEmployeePeriod']>,
): PayrollEmployeeRowDto {
  return {
    employeeId: emp.id,
    employeeName: emp.name,
    cedula: emp.user.cedula,
    locationId: emp.locationId,
    locationName: emp.location.name,
    contractType: emp.contractType,
    salaryType: emp.salaryType,
    salaryAmount: decimalToNumber(emp.salaryAmount),
    workedDays: calc.workedDays,
    calendarDays: calc.calendarDays,
    salaryBase: calc.salaryBase,
    transportSubsidy: calc.transportSubsidy,
    overtimePay: calc.overtimePay,
    overtimeBreakdown: calc.overtimeBreakdown,
    grossPay: calc.grossPay,
    healthDeduction: calc.healthDeduction,
    pensionDeduction: calc.pensionDeduction,
    incomeTaxWithholding: calc.incomeTaxWithholding,
    totalDeductions: calc.totalDeductions,
    netPay: calc.netPay,
    employerHealthContribution: calc.employerHealthContribution,
    employerPensionContribution: calc.employerPensionContribution,
    employerArlContribution: calc.employerArlContribution,
    employerSenaContribution: calc.employerSenaContribution,
    employerIcbfContribution: calc.employerIcbfContribution,
    employerCajaContribution: calc.employerCajaContribution,
    totalEmployerContributions: calc.totalEmployerContributions,
    totalPayrollCost: calc.totalPayrollCost,
    medicalLeaveEmployerDays: calc.medicalLeaveEmployerDays,
    medicalLeaveEmployerPay: calc.medicalLeaveEmployerPay,
    medicalLeaveEpsArlDays: calc.medicalLeaveEpsArlDays,
    medicalLeaveEpsArlPay: calc.medicalLeaveEpsArlPay,
    medicalLeaveOrdinaryDaysExcluded: calc.medicalLeaveOrdinaryDaysExcluded,
  };
}

function payrollPeriodKey(period: { year: number; month: number }): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

/**
 * CONN-04a — closes GAP(OS-586): only liquidate overtime when the automatic request is APROBADA.
 */
function applyOvertimeApprovalGate(
  summary: AttendanceMonthSummary,
  approvalStatus: OvertimeStatus | null | undefined,
): AttendanceMonthSummary {
  if (approvalStatus !== OvertimeStatus.APROBADA) {
    return {
      ...summary,
      overtimeMinutes: 0,
      overtimeEntries: [],
    };
  }
  return summary;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService implements IReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly payrollRepository: PayrollRepository,
    private readonly payrollCalculationService: PayrollCalculationService,
    private readonly userLocationsService: UserLocationsService,
    private readonly legalParametersService: LaborLegalParametersService,
    @Optional() private readonly vacationsService?: VacationsService,
    @Optional() private readonly medicalLeavesRepository?: MedicalLeavesRepository,
    @Optional() private readonly payrollNovedadesRepository?: PayrollNovedadesRepository,
    @Optional() private readonly overtimeRepository?: OvertimeRepository,
  ) {}

  private async countVacationDaysForEmployee(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<number> {
    if (!this.vacationsService) {
      return 0;
    }

    const ranges = await this.vacationsService.getApprovedDisfruteRanges(
      tenantId,
      employeeId,
      dateFrom,
      dateTo,
    );
    return countApprovedVacationDaysInRange(ranges, dateFrom, dateTo);
  }

  private async buildMedicalLeaveAdjustmentsByEmployee(
    tenantId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date,
    salaryByEmployeeId: Map<string, number>,
  ): Promise<Map<string, ReturnType<typeof calculateMedicalLeaveMonthAdjustment>>> {
    const adjustments = new Map<string, ReturnType<typeof calculateMedicalLeaveMonthAdjustment>>();

    if (!this.medicalLeavesRepository || employeeIds.length === 0) {
      return adjustments;
    }

    const leaves = await this.medicalLeavesRepository.findOverlappingForPayrollPeriodByEmployeeIds(
      tenantId,
      employeeIds,
      periodStart,
      periodEnd,
    );

    const leavesByEmployee = new Map<string, typeof leaves>();
    for (const leave of leaves) {
      const bucket = leavesByEmployee.get(leave.employeeId) ?? [];
      bucket.push(leave);
      leavesByEmployee.set(leave.employeeId, bucket);
    }

    for (const employeeId of employeeIds) {
      const employeeLeaves = leavesByEmployee.get(employeeId) ?? [];
      if (employeeLeaves.length === 0) {
        continue;
      }

      const salaryAmount = salaryByEmployeeId.get(employeeId) ?? 0;
      const dailySalary = salaryAmount / 30;
      adjustments.set(
        employeeId,
        calculateMedicalLeaveMonthAdjustment(employeeLeaves, periodStart, periodEnd, dailySalary),
      );
    }

    return adjustments;
  }

  private async buildPayrollNovedadAdjustmentsByEmployee(
    tenantId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date,
    salaryByEmployeeId: Map<string, number>,
  ): Promise<Map<string, ReturnType<typeof calculatePayrollNovedadMonthAdjustment>>> {
    const adjustments = new Map<
      string,
      ReturnType<typeof calculatePayrollNovedadMonthAdjustment>
    >();

    if (!this.payrollNovedadesRepository || employeeIds.length === 0) {
      return adjustments;
    }

    const novedades = await this.payrollNovedadesRepository.findApprovedForPeriodByEmployeeIds(
      tenantId,
      employeeIds,
      periodStart,
      periodEnd,
    );

    const novedadesByEmployee = new Map<string, typeof novedades>();
    for (const novedad of novedades) {
      const bucket = novedadesByEmployee.get(novedad.employeeId) ?? [];
      bucket.push(novedad);
      novedadesByEmployee.set(novedad.employeeId, bucket);
    }

    for (const employeeId of employeeIds) {
      const employeeNovedades = novedadesByEmployee.get(employeeId) ?? [];
      if (employeeNovedades.length === 0) {
        continue;
      }

      const salaryAmount = salaryByEmployeeId.get(employeeId) ?? 0;
      const dailySalary = salaryAmount / 30;
      adjustments.set(
        employeeId,
        calculatePayrollNovedadMonthAdjustment(
          employeeNovedades,
          periodStart,
          periodEnd,
          dailySalary,
        ),
      );
    }

    return adjustments;
  }

  private async resolveLocationScope(
    tenantId: string,
    actor: ReportsActor,
    requestedLocationId?: string,
  ): Promise<string[] | null> {
    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(
      tenantId,
      actor,
    );
    if (requestedLocationId) {
      this.userLocationsService.assertLocationAllowed(allowedLocationIds, requestedLocationId);
    }
    return allowedLocationIds;
  }

  // ── Payroll report ─────────────────────────────────────────────────────────

  async getPayrollReport(
    tenantId: string,
    query: PeriodQueryDto,
    actor: ReportsActor,
  ): Promise<PayrollReportResponseDto> {
    const period = parsePeriod(query.period);
    const from = firstDayOfMonth(period.year, period.month);
    const to = lastDayOfMonth(period.year, period.month);
    const calendarDays = new Date(Date.UTC(period.year, period.month, 0)).getUTCDate();

    const allowedLocationIds = await this.resolveLocationScope(tenantId, actor, query.locationId);
    const employees = await this.reportsRepository.findActiveEmployees(tenantId, {
      locationId: query.locationId,
      allowedLocationIds,
      contractType: query.contractType,
      employeeId: query.employeeId,
    });

    const employeeIds = employees.map((e) => e.id);
    const allLogs = await this.reportsRepository.findAttendanceLogsByDateRange(
      tenantId,
      from,
      to,
      employeeIds,
    );

    const logsByEmployee = groupLogsByEmployee(allLogs);

    const payrollPeriod = payrollPeriodKey(period);
    let overtimeApprovalByEmployee = new Map<string, OvertimeStatus>();
    if (this.overtimeRepository && employeeIds.length > 0) {
      const approvalRows = await this.overtimeRepository.findApprovalStatusByEmployeeIdsForPeriod(
        tenantId,
        employeeIds,
        payrollPeriod,
      );
      overtimeApprovalByEmployee = new Map(
        approvalRows.map((row) => [row.employeeId, row.status as OvertimeStatus]),
      );
    }

    // Preload once per report run (not per employee) — see LegalParameterSnapshot.
    const legalSnapshot = await this.legalParametersService.preload(
      [
        'SMLV',
        'AUXILIO_TRANSPORTE',
        'RECARGO_DOMINICAL_FESTIVO',
        'HORARIO_NOCTURNO_INICIO',
        'RECARGO_HORA_EXTRA_DIURNA',
        'RECARGO_HORA_EXTRA_NOCTURNA',
        'JORNADA_MAX_SEMANAL',
      ],
      from,
      to,
      tenantId,
    );
    // Overtime surcharges and the hourly-rate divisor vary by the date the minutes were
    // actually worked (OS-586) — e.g. JORNADA_MAX_SEMANAL steps down on July 15, which does
    // not align to a calendar-month period boundary. Resolved per work-day inside
    // buildAttendanceSummary, NOT once here for the whole period.
    const rateResolvers: OvertimeLegalRateResolvers = {
      nocturnoStartHourAt: (date: Date): number =>
        legalSnapshot.numberAt('HORARIO_NOCTURNO_INICIO', date),
      recargoDominicalFestivoAt: (date: Date): number =>
        legalSnapshot.numberAt('RECARGO_DOMINICAL_FESTIVO', date),
      recargoHoraExtraDiurnaAt: (date: Date): number =>
        legalSnapshot.numberAt('RECARGO_HORA_EXTRA_DIURNA', date),
      recargoHoraExtraNocturnaAt: (date: Date): number =>
        legalSnapshot.numberAt('RECARGO_HORA_EXTRA_NOCTURNA', date),
      monthlyHoursBaseAt: (date: Date): number =>
        legalSnapshot.numberAt('JORNADA_MAX_SEMANAL', date) * 5,
    };
    // smlv/transportSubsidy/transportSubsidyThreshold stay flat per period (resolved once,
    // as of the period's last day) because SMLV and AUXILIO_TRANSPORTE have annual vigencias
    // that always start January 1st — a boundary that already aligns with a calendar-month
    // payroll period, so there is no mid-period cutover to miss. Recargos and JORNADA_MAX_SEMANAL
    // are different: their vigencias can start mid-month (e.g. July 15, December 25), so they
    // are resolved per work-day date instead — see rateResolvers / OvertimeMinutesEntry above.
    const smlv = legalSnapshot.numberAt('SMLV', to);
    const legalRates: PayrollLegalRates = {
      smlv,
      transportSubsidyThreshold: smlv * 2,
      transportSubsidy: legalSnapshot.numberAt('AUXILIO_TRANSPORTE', to),
    };

    const rows: PayrollEmployeeRowDto[] = [];

    const salaryByEmployeeId = new Map(
      employees.map((emp) => [emp.id, decimalToNumber(emp.salaryAmount)]),
    );
    const medicalLeaveAdjustments = await this.buildMedicalLeaveAdjustmentsByEmployee(
      tenantId,
      employeeIds,
      from,
      to,
      salaryByEmployeeId,
    );
    const payrollNovedadAdjustments = await this.buildPayrollNovedadAdjustmentsByEmployee(
      tenantId,
      employeeIds,
      from,
      to,
      salaryByEmployeeId,
    );

    for (const emp of employees) {
      const empLogs = logsByEmployee.get(emp.id) ?? [];
      const vacationDays = await this.countVacationDaysForEmployee(tenantId, emp.id, from, to);
      const attendance = buildAttendanceSummary(
        emp.id,
        empLogs,
        period,
        calendarDays,
        vacationDays,
        rateResolvers,
      );
      const gatedAttendance = applyOvertimeApprovalGate(
        attendance,
        overtimeApprovalByEmployee.get(emp.id) ?? null,
      );

      const medicalLeave = medicalLeaveAdjustments.get(emp.id);
      const payrollNovedad = payrollNovedadAdjustments.get(emp.id);

      const input: EmployeePayrollInput = {
        employeeId: emp.id,
        userId: emp.userId,
        tenantId: emp.tenantId,
        locationId: emp.locationId,
        contractType: emp.contractType,
        salaryType: emp.salaryType,
        salaryAmount: decimalToNumber(emp.salaryAmount),
        hasTransportSubsidy: emp.hasTransportSubsidy,
        arlRiskLevel: emp.arlRiskLevel,
        medicalLeaveEmployerDays: medicalLeave?.medicalLeaveEmployerDays ?? 0,
        medicalLeaveEmployerPay: medicalLeave?.medicalLeaveEmployerPay ?? 0,
        medicalLeaveEpsArlDays: medicalLeave?.medicalLeaveEpsArlDays ?? 0,
        medicalLeaveEpsArlPay: medicalLeave?.medicalLeaveEpsArlPay ?? 0,
        medicalLeaveOrdinaryDaysExcluded: medicalLeave?.medicalLeaveOrdinaryDaysExcluded ?? 0,
        payrollNovedadUnpaidDays: payrollNovedad?.payrollNovedadUnpaidDays ?? 0,
        payrollNovedadUnpaidDeduction: payrollNovedad?.payrollNovedadUnpaidDeduction ?? 0,
        payrollNovedadPaidDays: payrollNovedad?.payrollNovedadPaidDays ?? 0,
      };

      const calc = this.payrollCalculationService.calculateEmployeePeriod(
        input,
        gatedAttendance,
        legalRates,
      );
      rows.push(mapToPayrollEmployeeRow(emp, input as EmployeePayrollInput, calc));
    }

    const tenantTotals = computeTenantTotals(rows);
    const locationTotals = computeLocationTotals(rows);

    return { tenantId, period, employees: rows, tenantTotals, locationTotals };
  }

  // ── Attendance report ──────────────────────────────────────────────────────

  async getAttendanceReport(
    tenantId: string,
    query: AttendanceQueryDto,
    actor: ReportsActor,
  ): Promise<AttendanceReportResponseDto> {
    if (query.from > query.to) {
      throw new BadRequestException('from must be before or equal to to');
    }

    const from = parseDateArgToUtcStart(query.from);
    const to = parseDateArgToUtcEnd(query.to);
    const calendarDays = daysBetweenInclusive(
      parseDateArgToUtcStart(query.from),
      parseDateArgToUtcStart(query.to),
    );

    const allowedLocationIds = await this.resolveLocationScope(tenantId, actor, query.locationId);
    let employees = await this.reportsRepository.findActiveEmployees(tenantId, {
      locationId: query.locationId,
      allowedLocationIds,
      employeeId: query.employeeId,
    });

    const employeeIds = employees.map((e) => e.id);
    const allLogs = await this.reportsRepository.findAttendanceLogsByDateRange(
      tenantId,
      from,
      to,
      employeeIds,
    );

    const logsByEmployee = groupLogsByEmployee(allLogs);

    // Dummy period for AttendanceMonthSummary (informational only in attendance report)
    const [year, month] = query.from.split('-').map(Number);

    const legalSnapshot = await this.legalParametersService.preload(
      ['HORARIO_NOCTURNO_INICIO'],
      from,
      to,
      tenantId,
    );
    const nocturnoStartHourAt = (date: Date): number =>
      legalSnapshot.numberAt('HORARIO_NOCTURNO_INICIO', date);

    let rows: AttendanceEmployeeRowDto[] = await Promise.all(
      employees.map(async (emp) => {
        const empLogs = logsByEmployee.get(emp.id) ?? [];
        const dayRecords = buildDayRecords(empLogs, nocturnoStartHourAt);

        const totalWorkedMinutes = dayRecords.reduce((s, r) => s + r.workedMinutes, 0);
        const regularMinutes = dayRecords.reduce(
          (s, r) => s + Math.min(r.workedMinutes, REGULAR_DAY_MINUTES),
          0,
        );
        const overtimeMinutes = dayRecords.reduce((s, r) => s + r.overtimeMinutes, 0);
        const activeDays = dayRecords.length;
        const vacationDays = await this.countVacationDaysForEmployee(tenantId, emp.id, from, to);

        return {
          employeeId: emp.id,
          employeeName: emp.name,
          cedula: emp.user.cedula,
          locationId: emp.locationId,
          locationName: emp.location.name,
          totalWorkedMinutes,
          regularMinutes,
          overtimeMinutes,
          activeDays,
          absentDays: Math.max(0, calendarDays - activeDays - vacationDays),
          exceededLegalOvertimeLimit: checkExceededOvertimeLimit(dayRecords),
        };
      }),
    );

    rows = this.filterAttendanceRows(rows, query.status);

    return { tenantId, from: query.from, to: query.to, employees: rows };
  }

  async getAttendanceReportForExport(
    tenantId: string,
    query: Omit<AttendanceExportQueryDto, 'format'>,
    actor: ReportsActor,
  ): Promise<AttendanceReportResponseDto> {
    const report = await this.getAttendanceReport(tenantId, query, actor);
    const rowCount = report.employees.length;
    if (rowCount > MAX_EXPORT_ROWS) {
      throw new BadRequestException(
        `La exportación supera el límite de ${MAX_EXPORT_ROWS} filas (${rowCount}). Ajusta los filtros.`,
      );
    }
    return report;
  }

  async getEmployeeListReport(
    tenantId: string,
    query: Omit<EmployeeListExportQueryDto, 'format'>,
    actor: ReportsActor,
  ): Promise<EmployeeListReportResponseDto> {
    const allowedLocationIds = await this.resolveLocationScope(tenantId, actor, query.locationId);

    if (query.employeeId) {
      const employee = await this.payrollRepository.findById(query.employeeId);
      if (!employee || employee.tenantId !== tenantId) {
        throw new NotFoundException('Empleado no encontrado');
      }
    }

    const filters = {
      tenantId,
      allowedLocationIds,
      locationId: query.locationId,
      employeeId: query.employeeId,
      positionId: query.positionId,
      area: query.area,
      department: query.department,
      contractType: query.contractType,
      isActive: query.isActive,
      search: query.search,
      includeInactive: true,
    };

    const rowCount = await this.payrollRepository.count(filters);
    if (rowCount > MAX_EXPORT_ROWS) {
      throw new BadRequestException(
        `La exportación supera el límite de ${MAX_EXPORT_ROWS} filas (${rowCount}). Ajusta los filtros.`,
      );
    }

    const employees = await this.payrollRepository.findAll({
      ...filters,
      limit: MAX_EXPORT_ROWS,
      offset: 0,
    });

    const rows: EmployeeListRowDto[] = employees.map((employee) => ({
      employeeId: employee.id,
      name: employee.name,
      cedula: employee.user.cedula,
      email: employee.user.email,
      position: employee.position,
      area: employee.area,
      department: employee.department,
      contractType: employee.contractType,
      locationId: employee.locationId,
      locationName: employee.location?.name ?? employee.locationId,
      hireDate: employee.hireDate.toISOString().slice(0, 10),
      contractStart: employee.contractStart
        ? employee.contractStart.toISOString().slice(0, 10)
        : null,
      contractEnd: employee.contractEnd ? employee.contractEnd.toISOString().slice(0, 10) : null,
      salaryAmount: decimalToNumber(employee.salaryAmount),
      isActive: employee.isActive,
    }));

    return {
      tenantId,
      filtersSummary: buildEmployeeListFiltersSummary(query),
      employees: rows,
    };
  }

  private filterAttendanceRows(
    rows: AttendanceEmployeeRowDto[],
    status?: AttendanceReportStatusFilter,
  ): AttendanceEmployeeRowDto[] {
    if (!status || status === AttendanceReportStatusFilter.ALL) {
      return rows;
    }
    if (status === AttendanceReportStatusFilter.PRESENT) {
      return rows.filter((row) => row.totalWorkedMinutes > 0);
    }
    if (status === AttendanceReportStatusFilter.ABSENT) {
      return rows.filter((row) => row.totalWorkedMinutes === 0);
    }
    return rows.filter((row) => row.exceededLegalOvertimeLimit);
  }

  // ── Social security report ─────────────────────────────────────────────────

  async getSocialSecurityReport(
    tenantId: string,
    query: PeriodQueryDto,
    actor: ReportsActor,
  ): Promise<SocialSecurityReportResponseDto> {
    // Reuse payroll calculation; extract only employer contribution fields
    const payrollReport = await this.getPayrollReport(tenantId, query, actor);

    const employees: SocialSecurityEmployeeRowDto[] = payrollReport.employees.map((row) => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      cedula: row.cedula,
      locationId: row.locationId,
      locationName: row.locationName,
      contractType: row.contractType,
      salaryBase: row.salaryBase,
      healthEmployer: row.employerHealthContribution,
      pensionEmployer: row.employerPensionContribution,
      arlEmployer: row.employerArlContribution,
      senaEmployer: row.employerSenaContribution,
      icbfEmployer: row.employerIcbfContribution,
      compensationFundEmployer: row.employerCajaContribution,
      totalEmployerContribution: row.totalEmployerContributions,
    }));

    const totalPILAContribution = employees.reduce((s, r) => s + r.totalEmployerContribution, 0);

    return { tenantId, period: payrollReport.period, employees, totalPILAContribution };
  }
}

// ── Module-level aggregation helpers ─────────────────────────────────────────

function groupLogsByEmployee(logs: AttendanceLog[]): Map<string, AttendanceLog[]> {
  const map = new Map<string, AttendanceLog[]>();
  for (const log of logs) {
    if (!map.has(log.employeeId)) map.set(log.employeeId, []);
    map.get(log.employeeId)!.push(log);
  }
  return map;
}

function computeTenantTotals(rows: PayrollEmployeeRowDto[]): TenantPayrollTotalsDto {
  return {
    employeeCount: rows.length,
    totalGrossPay: rows.reduce((s, r) => s + r.grossPay, 0),
    totalDeductions: rows.reduce((s, r) => s + r.totalDeductions, 0),
    totalNetPay: rows.reduce((s, r) => s + r.netPay, 0),
    totalEmployerContributions: rows.reduce((s, r) => s + r.totalEmployerContributions, 0),
    totalPayrollCost: rows.reduce((s, r) => s + r.totalPayrollCost, 0),
  };
}

function computeLocationTotals(rows: PayrollEmployeeRowDto[]): LocationPayrollTotalsDto[] {
  const byLocation = new Map<string, { locationName: string; rows: PayrollEmployeeRowDto[] }>();

  for (const row of rows) {
    if (!byLocation.has(row.locationId)) {
      byLocation.set(row.locationId, { locationName: row.locationName, rows: [] });
    }
    byLocation.get(row.locationId)!.rows.push(row);
  }

  return Array.from(byLocation.entries()).map(([locationId, { locationName, rows: locRows }]) => ({
    locationId,
    locationName,
    employeeCount: locRows.length,
    totalNetPay: locRows.reduce((s, r) => s + r.netPay, 0),
    totalEmployerContributions: locRows.reduce((s, r) => s + r.totalEmployerContributions, 0),
    totalPayrollCost: locRows.reduce((s, r) => s + r.totalPayrollCost, 0),
  }));
}
