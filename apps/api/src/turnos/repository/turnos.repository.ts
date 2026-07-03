import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma, TurnoJornada, TurnoTipo } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuditChangeSet,
  CreateTurnoData,
  ITurnosRepository,
  ListTurnosFilters,
  ListTurnosOptions,
  TurnoRecord,
  TurnosListResult,
  UpdateTurnoData,
} from '../interfaces/turnos.interfaces';

@Injectable()
export class TurnosRepository implements ITurnosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string, options: ListTurnosOptions): Promise<TurnosListResult> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(200, Math.max(1, options.limit ?? 20));
    const where = this.buildWhere(tenantId, options);

    const [total, rows] = await Promise.all([
      this.prisma.turno.count({ where }),
      this.prisma.turno.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => this.mapTurno(row)),
      pagination: {
        total,
        page,
        limit,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findAllFiltered(tenantId: string, filters: ListTurnosFilters): Promise<TurnoRecord[]> {
    const rows = await this.prisma.turno.findMany({
      where: this.buildWhere(tenantId, filters),
      orderBy: { nombre: 'asc' },
    });
    return rows.map((row) => this.mapTurno(row));
  }

  async findById(tenantId: string, id: string): Promise<TurnoRecord | null> {
    const row = await this.prisma.turno.findFirst({
      where: { id, tenantId },
    });
    return row ? this.mapTurno(row) : null;
  }

  async findBySigla(tenantId: string, sigla: string): Promise<TurnoRecord | null> {
    const row = await this.prisma.turno.findFirst({
      where: { tenantId, sigla },
    });
    return row ? this.mapTurno(row) : null;
  }

  async countFutureAssignments(tenantId: string, turnoId: string, fromDate: Date): Promise<number> {
    return this.prisma.turnoAssignment.count({
      where: {
        tenantId,
        turnoId,
        workDate: { gte: fromDate },
      },
    });
  }

  async createWithAudit(
    tenantId: string,
    data: CreateTurnoData,
    actorUserId: string,
    auditNewValue: Record<string, unknown>,
  ): Promise<TurnoRecord> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.turno.create({
        data: {
          tenantId,
          ...data,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          action: AuditAction.CREATE,
          entityType: 'Turno',
          entityId: row.id,
          actorUserId,
          newValue: auditNewValue as Prisma.InputJsonValue,
        },
      });

      return this.mapTurno(row);
    });
  }

  async updateWithAudit(
    tenantId: string,
    id: string,
    data: UpdateTurnoData,
    actorUserId: string,
    auditChanges: AuditChangeSet,
  ): Promise<TurnoRecord> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.turno.update({
        where: { id },
        data: {
          ...data,
          updatedByUserId: actorUserId,
        },
      });

      if (row.tenantId !== tenantId) {
        throw new Error('Tenant mismatch after update');
      }

      if (Object.keys(auditChanges.newValue).length > 0) {
        await tx.auditLog.create({
          data: {
            tenantId,
            action: AuditAction.UPDATE,
            entityType: 'Turno',
            entityId: row.id,
            actorUserId,
            oldValue: auditChanges.oldValue as Prisma.InputJsonValue,
            newValue: auditChanges.newValue as Prisma.InputJsonValue,
          },
        });
      }

      return this.mapTurno(row);
    });
  }

  async updateEstadoWithAudit(
    tenantId: string,
    id: string,
    estado: boolean,
    actorUserId: string,
    auditChanges: AuditChangeSet,
  ): Promise<TurnoRecord> {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.turno.update({
        where: { id },
        data: {
          estado,
          updatedByUserId: actorUserId,
        },
      });

      if (row.tenantId !== tenantId) {
        throw new Error('Tenant mismatch after update');
      }

      if (Object.keys(auditChanges.newValue).length > 0) {
        await tx.auditLog.create({
          data: {
            tenantId,
            action: AuditAction.UPDATE,
            entityType: 'Turno',
            entityId: row.id,
            actorUserId,
            oldValue: auditChanges.oldValue as Prisma.InputJsonValue,
            newValue: auditChanges.newValue as Prisma.InputJsonValue,
          },
        });
      }

      return this.mapTurno(row);
    });
  }

  async logExportAudit(
    tenantId: string,
    actorUserId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: AuditAction.EXPORT,
        entityType: 'Turno',
        entityId: tenantId,
        actorUserId,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  private buildWhere(tenantId: string, filters: ListTurnosFilters): Prisma.TurnoWhereInput {
    const and: Prisma.TurnoWhereInput[] = [{ tenantId }];

    if (filters.estado !== undefined) {
      and.push({ estado: filters.estado });
    }
    if (filters.nombre) {
      and.push({ nombre: { contains: filters.nombre, mode: 'insensitive' } });
    }
    if (filters.sigla) {
      and.push({ sigla: { contains: filters.sigla, mode: 'insensitive' } });
    }
    if (filters.tipo) {
      and.push({ tipo: filters.tipo });
    }
    if (filters.jornada) {
      and.push({ jornada: filters.jornada });
    }

    const search = filters.search?.trim();
    if (search) {
      const or: Prisma.TurnoWhereInput[] = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { sigla: { contains: search, mode: 'insensitive' } },
      ];
      const upper = search.toUpperCase();
      if ((Object.values(TurnoTipo) as string[]).includes(upper)) {
        or.push({ tipo: upper as TurnoTipo });
      }
      and.push({ OR: or });
    }

    return { AND: and };
  }

  private mapTurno(row: {
    id: string;
    tenantId: string;
    nombre: string;
    sigla: string;
    tipo: TurnoTipo;
    jornada: TurnoJornada;
    horaInicio: string;
    horaFin: string;
    estado: boolean;
    createdByUserId: string | null;
    updatedByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TurnoRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      nombre: row.nombre,
      sigla: row.sigla,
      tipo: row.tipo,
      jornada: row.jornada,
      horaInicio: row.horaInicio,
      horaFin: row.horaFin,
      estado: row.estado,
      createdByUserId: row.createdByUserId,
      updatedByUserId: row.updatedByUserId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
