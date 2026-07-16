import { Injectable } from '@nestjs/common';
import { AttendanceEventType, AttendanceLogSource } from '@prisma/client';
import type {
  AttendanceActingUser,
  AttendanceLogFull,
  ControlPanelAlert,
  ControlPanelQuery,
  ControlPanelSummary,
  ControlPanelTimelineRow,
} from '../interfaces/attendance.interfaces';
import { AttendanceRepository } from '../repository/attendance.repository';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { sumOvertimeScopeMinutes } from '../utils/attendance-calculation.util';
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
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly userLocationsService: UserLocationsService,
    private readonly legalParametersService: LaborLegalParametersService,
  ) {}

  async getControlPanel(
    tenantId: string,
    userId: string,
    query: ControlPanelQuery,
    actor: AttendanceActingUser,
  ): Promise<ControlPanelSummary> {
    const anchorDate = query.anchorDate ?? getTodayAnchorDate();
    const period = query.period ?? 'day';
    const laborClassifications = resolveClasificacionFilter(query.clasificacion);
    const tenantName = await this.repository.findTenantLabel(tenantId);
    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(tenantId, {
      userId: actor.sub,
      roleCode: actor.roleCode,
    });
    if (query.locationId) {
      this.userLocationsService.assertLocationAllowed(allowedLocationIds, query.locationId);
    }
    const locations = await this.repository.listActiveLocations(
      tenantId,
      query.locationId ? [query.locationId] : (allowedLocationIds ?? undefined),
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

    // Month HE metric: only explicit OVERTIME markingScope pairs (CONN-11 payable time).
    let overtimeMinutesMonth = 0;
    for (const bucket of logsByEmployeeDay.values()) {
      overtimeMinutesMonth += sumOvertimeScopeMinutes(bucket);
    }

    const workingNow = Array.from(dayLastLogByEmployee.values()).filter(
      (log) => log.eventType === AttendanceEventType.ENTRY,
    ).length;
    const attendanceToday = dayLastLogByEmployee.size;

    const rows = Array.from(lastLogByEmployee.values())
      .map((log) => this.toTimelineRow(log))
      .filter((row) => this.matchesFilters(row, query));

    const sortedRows = this.sortRows(rows, query.sortBy, query.sortDir);
    const page = Math.max(1, query.page ?? 1);
    const pageSize = query.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const paginated = sortedRows.slice(start, start + pageSize);

    const filterOptions = this.buildFilterOptions(timelineLogs);
    const alerts = this.buildAlerts(dayLogs);
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

  private toTimelineRow(log: AttendanceLogFull): ControlPanelTimelineRow {
    const employee = log.employee as EnrichedEmployee;
    const names = this.resolveNames(employee);
    const domain = PUBLIC_STORAGE_DOMAIN();
    const photoKey = employee.photoStorageObject?.key;
    const photoUrl = domain && photoKey ? `${domain}/${photoKey}` : null;
    const hasGeo = log.clientLatitude != null && log.clientLongitude != null;

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
      source: log.source,
      latitude: log.clientLatitude ?? null,
      longitude: log.clientLongitude ?? null,
      hasGeo,
      isOutOfGeofence: log.validationStatus === 'REJECTED',
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

  private buildAlerts(dayLogs: AttendanceLogFull[]): ControlPanelAlert[] {
    const alerts: ControlPanelAlert[] = [];

    for (const log of dayLogs) {
      if (log.source === AttendanceLogSource.APP_MOVIL && log.validationStatus === 'REJECTED') {
        alerts.push({
          id: `geo-${log.id}`,
          type: 'geofence',
          title: `${log.employee.name} registró fuera de geocerca`,
          subtitle: `${log.location.name} · ${Math.round(log.distanceMeters ?? 0)} m fuera del radio`,
          generatedAt: log.timestamp.toISOString(),
          employeeId: log.employeeId,
          employeeName: log.employee.name,
        });
      }
    }

    for (const log of dayLogs) {
      if (log.eventType === AttendanceEventType.EXIT) continue;
      if (log.source === AttendanceLogSource.MANUAL) continue;

      const hasGeo = log.clientLatitude != null && log.clientLongitude != null;
      if (!hasGeo) {
        const sourceLabel =
          log.source === AttendanceLogSource.APP_MOVIL
            ? 'app móvil sin geo'
            : 'marcación automática';
        alerts.push({
          id: `no-geo-${log.id}`,
          type: 'no-geo',
          title: `${log.employee.name} sin geolocalización`,
          subtitle: `${log.location.name} · ${sourceLabel}`,
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
