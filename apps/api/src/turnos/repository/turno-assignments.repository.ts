import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  AssignAssignmentData,
  AssignmentAuditChangeSet,
  EmployeeDirectoryEntry,
  EmployeeScopeInfo,
  ITurnoAssignmentsRepository,
  TurnoAssignmentRecord,
  TurnoScopeInfo,
} from '../interfaces/turno-assignments.interfaces';

type AssignmentRow = Prisma.TurnoAssignmentGetPayload<{ include: { turno: true } }>;

@Injectable()
export class TurnoAssignmentsRepository implements ITurnoAssignmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveEmployeesPage(
    tenantId: string,
    options: {
      search?: string;
      field?: 'nombre' | 'documento';
      page: number;
      limit: number;
      allowedLocationIds?: string[] | null;
    },
  ): Promise<{
    employees: EmployeeDirectoryEntry[];
    total: number;
  }> {
    const where: Prisma.EmployeeDetailsWhereInput = {
      tenantId,
      deletedAt: null,
      isActive: true,
    };

    if (options.allowedLocationIds) {
      where.locationId = { in: options.allowedLocationIds };
    }

    const search = options.search?.trim();
    if (search) {
      if (options.field === 'documento') {
        where.user = { cedula: { contains: search, mode: 'insensitive' } };
      } else {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { user: { cedula: { contains: search, mode: 'insensitive' } } },
        ];
      }
    }

    const [total, rows] = await Promise.all([
      this.prisma.employeeDetails.count({ where }),
      this.prisma.employeeDetails.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
        select: {
          id: true,
          userId: true,
          name: true,
          locationId: true,
          user: { select: { cedula: true } },
        },
      }),
    ]);

    return {
      total,
      employees: rows.map(
        (row): EmployeeDirectoryEntry => ({
          id: row.id,
          userId: row.userId,
          nombre: row.name,
          documento: row.user.cedula,
          locationId: row.locationId,
        }),
      ),
    };
  }

  async findAssignmentsForEmployeesInRange(
    tenantId: string,
    employeeIds: string[],
    from: Date,
    to: Date,
  ): Promise<TurnoAssignmentRecord[]> {
    if (employeeIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.turnoAssignment.findMany({
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        workDate: { gte: from, lte: to },
      },
      include: { turno: true },
    });

    return rows.map((row): TurnoAssignmentRecord => this.mapAssignment(row));
  }

  async findById(tenantId: string, id: string): Promise<TurnoAssignmentRecord | null> {
    const row = await this.prisma.turnoAssignment.findFirst({
      where: { id, tenantId },
      include: { turno: true },
    });
    return row ? this.mapAssignment(row) : null;
  }

  async findByEmployeeAndDate(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<TurnoAssignmentRecord | null> {
    const row = await this.prisma.turnoAssignment.findFirst({
      where: { tenantId, employeeId, workDate },
      include: { turno: true },
    });
    return row ? this.mapAssignment(row) : null;
  }

  async findEmployeeScope(tenantId: string, employeeId: string): Promise<EmployeeScopeInfo | null> {
    const row = await this.prisma.employeeDetails.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
      select: { id: true, locationId: true, isActive: true },
    });
    return row ?? null;
  }

  async findEmployeeByDocument(
    tenantId: string,
    documento: string,
  ): Promise<EmployeeScopeInfo | null> {
    const row = await this.prisma.employeeDetails.findFirst({
      where: { tenantId, deletedAt: null, user: { cedula: documento } },
      select: { id: true, locationId: true, isActive: true },
    });
    return row ?? null;
  }

  async findEmployeesByIds(
    tenantId: string,
    employeeIds: string[],
  ): Promise<Array<EmployeeDirectoryEntry & { isActive: boolean }>> {
    if (employeeIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.employeeDetails.findMany({
      where: { tenantId, deletedAt: null, id: { in: employeeIds } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        userId: true,
        name: true,
        locationId: true,
        isActive: true,
        user: { select: { cedula: true } },
      },
    });

    return rows.map((row): EmployeeDirectoryEntry & { isActive: boolean } => ({
      id: row.id,
      userId: row.userId,
      nombre: row.name,
      documento: row.user.cedula,
      locationId: row.locationId,
      isActive: row.isActive,
    }));
  }

  async findTurnoScope(tenantId: string, turnoId: string): Promise<TurnoScopeInfo | null> {
    const row = await this.prisma.turno.findFirst({
      where: { id: turnoId, tenantId },
      select: {
        id: true,
        nombre: true,
        sigla: true,
        horaInicio: true,
        horaFin: true,
        jornada: true,
        tipo: true,
        estado: true,
        locationId: true,
        daysOfWeek: true,
      },
    });
    return row ?? null;
  }

  async upsertWithAudit(
    tenantId: string,
    data: AssignAssignmentData,
    actorUserId: string,
    auditChanges: AssignmentAuditChangeSet,
  ): Promise<TurnoAssignmentRecord> {
    return this.prisma.$transaction(async (tx): Promise<TurnoAssignmentRecord> => {
      const row = await tx.turnoAssignment.upsert({
        where: {
          tenantId_employeeId_workDate: {
            tenantId,
            employeeId: data.employeeId,
            workDate: data.workDate,
          },
        },
        create: {
          tenantId,
          employeeId: data.employeeId,
          workDate: data.workDate,
          type: data.type,
          turnoId: data.turnoId,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
        update: {
          type: data.type,
          turnoId: data.turnoId,
          updatedByUserId: actorUserId,
        },
        include: { turno: true },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: AuditAction.ASSIGN,
          entityType: 'TurnoAssignment',
          entityId: row.id,
          actorUserId,
          oldValue: (auditChanges.oldValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          newValue: (auditChanges.newValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });

      return this.mapAssignment(row);
    });
  }

  async deleteWithAudit(
    tenantId: string,
    id: string,
    actorUserId: string,
    auditChanges: AssignmentAuditChangeSet,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx): Promise<void> => {
      await tx.turnoAssignment.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: AuditAction.ASSIGN,
          entityType: 'TurnoAssignment',
          entityId: id,
          actorUserId,
          oldValue: (auditChanges.oldValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          newValue: (auditChanges.newValue ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });
    });
  }

  /** OS-583 — descarga de plantilla Excel de asignación masiva. */
  async logTemplateExportAudit(
    tenantId: string,
    actorUserId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: AuditAction.EXPORT,
        entityType: 'TurnoAssignment',
        entityId: tenantId,
        actorUserId,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  private mapAssignment(row: AssignmentRow): TurnoAssignmentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      turnoId: row.turnoId,
      employeeId: row.employeeId,
      workDate: row.workDate,
      type: row.type,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      turno: row.turno
        ? {
            id: row.turno.id,
            nombre: row.turno.nombre,
            sigla: row.turno.sigla,
            horaInicio: row.turno.horaInicio,
            horaFin: row.turno.horaFin,
            jornada: row.turno.jornada,
            locationId: row.turno.locationId,
            daysOfWeek: row.turno.daysOfWeek,
          }
        : null,
    };
  }
}
