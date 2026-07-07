import type { TurnoJornada } from '@prisma/client';

import type { AssignmentTurnoSummary } from './turno-assignments.interfaces';
import type { ActorContext } from './turno-assignments.interfaces';

export type ResolvedShiftKind = 'ASSIGNED' | 'REST' | 'NONE';
export type ResolvedShiftSource = 'CALENDAR' | 'EMPLOYEE_ASSIGNMENT';

export interface ResolvedShiftAssigned {
  kind: 'ASSIGNED';
  source: ResolvedShiftSource;
  turno: AssignmentTurnoSummary & { locationId: string; daysOfWeek: number[] };
  targetMinutes: number;
}

export interface ResolvedShiftRest {
  kind: 'REST';
  targetMinutes: 0;
}

export interface ResolvedShiftNone {
  kind: 'NONE';
  targetMinutes: 0;
}

export type ResolvedShift = ResolvedShiftAssigned | ResolvedShiftRest | ResolvedShiftNone;

export interface EmployeeShiftAssignmentRecord {
  id: string;
  tenantId: string;
  employeeId: string;
  turnoId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  turno: AssignmentTurnoSummary & {
    locationId: string;
    daysOfWeek: number[];
    jornada: TurnoJornada;
    estado: boolean;
  };
}

export interface CreateEmployeeShiftAssignmentData {
  turnoId: string;
  effectiveFrom: Date;
}

export interface PatchEmployeeShiftAssignmentData {
  effectiveTo?: Date;
  turnoId?: string;
  effectiveFrom?: Date;
}

export interface EmployeeShiftAssignmentAuditChangeSet {
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
}

export interface IEmployeeShiftAssignmentsRepository {
  findByEmployee(tenantId: string, employeeId: string): Promise<EmployeeShiftAssignmentRecord[]>;
  findById(tenantId: string, id: string): Promise<EmployeeShiftAssignmentRecord | null>;
  findOpenByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeShiftAssignmentRecord | null>;
  findEffectiveOnDate(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<EmployeeShiftAssignmentRecord | null>;
  hasOverlappingAssignment(
    tenantId: string,
    employeeId: string,
    effectiveFrom: Date,
    effectiveTo: Date | null,
    excludeId?: string,
  ): Promise<boolean>;
  createWithAudit(
    tenantId: string,
    employeeId: string,
    data: CreateEmployeeShiftAssignmentData,
    actorUserId: string,
    auditNewValue: Record<string, unknown>,
    closePreviousId: string | null,
    previousEffectiveTo: Date | null,
  ): Promise<EmployeeShiftAssignmentRecord>;
  updateWithAudit(
    tenantId: string,
    id: string,
    data: PatchEmployeeShiftAssignmentData,
    actorUserId: string,
    auditChanges: EmployeeShiftAssignmentAuditChangeSet,
  ): Promise<EmployeeShiftAssignmentRecord>;
}

export interface IEmployeeShiftAssignmentsService {
  listByEmployee(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
  ): Promise<EmployeeShiftAssignmentRecord[]>;
  create(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
    input: { turnoId: string; effectiveFrom: string },
  ): Promise<EmployeeShiftAssignmentRecord>;
  patch(
    tenantId: string,
    actor: ActorContext,
    employeeId: string,
    id: string,
    input: { effectiveTo?: string; turnoId?: string; effectiveFrom?: string },
  ): Promise<EmployeeShiftAssignmentRecord>;
}

export interface IShiftResolutionService {
  resolveForDay(params: {
    tenantId: string;
    employeeId: string;
    locationId: string;
    workDate: Date;
  }): Promise<ResolvedShift>;
  getTargetMinutesForDay(params: {
    tenantId: string;
    employeeId: string;
    locationId: string;
    workDate: Date;
  }): Promise<number>;
}
