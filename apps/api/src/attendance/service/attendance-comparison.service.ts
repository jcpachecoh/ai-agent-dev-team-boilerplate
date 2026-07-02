import { Injectable } from '@nestjs/common';

import { COLOMBIA_TZ } from '../attendance.constants';
import type {
  AttendanceComparisonPoint,
  AttendanceComparisonQuery,
  AttendanceComparisonSummary,
  AttendanceLogFull,
} from '../interfaces/attendance.interfaces';
import { AttendanceRepository } from '../repository/attendance.repository';
import {
  enumerateWorkDates,
  getTodayAnchorDate,
  resolveAttendancePeriodRange,
  resolvePreviousAttendancePeriodRange,
  workDateFromIso,
} from '../utils/period-range.util';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

@Injectable()
export class AttendanceComparisonService {
  constructor(private readonly repository: AttendanceRepository) {}

  async getComparison(
    tenantId: string,
    query: AttendanceComparisonQuery,
  ): Promise<AttendanceComparisonSummary> {
    const anchorDate = query.anchorDate ?? getTodayAnchorDate();
    const period = query.period ?? 'day';
    const currentRange = resolveAttendancePeriodRange(period, anchorDate);
    const previousRange = resolvePreviousAttendancePeriodRange(period, anchorDate);

    const locations = await this.repository.listActiveLocations(
      tenantId,
      query.locationId ? [query.locationId] : undefined,
    );
    const locationIds = locations.map((location) => location.id);

    const logs = await this.repository.listControlPanelLogs({
      tenantId,
      dateFrom: workDateFromIso(previousRange.dateFrom),
      dateTo: workDateFromIso(currentRange.dateTo),
      locationIds,
      limit: 15000,
    });

    const filteredLogs = logs.filter((log) => this.matchesEmployeeFilters(log, query));
    const currentLogs = filteredLogs.filter((log) =>
      this.isWorkDateInRange(log.workDate, currentRange.dateFrom, currentRange.dateTo),
    );
    const previousLogs = filteredLogs.filter((log) =>
      this.isWorkDateInRange(log.workDate, previousRange.dateFrom, previousRange.dateTo),
    );

    const points = this.buildPoints(period, currentRange, previousRange, currentLogs, previousLogs);
    const series = this.resolveSeriesLabels(period, currentRange, previousRange);

    return {
      period,
      anchorDate,
      dateFrom: currentRange.dateFrom,
      dateTo: currentRange.dateTo,
      previousDateFrom: previousRange.dateFrom,
      previousDateTo: previousRange.dateTo,
      series,
      points,
    };
  }

  private buildPoints(
    period: 'day' | 'week' | 'month',
    currentRange: { dateFrom: string; dateTo: string },
    previousRange: { dateFrom: string; dateTo: string },
    currentLogs: AttendanceLogFull[],
    previousLogs: AttendanceLogFull[],
  ): AttendanceComparisonPoint[] {
    if (period === 'day') {
      return Array.from({ length: 24 }, (_, hour) => ({
        label: `${String(hour).padStart(2, '0')}:00`,
        bucketKey: String(hour),
        current: this.countUniqueEmployeesByHour(currentLogs, hour),
        previous: this.countUniqueEmployeesByHour(previousLogs, hour),
      }));
    }

    const currentDates = enumerateWorkDates(currentRange.dateFrom, currentRange.dateTo);
    const previousDates = enumerateWorkDates(previousRange.dateFrom, previousRange.dateTo);

    return currentDates.map((dateIso, index) => {
      const previousDateIso = previousDates[index] ?? null;
      return {
        label: this.formatBucketDateLabel(dateIso, period, index),
        bucketKey: dateIso,
        current: this.countUniqueEmployeesByDate(currentLogs, dateIso),
        previous: previousDateIso
          ? this.countUniqueEmployeesByDate(previousLogs, previousDateIso)
          : 0,
      };
    });
  }

  private resolveSeriesLabels(
    period: 'day' | 'week' | 'month',
    currentRange: { dateFrom: string; dateTo: string },
    previousRange: { dateFrom: string; dateTo: string },
  ): AttendanceComparisonSummary['series'] {
    if (period === 'day') {
      return {
        current: { key: 'current', name: 'Hoy' },
        previous: { key: 'previous', name: 'Ayer' },
      };
    }

    if (period === 'week') {
      return {
        current: {
          key: 'current',
          name: `Semana ${this.formatShortDate(currentRange.dateFrom)} – ${this.formatShortDate(currentRange.dateTo)}`,
        },
        previous: {
          key: 'previous',
          name: `Semana ${this.formatShortDate(previousRange.dateFrom)} – ${this.formatShortDate(previousRange.dateTo)}`,
        },
      };
    }

    return {
      current: {
        key: 'current',
        name: `Mes ${this.formatMonthLabel(currentRange.dateFrom)}`,
      },
      previous: {
        key: 'previous',
        name: `Mes ${this.formatMonthLabel(previousRange.dateFrom)}`,
      },
    };
  }

  private matchesEmployeeFilters(
    log: AttendanceLogFull,
    query: AttendanceComparisonQuery,
  ): boolean {
    if (query.area && log.employee.area !== query.area) return false;
    if (query.contractType && log.employee.contractType !== query.contractType) return false;
    if (query.search) {
      const term = query.search.trim().toLowerCase();
      const employee = log.employee as AttendanceLogFull['employee'] & {
        personalData?: { nombres: string | null; primerApellido: string | null } | null;
      };
      const haystack = [
        employee.name,
        employee.user.cedula,
        employee.personalData?.nombres,
        employee.personalData?.primerApellido,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }

  private isWorkDateInRange(workDate: Date, dateFrom: string, dateTo: string): boolean {
    const iso = workDate.toISOString().slice(0, 10);
    return iso >= dateFrom && iso <= dateTo;
  }

  private countUniqueEmployeesByHour(logs: AttendanceLogFull[], hour: number): number {
    const employees = new Set<string>();
    for (const log of logs) {
      if (this.getBogotaHour(log.timestamp) === hour) {
        employees.add(log.employeeId);
      }
    }
    return employees.size;
  }

  private countUniqueEmployeesByDate(logs: AttendanceLogFull[], dateIso: string): number {
    const employees = new Set<string>();
    for (const log of logs) {
      if (log.workDate.toISOString().slice(0, 10) === dateIso) {
        employees.add(log.employeeId);
      }
    }
    return employees.size;
  }

  private getBogotaHour(timestamp: Date): number {
    return Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: COLOMBIA_TZ,
        hour: 'numeric',
        hour12: false,
      }).format(timestamp),
    );
  }

  private formatBucketDateLabel(dateIso: string, period: 'week' | 'month', index: number): string {
    const [, month, day] = dateIso.split('-');
    if (period === 'week') {
      return `${WEEKDAY_LABELS[index] ?? 'Día'} ${day}/${month}`;
    }
    return `${day}/${month}`;
  }

  private formatShortDate(dateIso: string): string {
    const [, month, day] = dateIso.split('-');
    return `${day}/${month}`;
  }

  private formatMonthLabel(dateIso: string): string {
    const [year, month] = dateIso.split('-');
    const monthName = new Intl.DateTimeFormat('es-CO', {
      month: 'short',
      timeZone: COLOMBIA_TZ,
    }).format(new Date(`${year}-${month}-15T12:00:00.000Z`));
    return `${monthName} ${year}`;
  }
}
