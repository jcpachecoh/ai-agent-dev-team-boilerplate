import { Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceEventType, AttendanceLog } from '@prisma/client';
import type {
  AttendanceActingUser,
  AttendanceMonitorEmployee,
  AttendanceMonitorSummary,
  AttendanceMonitorSummaryInput,
  EmployeeWithUser,
} from '../interfaces/attendance.interfaces';
import { AttendanceRepository } from '../repository/attendance.repository';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import {
  calculateDaySummary,
  getBogotaHour,
  getBogotaMinute,
  getShiftStartHour,
  isLateEntry,
} from '../utils/attendance-calculation.util';
import { resolveClasificacionFilter } from '../utils/clasificacion.util';
import {
  enumerateWorkDates,
  isLiveAttendancePeriod,
  resolveAttendancePeriodRange,
  workDateFromIso,
} from '../utils/period-range.util';

interface EmployeeAggregate {
  employee: EmployeeWithUser;
  daysPresent: number;
  workedMinutes: number;
  overtimeMinutes: number;
  lateCount: number;
  lateMinutes: number;
  lastEntryAt?: Date;
  hasEntryInRange: boolean;
  isOnShiftToday: boolean;
}

@Injectable()
export class AttendanceMonitorSummaryService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly userLocationsService: UserLocationsService,
    private readonly legalParametersService: LaborLegalParametersService,
  ) {}

  async getMonitorSummary(
    input: AttendanceMonitorSummaryInput,
    tenantId: string,
    actor: AttendanceActingUser,
  ): Promise<AttendanceMonitorSummary> {
    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(tenantId, {
      userId: actor.sub,
      roleCode: actor.roleCode,
    });
    this.userLocationsService.assertLocationAllowed(allowedLocationIds, input.locationId);

    const location = await this.attendanceRepository.findLocationById(input.locationId, tenantId);
    if (!location) {
      throw new NotFoundException(`Sede ${input.locationId} no encontrada`);
    }

    const laborClassifications = resolveClasificacionFilter(input.clasificacion);
    const range = resolveAttendancePeriodRange(input.period, input.anchorDate);

    const [employees, clasificacionCounts] = await Promise.all([
      this.attendanceRepository.findEmployeesAtLocation(
        input.locationId,
        tenantId,
        laborClassifications,
      ),
      this.attendanceRepository.countByLaborClassification(input.locationId, tenantId),
    ]);

    const logs = await this.attendanceRepository.listHistory({
      tenantId,
      locationId: input.locationId,
      dateFrom: workDateFromIso(range.dateFrom),
      dateTo: workDateFromIso(range.dateTo),
      limit: 5000,
    });

    const isLive = isLiveAttendancePeriod(input.period, input.anchorDate);
    const activeToday = isLive
      ? await this.attendanceRepository.listActiveAtLocation(input.locationId, tenantId)
      : [];
    const activeEmployeeIds = new Set(activeToday.map((log) => log.employeeId));

    // Resolved once for the whole aggregation (not per day/employee) — avoids N+1 queries.
    const nocturnoStartHour = await this.legalParametersService.getValueAt(
      'HORARIO_NOCTURNO_INICIO',
      new Date(),
      tenantId,
    );
    const aggregates = this.buildAggregates(
      employees,
      logs,
      range.dateFrom,
      range.dateTo,
      activeEmployeeIds,
      isLive,
      nocturnoStartHour,
    );

    const onShift = aggregates
      .filter((item) => (isLive ? item.isOnShiftToday : item.daysPresent > 0))
      .map((item) => this.toEmployeeDto(item, 'on-shift', isLive));

    const absent = aggregates
      .filter((item) => !item.hasEntryInRange)
      .map((item) => this.toEmployeeDto(item, 'absent', isLive));

    const late = aggregates
      .filter((item) => item.lateCount > 0)
      .map((item) => this.toEmployeeDto(item, 'late', isLive));

    const overtime = aggregates
      .filter((item) => item.overtimeMinutes > 0)
      .map((item) => this.toEmployeeDto(item, 'overtime', isLive));

    const uniqueOnShift = this.dedupeEmployees(onShift);
    const uniqueAbsent = this.dedupeEmployees(absent);
    const uniqueLate = this.dedupeEmployees(late);
    const uniqueOvertime = this.dedupeEmployees(overtime);

    const total = employees.length;

    return {
      locationId: input.locationId,
      period: input.period,
      anchorDate: input.anchorDate,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      isLive,
      clasificacion: input.clasificacion,
      clasificacionCounts,
      metrics: {
        total,
        onShift: uniqueOnShift.length,
        absent: uniqueAbsent.length,
        lateArrivals: uniqueLate.length,
        overtime: uniqueOvertime.length,
        offSchedule: uniqueLate.length,
        legalAlerts: 0,
      },
      employees: {
        onShift: uniqueOnShift,
        absent: uniqueAbsent,
        late: uniqueLate,
        overtime: uniqueOvertime,
      },
    };
  }

  private buildAggregates(
    employees: EmployeeWithUser[],
    logs: Array<AttendanceLog & { employee?: EmployeeWithUser }>,
    dateFrom: string,
    dateTo: string,
    activeEmployeeIds: Set<string>,
    isLive: boolean,
    nocturnoStartHour: number,
  ): EmployeeAggregate[] {
    const workDates = enumerateWorkDates(dateFrom, dateTo);
    const logsByEmployeeDay = new Map<string, AttendanceLog[]>();

    for (const log of logs) {
      const workDateKey = log.workDate.toISOString().slice(0, 10);
      const key = `${log.employeeId}:${workDateKey}`;
      const bucket = logsByEmployeeDay.get(key) ?? [];
      bucket.push(log);
      logsByEmployeeDay.set(key, bucket);
    }

    return employees.map((employee) => {
      let daysPresent = 0;
      let workedMinutes = 0;
      let overtimeMinutes = 0;
      let lateCount = 0;
      let lateMinutes = 0;
      let lastEntryAt: Date | undefined;
      let hasEntryInRange = false;

      for (const workDate of workDates) {
        const dayLogs = logsByEmployeeDay.get(`${employee.id}:${workDate}`) ?? [];
        if (dayLogs.length === 0) continue;

        const entries = dayLogs.filter((log) => log.eventType === AttendanceEventType.ENTRY);
        if (entries.length > 0) {
          hasEntryInRange = true;
          daysPresent += 1;
          const latestEntry = entries.reduce((latest, current) =>
            current.timestamp > latest.timestamp ? current : latest,
          );
          if (!lastEntryAt || latestEntry.timestamp > lastEntryAt) {
            lastEntryAt = latestEntry.timestamp;
          }
        }

        for (const entry of entries) {
          if (isLateEntry(entry)) {
            lateCount += 1;
            const entryMinutes =
              getBogotaHour(entry.timestamp) * 60 + getBogotaMinute(entry.timestamp);
            const shiftStartMinutes = getShiftStartHour(entry.shift) * 60;
            lateMinutes += Math.max(0, entryMinutes - shiftStartMinutes);
          }
        }

        const summary = calculateDaySummary(dayLogs, new Date(), nocturnoStartHour);
        workedMinutes += summary.totalMinutes;
        overtimeMinutes += summary.overtimeMinutes;
      }

      return {
        employee,
        daysPresent,
        workedMinutes,
        overtimeMinutes,
        lateCount,
        lateMinutes,
        lastEntryAt,
        hasEntryInRange,
        isOnShiftToday: isLive && activeEmployeeIds.has(employee.id),
      };
    });
  }

  private toEmployeeDto(
    aggregate: EmployeeAggregate,
    status: AttendanceMonitorEmployee['status'],
    isLive: boolean,
  ): AttendanceMonitorEmployee {
    const name = aggregate.employee.name?.trim() || aggregate.employee.user.email.split('@')[0];
    const entryLabel =
      aggregate.lastEntryAt && (isLive || status === 'on-shift')
        ? `Entrada ${aggregate.lastEntryAt.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Bogota',
          })}`
        : undefined;

    return {
      employeeId: aggregate.employee.id,
      userId: aggregate.employee.userId,
      name,
      role: aggregate.employee.position,
      status,
      entryLabel,
      workedMinutes: aggregate.workedMinutes,
      overtimeMinutes: aggregate.overtimeMinutes,
      lateMinutes: aggregate.lateMinutes,
      daysPresent: aggregate.daysPresent,
      lastEntryAt: aggregate.lastEntryAt?.toISOString(),
    };
  }

  private dedupeEmployees(items: AttendanceMonitorEmployee[]): AttendanceMonitorEmployee[] {
    const map = new Map<string, AttendanceMonitorEmployee>();
    for (const item of items) {
      map.set(item.employeeId, item);
    }
    return Array.from(map.values());
  }
}
