import { Injectable } from '@nestjs/common';
import { AttendanceEventType } from '@prisma/client';
import type {
  AttendanceLogFull,
  ControlPanelAlert,
  ControlPanelQuery,
  ControlPanelSummary,
  ControlPanelTimelineRow,
} from '../interfaces/attendance.interfaces';
import { AttendanceRepository } from '../repository/attendance.repository';
import { calculateDaySummary } from '../utils/attendance-calculation.util';
import { resolveClasificacionFilter } from '../utils/clasificacion.util';
import {
  getTodayAnchorDate,
  isLiveAttendancePeriod,
  resolveAttendancePeriodRange,
  workDateFromIso,
} from '../utils/period-range.util';

const PUBLIC_STORAGE_DOMAIN = (): string => {
  const raw = process.env.R2_PUBLIC_DOMAIN ?? '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;
};

type EnrichedEmployee = AttendanceLogFull['employee'] & {
  personalData?: {
    nombres: string | null;
    primerApellido: string | null;
    segundoApellido: string | null;
  } | null;
  photoStorageObject?: { key: string } | null;
};

@Injectable()
export class AttendanceControlPanelService {
  constructor(private readonly repository: AttendanceRepository) {}

  async getControlPanel(
    tenantId: string,
    userId: string,
    query: ControlPanelQuery,
  ): Promise<ControlPanelSummary> {
    const anchorDate = query.anchorDate ?? getTodayAnchorDate();
    const period = query.period ?? 'day';
    const laborClassifications = resolveClasificacionFilter(query.clasificacion);
    const tenantName = await this.repository.findTenantLabel(tenantId);
    const locations = await this.repository.listActiveLocations(
      tenantId,
      query.locationId ? [query.locationId] : undefined,
    );
    const locationIds = locations.map((location) => location.id);

    const dayRange = resolveAttendancePeriodRange('day', anchorDate);
    const timelineRange = resolveAttendancePeriodRange(period, anchorDate);

    const dayLogs = await this.repository.listControlPanelLogs({
      tenantId,
      dateFrom: workDateFromIso(dayRange.dateFrom),
      dateTo: workDateFromIso(dayRange.dateTo),
      locationIds,
      laborClassifications,
      limit: 5000,
    });

    const timelineLogs =
      period === 'day'
        ? dayLogs
        : await this.repository.listControlPanelLogs({
            tenantId,
            dateFrom: workDateFromIso(timelineRange.dateFrom),
            dateTo: workDateFromIso(timelineRange.dateTo),
            locationIds,
            laborClassifications,
            limit: 10000,
          });

    const monthRange = resolveAttendancePeriodRange('month', anchorDate);
    const monthLogs = await this.repository.listControlPanelLogs({
      tenantId,
      dateFrom: workDateFromIso(monthRange.dateFrom),
      dateTo: workDateFromIso(monthRange.dateTo),
      locationIds,
      laborClassifications,
      limit: 10000,
    });

    const mobileLogsDay = await this.repository.listMobileLogsForDay(
      tenantId,
      workDateFromIso(dayRange.dateFrom),
      locationIds,
      laborClassifications,
    );
    const mobileLogsForTimeline =
      period === 'day'
        ? mobileLogsDay
        : await this.repository.listMobileLogsForRange(
            tenantId,
            workDateFromIso(timelineRange.dateFrom),
            workDateFromIso(timelineRange.dateTo),
            locationIds,
            laborClassifications,
          );

    const latestMobileByEmployee = new Map<string, (typeof mobileLogsForTimeline)[number]>();
    for (const log of mobileLogsForTimeline) {
      const current = latestMobileByEmployee.get(log.employeeId);
      if (!current || log.timestamp > current.timestamp) {
        latestMobileByEmployee.set(log.employeeId, log);
      }
    }

    const latestDayMobileByEmployee = new Map<string, (typeof mobileLogsDay)[number]>();
    for (const log of mobileLogsDay) {
      const current = latestDayMobileByEmployee.get(log.employeeId);
      if (!current || log.timestamp > current.timestamp) {
        latestDayMobileByEmployee.set(log.employeeId, log);
      }
    }

    const dayLastLogByEmployee = new Map<string, AttendanceLogFull>();
    for (const log of dayLogs) {
      const current = dayLastLogByEmployee.get(log.employeeId);
      if (!current || log.timestamp > current.timestamp) {
        dayLastLogByEmployee.set(log.employeeId, log);
      }
    }

    const lastLogByEmployee = new Map<string, AttendanceLogFull>();
    for (const log of timelineLogs) {
      const current = lastLogByEmployee.get(log.employeeId);
      if (!current || log.timestamp > current.timestamp) {
        lastLogByEmployee.set(log.employeeId, log);
      }
    }

    const logsByEmployeeDay = new Map<string, AttendanceLogFull[]>();
    for (const log of monthLogs) {
      const key = `${log.employeeId}:${log.workDate.toISOString().slice(0, 10)}`;
      const bucket = logsByEmployeeDay.get(key) ?? [];
      bucket.push(log);
      logsByEmployeeDay.set(key, bucket);
    }

    let overtimeMinutesMonth = 0;
    for (const bucket of logsByEmployeeDay.values()) {
      const summary = calculateDaySummary(bucket, new Date());
      overtimeMinutesMonth += summary.overtimeMinutes;
    }

    const workingNow = Array.from(dayLastLogByEmployee.values()).filter(
      (log) => log.eventType === AttendanceEventType.ENTRY,
    ).length;
    const attendanceToday = dayLastLogByEmployee.size;

    const rows = Array.from(lastLogByEmployee.values())
      .map((log) => this.toTimelineRow(log, latestMobileByEmployee.get(log.employeeId)))
      .filter((row) => this.matchesFilters(row, query));

    const sortedRows = this.sortRows(rows, query.sortBy, query.sortDir);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const paginated = sortedRows.slice(start, start + pageSize);

    const filterOptions = this.buildFilterOptions(timelineLogs);
    const alerts = this.buildAlerts(dayLogs, mobileLogsDay, latestDayMobileByEmployee);
    const dismissedAlertKeys = await this.repository.listDismissedAlertKeys(tenantId, userId);
    const visibleAlerts = alerts.filter((alert) => !dismissedAlertKeys.has(alert.id));

    return {
      anchorDate,
      period,
      dateFrom: timelineRange.dateFrom,
      dateTo: timelineRange.dateTo,
      tenantName,
      isLive: isLiveAttendancePeriod(period, anchorDate),
      clasificacion: query.clasificacion,
      metrics: {
        workingNow,
        attendanceToday,
        tenantAttendanceToday: attendanceToday,
        overtimeHoursMonth: Math.round((overtimeMinutesMonth / 60) * 10) / 10,
      },
      timeline: {
        items: paginated,
        total: sortedRows.length,
        page,
        pageSize,
      },
      alerts: visibleAlerts,
      filters: {
        areas: filterOptions.areas,
        contractTypes: filterOptions.contractTypes,
        locations: locations.map((location) => ({ id: location.id, name: location.name })),
      },
    };
  }

