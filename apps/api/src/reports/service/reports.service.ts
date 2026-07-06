import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceEventType, AttendanceLog } from '@prisma/client';
import {
  COLOMBIA_TZ,
  NOCTURNO_START_HOUR,
  REGULAR_DAY_MINUTES,
} from '../../attendance/attendance.constants';
import { AttendanceOvertimeType } from '../../payroll/payroll.constants';
import { isColombianHoliday } from './colombia-holidays.util';
import { IReportsService, ReportsActor } from '../interfaces/reports.interfaces';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import {
  AttendanceMonthSummary,
  EmployeePayrollInput,
} from '../../payroll/interfaces/payroll-report.interfaces';
import { PayrollCalculationService } from '../../payroll/service/payroll-calculation.service';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { EmployeeWithUserAndLocation, ReportsRepository } from '../repository/reports.repository';
import { AttendanceQueryDto, PeriodQueryDto } from '../controller/dto/report-query.dto';
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

// CST art. 168: maximum 2h/day and 12h/week of extra (overtime) hours.
// These are OT-only caps — distinct from total jornada limit (Ley 2101/2021, see getMaxWeeklyMinutesForYear).
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
 * - isNocturno: true when entry OR exit hour ≥ NOCTURNO_START_HOUR (21:00 Colombia)
 * The combination of these two flags determines FESTIVO_DIURNO / FESTIVO_NOCTURNO / DIURNO / NOCTURNO.
 */
function buildDayRecords(logs: AttendanceLog[]): {
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
        if (entryHour >= NOCTURNO_START_HOUR || exitHour >= NOCTURNO_START_HOUR) {
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

function buildAttendanceSummary(
  employeeId: string,
  logs: AttendanceLog[],
  period: { year: number; month: number },
  totalCalendarDays: number,
): AttendanceMonthSummary {
  const dayRecords = buildDayRecords(logs);

  const presentDays = dayRecords.length;
  const totalWorkedMinutes = dayRecords.reduce((s, r) => s + r.workedMinutes, 0);
  const regularMinutes = dayRecords.reduce(
    (s, r) => s + Math.min(r.workedMinutes, REGULAR_DAY_MINUTES),
    0,
  );
  const overtimeMinutes = dayRecords.reduce((s, r) => s + r.overtimeMinutes, 0);

  const overtimeByType: Partial<Record<AttendanceOvertimeType, number>> = {};
  for (const r of dayRecords) {
    if (r.overtimeMinutes <= 0) continue;
    // Ley 51/1983: festivo + nocturno → FESTIVO_NOCTURNO (surcharge 1.50, CST art. 168+179)
    //              festivo + diurno  → FESTIVO_DIURNO  (surcharge 0.75, CST art. 179)
    //              non-festivo       → NOCTURNO / DIURNO as before
    let type: AttendanceOvertimeType;
    if (r.isFestivo) {
      type = r.isNocturno
        ? AttendanceOvertimeType.FESTIVO_NOCTURNO
        : AttendanceOvertimeType.FESTIVO_DIURNO;
    } else {
      type = r.isNocturno ? AttendanceOvertimeType.NOCTURNO : AttendanceOvertimeType.DIURNO;
    }
    overtimeByType[type] = (overtimeByType[type] ?? 0) + r.overtimeMinutes;
  }

  return {
    employeeId,
    period,
    presentDays,
    absentDays: Math.max(0, totalCalendarDays - presentDays),
    totalWorkedMinutes,
    regularMinutes,
    overtimeMinutes,
    overtimeByType,
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
  };
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ReportsService implements IReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly payrollCalculationService: PayrollCalculationService,
    private readonly userLocationsService: UserLocationsService,
  ) {}

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

    const rows: PayrollEmployeeRowDto[] = [];

    for (const emp of employees) {
      const empLogs = logsByEmployee.get(emp.id) ?? [];
      const attendance = buildAttendanceSummary(emp.id, empLogs, period, calendarDays);

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
      };

      const calc = this.payrollCalculationService.calculateEmployeePeriod(input, attendance);
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
    const employees = await this.reportsRepository.findActiveEmployees(tenantId, {
      locationId: query.locationId,
      allowedLocationIds,
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

    const rows: AttendanceEmployeeRowDto[] = employees.map((emp) => {
      const empLogs = logsByEmployee.get(emp.id) ?? [];
      const dayRecords = buildDayRecords(empLogs);

      const totalWorkedMinutes = dayRecords.reduce((s, r) => s + r.workedMinutes, 0);
      const regularMinutes = dayRecords.reduce(
        (s, r) => s + Math.min(r.workedMinutes, REGULAR_DAY_MINUTES),
        0,
      );
      const overtimeMinutes = dayRecords.reduce((s, r) => s + r.overtimeMinutes, 0);
      const activeDays = dayRecords.length;

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
        absentDays: Math.max(0, calendarDays - activeDays),
        exceededLegalOvertimeLimit: checkExceededOvertimeLimit(dayRecords),
      };
    });

    return { tenantId, from: query.from, to: query.to, employees: rows };
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
