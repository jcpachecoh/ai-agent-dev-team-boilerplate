import { Injectable } from '@nestjs/common';
import { type IReportsRepository } from '../interfaces/reports.interfaces';
import {
  AttendanceLog,
  EmployeeContractType,
  EmployeeDetails,
  Location,
  User,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type EmployeeWithUserAndLocation = EmployeeDetails & {
  user: User;
  location: Pick<Location, 'id' | 'name'>;
};

@Injectable()
export class ReportsRepository implements IReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns active employees for the tenant, optionally filtered. */
  async findActiveEmployees(
    tenantId: string,
    options: {
      locationId?: string;
      allowedLocationIds?: string[] | null;
      contractType?: EmployeeContractType;
      employeeId?: string;
    } = {},
  ): Promise<EmployeeWithUserAndLocation[]> {
    const where: Record<string, unknown> = {
      tenantId,
      isActive: true,
      deletedAt: null,
    };
    if (options.locationId) {
      where.locationId = options.locationId;
    } else if (options.allowedLocationIds) {
      where.locationId = { in: options.allowedLocationIds };
    }
    if (options.contractType) where.contractType = options.contractType;
    if (options.employeeId) where.id = options.employeeId;

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
