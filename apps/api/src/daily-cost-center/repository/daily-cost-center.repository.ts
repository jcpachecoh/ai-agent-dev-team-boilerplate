import { Injectable } from '@nestjs/common';
import { AssignmentSource, CostCenter, TurnoAssignmentType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  ASSIGNMENT_SOURCE_PRIORITY,
  DailyAssignmentRecord,
  DailyAssignmentTenantFilters,
  DailyAssignmentWithLocation,
  IDailyCostCenterRepository,
  PendingAssignmentDay,
  UpsertDailyAssignmentInput,
} from '../interfaces/daily-cost-center.interfaces';

function mapRow(row: {
  id: string;
  tenantId: string;
  employeeId: string;
  date: Date;
  locationId: string;
  shiftId: string | null;
  source: AssignmentSource;
  createdAt: Date;
  updatedAt: Date;
}): DailyAssignmentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    date: row.date,
    locationId: row.locationId,
    shiftId: row.shiftId,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class DailyCostCenterRepository implements IDailyCostCenterRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prioridad de fuente (task-03/D2/D7): una fila MANUAL nunca es sobrescrita por una
   * fuente automática. Entre fuentes automáticas, solo se actualiza si la entrante tiene
   * prioridad igual o mayor (permite que el turno reemplace una marcación previa, o que
   * el turno/marcación del mismo día actualice su propia sede).
   */
  async upsertForDay(input: UpsertDailyAssignmentInput): Promise<DailyAssignmentRecord> {
    const existing = await this.prisma.dailyCostCenterAssignment.findUnique({
      where: {
        tenantId_employeeId_date: {
          tenantId: input.tenantId,
          employeeId: input.employeeId,
          date: input.date,
        },
      },
    });

    if (!existing) {
      try {
        const created = await this.prisma.dailyCostCenterAssignment.create({
          data: {
            tenantId: input.tenantId,
            employeeId: input.employeeId,
            date: input.date,
            locationId: input.locationId,
            shiftId: input.shiftId ?? null,
            source: input.source,
          },
        });
        return mapRow(created);
      } catch (err) {
        if (isUniqueConstraintViolation(err)) {
          // Otra request ganó la carrera de creación; reintentar aplica la misma
          // matriz de prioridad contra la fila que quedó persistida.
          return this.upsertForDay(input);
        }
        throw err;
      }
    }

    if (existing.source === AssignmentSource.MANUAL && input.source !== AssignmentSource.MANUAL) {
      return mapRow(existing);
    }

    const existingPriority = ASSIGNMENT_SOURCE_PRIORITY[existing.source];
    const incomingPriority = ASSIGNMENT_SOURCE_PRIORITY[input.source];
    if (incomingPriority < existingPriority) {
      return mapRow(existing);
    }

    const updated = await this.prisma.dailyCostCenterAssignment.update({
      where: { id: existing.id },
      data: {
        locationId: input.locationId,
        shiftId: input.shiftId ?? null,
        source: input.source,
      },
    });
    return mapRow(updated);
  }

  async findByEmployeeAndDateRange(
    tenantId: string,
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<DailyAssignmentRecord[]> {
    const rows = await this.prisma.dailyCostCenterAssignment.findMany({
      where: { tenantId, employeeId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
    return rows.map(mapRow);
  }

  async findByTenantAndDateRange(
    tenantId: string,
    from: Date,
    to: Date,
    filters?: DailyAssignmentTenantFilters,
  ): Promise<DailyAssignmentWithLocation[]> {
    const rows = await this.prisma.dailyCostCenterAssignment.findMany({
      where: {
        tenantId,
        date: { gte: from, lte: to },
        ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters?.locationId ? { locationId: filters.locationId } : {}),
        ...(filters?.source ? { source: filters.source } : {}),
      },
      include: { location: { select: { name: true } } },
      orderBy: [{ date: 'asc' }, { employeeId: 'asc' }],
    });

    return rows.map((row) => ({
      ...mapRow(row),
      locationName: row.location.name,
    }));
  }

  /**
   * Días laborables (CONN-03: TurnoAssignment tipo ASSIGNED) del rango en que el
   * empleado no tiene fila de DailyCostCenterAssignment — quedan pendientes de
   * asignación manual (D5), sin inventar sede.
   */
  async findPendingDays(
    tenantId: string,
    employeeId: string,
    from: Date,
    to: Date,
  ): Promise<PendingAssignmentDay[]> {
    const [scheduledDays, assignedDays] = await Promise.all([
      this.prisma.turnoAssignment.findMany({
        where: {
          tenantId,
          employeeId,
          type: TurnoAssignmentType.ASSIGNED,
          workDate: { gte: from, lte: to },
        },
        select: { workDate: true },
      }),
      this.prisma.dailyCostCenterAssignment.findMany({
        where: { tenantId, employeeId, date: { gte: from, lte: to } },
        select: { date: true },
      }),
    ]);

    const assignedDateKeys = new Set(
      assignedDays.map((row) => row.date.toISOString().slice(0, 10)),
    );

    return scheduledDays
      .filter((row) => !assignedDateKeys.has(row.workDate.toISOString().slice(0, 10)))
      .map((row) => ({ employeeId, date: row.workDate }));
  }

  async deleteManual(tenantId: string, id: string): Promise<DailyAssignmentRecord | null> {
    const existing = await this.prisma.dailyCostCenterAssignment.findFirst({
      where: { id, tenantId, source: AssignmentSource.MANUAL },
    });
    if (!existing) return null;

    const deleted = await this.prisma.dailyCostCenterAssignment.delete({ where: { id } });
    return mapRow(deleted);
  }

  async findEmployeeCostCenter(tenantId: string, employeeId: string): Promise<CostCenter | null> {
    const employee = await this.prisma.employeeDetails.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
      select: { costCenter: true },
    });
    return employee?.costCenter ?? null;
  }

  async findRotanteEmployees(tenantId: string): Promise<Array<{ id: string; name: string }>> {
    const employees = await this.prisma.employeeDetails.findMany({
      where: { tenantId, costCenter: CostCenter.ROTANTE, isActive: true, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    return employees;
  }

  async findActiveLocationInTenant(
    tenantId: string,
    locationId: string,
  ): Promise<{ id: string; name: string } | null> {
    return this.prisma.location.findFirst({
      where: { id: locationId, tenantId, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });
  }
}

function isUniqueConstraintViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2002'
  );
}
