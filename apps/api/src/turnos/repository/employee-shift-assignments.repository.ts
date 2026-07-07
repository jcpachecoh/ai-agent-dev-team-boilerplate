import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateEmployeeShiftAssignmentData,
  EmployeeShiftAssignmentAuditChangeSet,
  EmployeeShiftAssignmentRecord,
  IEmployeeShiftAssignmentsRepository,
  PatchEmployeeShiftAssignmentData,
} from '../interfaces/employee-shift-assignment.interfaces';
import type { AssignmentTurnoSummary } from '../interfaces/turno-assignments.interfaces';

const turnoSelect = {
  id: true,
  nombre: true,
  sigla: true,
  horaInicio: true,
  horaFin: true,
  jornada: true,
  locationId: true,
  daysOfWeek: true,
  estado: true,
} as const;

@Injectable()
export class EmployeeShiftAssignmentsRepository implements IEmployeeShiftAssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeShiftAssignmentRecord[]> {
    const rows = await this.prisma.employeeShiftAssignment.findMany({
      where: { tenantId, employeeId },
      include: { turno: { select: turnoSelect } },
      orderBy: { effectiveFrom: 'desc' },
    });
    return rows.map((row) => this.mapRow(row));
  }

  async findById(tenantId: string, id: string): Promise<EmployeeShiftAssignmentRecord | null> {
    const row = await this.prisma.employeeShiftAssignment.findFirst({
      where: { id, tenantId },
      include: { turno: { select: turnoSelect } },
    });
    return row ? this.mapRow(row) : null;
  }

  async findOpenByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeShiftAssignmentRecord | null> {
    const row = await this.prisma.employeeShiftAssignment.findFirst({
      where: { tenantId, employeeId, effectiveTo: null },
      include: { turno: { select: turnoSelect } },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row ? this.mapRow(row) : null;
  }

  async findEffectiveOnDate(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<EmployeeShiftAssignmentRecord | null> {
    const row = await this.prisma.employeeShiftAssignment.findFirst({
      where: {
        tenantId,
        employeeId,
        effectiveFrom: { lte: workDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: workDate } }],
      },
      include: { turno: { select: turnoSelect } },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row ? this.mapRow(row) : null;
  }

  async hasOverlappingAssignment(
    tenantId: string,
    employeeId: string,
    effectiveFrom: Date,
    effectiveTo: Date | null,
    excludeId?: string,
  ): Promise<boolean> {
    const rangeEnd = effectiveTo ?? new Date('9999-12-31T00:00:00.000Z');
    const count = await this.prisma.employeeShiftAssignment.count({
      where: {
        tenantId,
        employeeId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        effectiveFrom: { lte: rangeEnd },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveFrom } }],
      },
    });
    return count > 0;
  }

  async createWithAudit(
    tenantId: string,
    employeeId: string,
    data: CreateEmployeeShiftAssignmentData,
    actorUserId: string,
    auditNewValue: Record<string, unknown>,
    closePreviousId: string | null,
    previousEffectiveTo: Date | null,
  ): Promise<EmployeeShiftAssignmentRecord> {
    return this.prisma.$transaction(async (tx) => {
      if (closePreviousId && previousEffectiveTo) {
        await tx.employeeShiftAssignment.update({
          where: { id: closePreviousId },
          data: {
            effectiveTo: previousEffectiveTo,
            updatedByUserId: actorUserId,
          },
        });
      }

      const row = await tx.employeeShiftAssignment.create({
        data: {
          tenantId,
          employeeId,
          turnoId: data.turnoId,
          effectiveFrom: data.effectiveFrom,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
        include: { turno: { select: turnoSelect } },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: AuditAction.CREATE,
          entityType: 'EmployeeShiftAssignment',
          entityId: row.id,
          actorUserId,
          newValue: auditNewValue as Prisma.InputJsonValue,
        },
      });

      return this.mapRow(row);
    });
  }

  async updateWithAudit(
    tenantId: string,
    id: string,
    data: PatchEmployeeShiftAssignmentData,
    actorUserId: string,
    auditChanges: EmployeeShiftAssignmentAuditChangeSet,
  ): Promise<EmployeeShiftAssignmentRecord> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.employeeShiftAssignment.update({
        where: { id },
        data: {
          ...data,
          updatedByUserId: actorUserId,
        },
        include: { turno: { select: turnoSelect } },
      });

      if (row.tenantId !== tenantId) {
        throw new Error('Tenant mismatch after update');
      }

      if (Object.keys(auditChanges.newValue).length > 0) {
        await tx.auditLog.create({
          data: {
            tenantId,
            action: AuditAction.UPDATE,
            entityType: 'EmployeeShiftAssignment',
            entityId: row.id,
            actorUserId,
            oldValue: auditChanges.oldValue as Prisma.InputJsonValue,
            newValue: auditChanges.newValue as Prisma.InputJsonValue,
          },
        });
      }

      return this.mapRow(row);
    });
  }

  private mapRow(row: {
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
    turno: {
      id: string;
      nombre: string;
      sigla: string;
      horaInicio: string;
      horaFin: string;
      jornada: AssignmentTurnoSummary['jornada'];
      locationId: string;
      daysOfWeek: number[];
      estado: boolean;
    };
  }): EmployeeShiftAssignmentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      turnoId: row.turnoId,
      effectiveFrom: row.effectiveFrom,
      effectiveTo: row.effectiveTo,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      turno: {
        id: row.turno.id,
        nombre: row.turno.nombre,
        sigla: row.turno.sigla,
        horaInicio: row.turno.horaInicio,
        horaFin: row.turno.horaFin,
        jornada: row.turno.jornada,
        locationId: row.turno.locationId,
        daysOfWeek: row.turno.daysOfWeek,
        estado: row.turno.estado,
      },
    };
  }
}