  async dismissAlert(
    tenantId: string,
    userId: string,
    alertKey: string,
  ): Promise<{ alertKey: string; dismissedAt: string }> {
    const record = await this.repository.dismissAlert(tenantId, userId, alertKey);
    return { alertKey: record.alertKey, dismissedAt: record.dismissedAt.toISOString() };
  }

  private toTimelineRow(
    log: AttendanceLogFull,
    mobileLog?: {
      clientLatitude: number;
      clientLongitude: number;
      status: string;
      distanceMeters: number | null;
    },
  ): ControlPanelTimelineRow {
    const employee = log.employee as EnrichedEmployee;
    const names = this.resolveNames(employee);
    const domain = PUBLIC_STORAGE_DOMAIN();
    const photoKey = employee.photoStorageObject?.key;
    const photoUrl = domain && photoKey ? `${domain}/${photoKey}` : null;

    return {
      employeeId: log.employeeId,
      userId: employee.userId,
      photoUrl,
      documentNumber: employee.user.cedula,
      primerApellido: names.primerApellido,
      nombres: names.nombres,
      especialidad: employee.position,
      area: employee.area,
      contrato: employee.contractType,
      locationId: log.locationId,
      locationName: log.location.name,
      lastRecordAt: log.timestamp.toISOString(),
      lastEventType: log.eventType,
      latitude: mobileLog?.clientLatitude ?? null,
      longitude: mobileLog?.clientLongitude ?? null,
      hasGeo: Boolean(mobileLog),
      isOutOfGeofence: mobileLog?.status === 'REJECTED',
    };
  }

