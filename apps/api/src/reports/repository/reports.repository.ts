import { Injectable } from '@nestjs/common';
import { AttendanceLog, CostCenter, EmployeeDetails, Location, Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ActiveEmployeeFilters, IReportsRepository } from '../interfaces/reports.interfaces';

export type EmployeeWithUserAndLocation = EmployeeDetails & {
  user: User;
  /** null para empleados con costCenter = ROTANTE (CONN-06) — sin sede fija en ficha. */
  location: Pick<Location, 'id' | 'name'> | null;
};

@Injectable()
export class ReportsRepository implements IReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns active employees for the tenant, optionally filtered. */
  async findActiveEmployees(
    tenantId: string,
    options: ActiveEmployeeFilters = {},
  ): Promise<EmployeeWithUserAndLocation[]> {
    const base: Prisma.EmployeeDetailsWhereInput = {
      tenantId,
      isActive: true,
      deletedAt: null,
    };
    if (options.contractType) base.contractType = options.contractType;
    if (options.employeeId) base.id = options.employeeId;

    const locationClause = this.buildLocationClause(tenantId, options);
    const where: Prisma.EmployeeDetailsWhereInput = locationClause
      ? { AND: [base, locationClause] }
      : base;

    return this.prisma.employeeDetails.findMany({
      where,
      include: {
        user: true,
        location: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * CONN-06: empleados ROTANTE no tienen locationId fijo.
   * - Filtro por sede puntual: incluir rotantes con asignación diaria en esa sede (si hay período).
   * - Scope por sedes permitidas: incluir siempre rotantes (luego el service filtra slices).
   */
  private buildLocationClause(
    tenantId: string,
    options: ActiveEmployeeFilters,
  ): Prisma.EmployeeDetailsWhereInput | null {
    if (options.locationId) {
      const or: Prisma.EmployeeDetailsWhereInput[] = [{ locationId: options.locationId }];
      if (options.periodFrom && options.periodTo) {
        or.push({
          costCenter: CostCenter.ROTANTE,
          dailyCostCenterAssignments: {
            some: {
              tenantId,
              locationId: options.locationId,
              date: { gte: options.periodFrom, lte: options.periodTo },
            },
          },
        });
      }
      return { OR: or };
    }

    if (options.allowedLocationIds) {
      return {
        OR: [
          { locationId: { in: options.allowedLocationIds } },
          { costCenter: CostCenter.ROTANTE },
        ],
      };
    }

    return null;
  }

  /**
   * Returns attendance logs for a date range.
   * Filters by tenantId + workDate range; optionally restricts to specific employeeIds.
   * Uses workDate (Colombia-normalized date) for range filtering, not timestamp.
   */
  async findAttendanceLogsByDateRange(
    tenantId: string,
    from: Date,
    to: Date,
    employeeIds?: string[],
  ): Promise<AttendanceLog[]> {
    const where: Record<string, unknown> = {
      tenantId,
      isActive: true,
      workDate: { gte: from, lte: to },
    };
    if (employeeIds && employeeIds.length > 0) {
      where.employeeId = { in: employeeIds };
    }

    return this.prisma.attendanceLog.findMany({
      where,
      orderBy: [{ employeeId: 'asc' }, { workDate: 'asc' }, { timestamp: 'asc' }],
    });
  }
}
