import { Injectable } from '@nestjs/common';
import { TurnoAssignmentType } from '@prisma/client';

import type {
  IShiftResolutionService,
  ResolvedShift,
} from '../interfaces/employee-shift-assignment.interfaces';
import { EmployeeShiftAssignmentsRepository } from '../repository/employee-shift-assignments.repository';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { computeShiftTargetMinutes, getUtcDayOfWeek } from '../shift-resolution.utils';

@Injectable()
export class ShiftResolutionService implements IShiftResolutionService {
  constructor(
    private readonly turnoAssignmentsRepository: TurnoAssignmentsRepository,
    private readonly employeeShiftAssignmentsRepository: EmployeeShiftAssignmentsRepository,
  ) {}

  async resolveForDay(params: {
    tenantId: string;
    employeeId: string;
    locationId: string;
    workDate: Date;
  }): Promise<ResolvedShift> {
    const { tenantId, employeeId, locationId, workDate } = params;

    const calendarAssignment = await this.turnoAssignmentsRepository.findByEmployeeAndDate(
      tenantId,
      employeeId,
      workDate,
    );

    if (calendarAssignment) {
      if (calendarAssignment.type === TurnoAssignmentType.REST) {
        return { kind: 'REST', targetMinutes: 0 };
      }

      if (calendarAssignment.type === TurnoAssignmentType.ASSIGNED && calendarAssignment.turno) {
        const turno = calendarAssignment.turno;
        return {
          kind: 'ASSIGNED',
          source: 'CALENDAR',
          turno: {
            id: turno.id,
            nombre: turno.nombre,
            sigla: turno.sigla,
            horaInicio: turno.horaInicio,
            horaFin: turno.horaFin,
            jornada: turno.jornada,
            locationId: turno.locationId ?? locationId,
            daysOfWeek: turno.daysOfWeek ?? [],
          },
          targetMinutes: computeShiftTargetMinutes(turno.horaInicio, turno.horaFin),
        };
      }
    }

    const employeeAssignment = await this.employeeShiftAssignmentsRepository.findEffectiveOnDate(
      tenantId,
      employeeId,
      workDate,
    );

    if (!employeeAssignment || !employeeAssignment.turno.estado) {
      return { kind: 'NONE', targetMinutes: 0 };
    }

    const turno = employeeAssignment.turno;
    if (turno.locationId !== locationId) {
      return { kind: 'NONE', targetMinutes: 0 };
    }

    const dayOfWeek = getUtcDayOfWeek(workDate);
    if (!turno.daysOfWeek.includes(dayOfWeek)) {
      return { kind: 'NONE', targetMinutes: 0 };
    }

    return {
      kind: 'ASSIGNED',
      source: 'EMPLOYEE_ASSIGNMENT',
      turno,
      targetMinutes: computeShiftTargetMinutes(turno.horaInicio, turno.horaFin),
    };
  }

  async getTargetMinutesForDay(params: {
    tenantId: string;
    employeeId: string;
    locationId: string;
    workDate: Date;
  }): Promise<number> {
    const resolved = await this.resolveForDay(params);
    return resolved.targetMinutes;
  }
}