  private resolveNames(employee: EnrichedEmployee): {
    nombres: string | null;
    primerApellido: string | null;
  } {
    if (employee.personalData?.nombres || employee.personalData?.primerApellido) {
      return {
        nombres: employee.personalData.nombres ?? null,
        primerApellido: employee.personalData.primerApellido ?? null,
      };
    }

    const parts = employee.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { nombres: null, primerApellido: null };
    if (parts.length === 1) return { nombres: parts[0]!, primerApellido: null };
    if (parts.length === 2) return { nombres: parts[0]!, primerApellido: parts[1]! };
    return {
      nombres: parts.slice(0, -2).join(' '),
      primerApellido: parts.at(-2) ?? null,
    };
  }

  private matchesFilters(row: ControlPanelTimelineRow, query: ControlPanelQuery): boolean {
    if (query.area && row.area !== query.area) return false;
    if (query.contractType && row.contrato !== query.contractType) return false;
    if (query.search) {
      const term = query.search.trim().toLowerCase();
      const haystack = [row.nombres, row.primerApellido, row.documentNumber, row.especialidad]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  }

  private sortRows(
    rows: ControlPanelTimelineRow[],
    sortBy?: string,
    sortDir: 'asc' | 'desc' = 'desc',
  ): ControlPanelTimelineRow[] {
    const direction = sortDir === 'asc' ? 1 : -1;
    const key = (sortBy ?? 'lastRecordAt') as keyof ControlPanelTimelineRow;

    return [...rows].sort((left, right) => {
      const leftValue = left[key];
      const rightValue = right[key];
      if (typeof leftValue === 'string' && typeof rightValue === 'string') {
        return leftValue.localeCompare(rightValue, 'es') * direction;
      }
      return 0;
    });
  }

  private buildFilterOptions(logs: AttendanceLogFull[]) {
    const areas = new Set<string>();
    const contractTypes = new Set<string>();
    for (const log of logs) {
      areas.add(log.employee.area);
      contractTypes.add(log.employee.contractType);
    }
    return {
      areas: Array.from(areas).sort((a, b) => a.localeCompare(b, 'es')),
      contractTypes: Array.from(contractTypes).sort((a, b) => a.localeCompare(b, 'es')),
    };
  }

  private buildAlerts(
    dayLogs: AttendanceLogFull[],
    mobileLogs: Awaited<ReturnType<AttendanceRepository['listMobileLogsForDay']>>,
    latestMobileByEmployee: Map<string, (typeof mobileLogs)[number]>,
  ): ControlPanelAlert[] {
    const alerts: ControlPanelAlert[] = [];

    for (const mobileLog of mobileLogs) {
      if (mobileLog.status === 'REJECTED') {
        alerts.push({
          id: `geo-${mobileLog.id}`,
          type: 'geofence',
          title: `${mobileLog.employee.name} registró fuera de geocerca`,
          subtitle: `${mobileLog.location.name} · ${Math.round(mobileLog.distanceMeters ?? 0)} m fuera del radio`,
          generatedAt: mobileLog.timestamp.toISOString(),
          employeeId: mobileLog.employeeId,
          employeeName: mobileLog.employee.name,
        });
      }
    }

    for (const log of dayLogs) {
      if (log.eventType === AttendanceEventType.EXIT) continue;
      const mobile = latestMobileByEmployee.get(log.employeeId);
      if (!mobile) {
        alerts.push({
          id: `no-geo-${log.id}`,
          type: 'no-geo',
          title: `${log.employee.name} sin geolocalización`,
          subtitle: `${log.location.name} · marcación desde kiosko`,
          generatedAt: log.timestamp.toISOString(),
          employeeId: log.employeeId,
          employeeName: log.employee.name,
        });
      }
    }

    return alerts
      .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt))
      .slice(0, 50);
  }
}
