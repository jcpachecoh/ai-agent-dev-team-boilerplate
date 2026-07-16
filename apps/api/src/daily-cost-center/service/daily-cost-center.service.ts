import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AssignmentSource, CostCenter } from '@prisma/client';

import { DailyCostCenterRepository } from '../repository/daily-cost-center.repository';
import type {
  AssignManualInput,
  DailyAssignmentRecord,
  EmployeeCalendarDay,
  IDailyCostCenterService,
  PendingAssignmentForTenant,
  ResolveFromAttendanceInput,
  ResolveFromShiftInput,
} from '../interfaces/daily-cost-center.interfaces';

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class DailyCostCenterService implements IDailyCostCenterService {
  private readonly logger = new Logger(DailyCostCenterService.name);

  constructor(private readonly repository: DailyCostCenterRepository) {}

  async resolveFromShift(input: ResolveFromShiftInput): Promise<DailyAssignmentRecord | null> {
    const isRotante = await this.isEmployeeRotante(input.tenantId, input.employeeId);
    if (!isRotante) {
      this.logger.debug(
        `Skip resolveFromShift — employee=${input.employeeId} no tiene costCenter=ROTANTE`,
      );
      return null;
    }

    return this.repository.upsertForDay({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      date: input.workDate,
      locationId: input.locationId,
      shiftId: input.shiftId,
      source: AssignmentSource.TURNO_ASIGNADO,
    });
  }

  async resolveFromAttendance(
    input: ResolveFromAttendanceInput,
  ): Promise<DailyAssignmentRecord | null> {
    const isRotante = await this.isEmployeeRotante(input.tenantId, input.employeeId);
    if (!isRotante) {
      this.logger.debug(
        `Skip resolveFromAttendance — employee=${input.employeeId} no tiene costCenter=ROTANTE`,
      );
      return null;
    }

    return this.repository.upsertForDay({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      date: input.eventDate,
      locationId: input.locationId,
      shiftId: null,
      source: AssignmentSource.MARCACION_ASISTENCIA,
    });
  }

  async assignManual(input: AssignManualInput): Promise<DailyAssignmentRecord> {
    const isRotante = await this.isEmployeeRotante(input.tenantId, input.employeeId);
    if (!isRotante) {
      throw new BadRequestException(
        'Solo empleados con Centro de Costos Rotante admiten asignación diaria de sede',
      );
    }

    const location = await this.repository.findActiveLocationInTenant(
      input.tenantId,
      input.locationId,
    );
    if (!location) {
      throw new BadRequestException(
        `La sede "${input.locationId}" no pertenece al tenant o no está activa`,
      );
    }

    return this.repository.upsertForDay({
      tenantId: input.tenantId,
      employeeId: input.employeeId,
      date: input.date,
      locationId: input.locationId,
      shiftId: null,
      source: AssignmentSource.MANUAL,
    });
  }

  async listForEmployeeCalendar(
    tenantId: string,
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<EmployeeCalendarDay[]> {
    const [assignments, pendingDays] = await Promise.all([
      this.repository.findByTenantAndDateRange(tenantId, from, to, { employeeId }),
      this.repository.findPendingDays(tenantId, employeeId, from, to),
    ]);

    const days = new Map<string, EmployeeCalendarDay>();
    for (const assignment of assignments) {
      days.set(dateKey(assignment.date), {
        date: assignment.date,
        locationId: assignment.locationId,
        locationName: assignment.locationName,
        source: assignment.source,
        isPending: false,
      });
    }

    for (const pending of pendingDays) {
      const key = dateKey(pending.date);
      if (!days.has(key)) {
        days.set(key, {
          date: pending.date,
          locationId: null,
          locationName: null,
          source: null,
          isPending: true,
        });
      }
    }

    return [...days.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async listPendingForTenant(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<PendingAssignmentForTenant[]> {
    const employees = await this.repository.findRotanteEmployees(tenantId);

    const results: PendingAssignmentForTenant[] = [];
    for (const employee of employees) {
      const pending = await this.repository.findPendingDays(tenantId, employee.id, from, to);
      for (const day of pending) {
        results.push({
          employeeId: employee.id,
          employeeName: employee.name,
          date: day.date,
          suggestedLocationId: null,
        });
      }
    }

    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async deleteManual(tenantId: string, id: string): Promise<DailyAssignmentRecord | null> {
    return this.repository.deleteManual(tenantId, id);
  }

  private async isEmployeeRotante(tenantId: string, employeeId: string): Promise<boolean> {
    const costCenter = await this.repository.findEmployeeCostCenter(tenantId, employeeId);
    return costCenter === CostCenter.ROTANTE;
  }
}
