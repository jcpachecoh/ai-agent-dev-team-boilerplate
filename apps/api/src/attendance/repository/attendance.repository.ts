import { Injectable } from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLog,
  EmployeeDetails,
  Location,
  User,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AttendanceHistoryFilters,
  AttendanceLogFull,
  CreateAttendanceLogData,
  EmployeeWithUser,
  IAttendanceRepository,
} from '../interfaces/attendance.interfaces';

@Injectable()
export class AttendanceRepository implements IAttendanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByCedula(cedula: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { cedula, tenantId, isActive: true },
    });
  }

  findEmployeeByUserAndLocation(
    userId: string,
    locationId: string,
    tenantId: string,
  ): Promise<EmployeeWithUser | null> {
    return this.prisma.employeeDetails.findFirst({
      where: { userId, locationId, tenantId, isActive: true, deletedAt: null },
      include: { user: true },
    });
  }

  findEmployeeByUserId(userId: string, tenantId: string): Promise<EmployeeWithUser | null> {
    return this.prisma.employeeDetails.findFirst({
      where: { userId, tenantId, isActive: true, deletedAt: null },
      include: { user: true },
    });
  }

  async findOpenEntry(employeeId: string): Promise<AttendanceLog | null> {
    const lastEntry = await this.prisma.attendanceLog.findFirst({
      where: { employeeId, eventType: AttendanceEventType.ENTRY, isActive: true },
      orderBy: { timestamp: 'desc' },
    });
    if (!lastEntry) return null;

    const exitAfter = await this.prisma.attendanceLog.findFirst({
      where: {
        employeeId,
        eventType: AttendanceEventType.EXIT,
        isActive: true,
        timestamp: { gt: lastEntry.timestamp },
      },
    });
    return exitAfter ? null : lastEntry;
  }

  findAllForDay(employeeId: string, workDate: Date): Promise<AttendanceLog[]> {
    return this.prisma.attendanceLog.findMany({
      where: { employeeId, workDate, isActive: true },
      orderBy: { timestamp: 'asc' },
    });
  }

  create(data: CreateAttendanceLogData): Promise<AttendanceLog> {
    return this.prisma.attendanceLog.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        locationId: data.locationId,
        eventType: data.eventType,
        shift: data.shift ?? null,
        workDate: data.workDate,
        notes: data.notes ?? null,
      },
    });
  }

  async listHistory(filters: AttendanceHistoryFilters): Promise<AttendanceLogFull[]> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId, isActive: true };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.locationId) where.locationId = filters.locationId;

    if (filters.dateFrom || filters.dateTo) {
      const workDate: Record<string, Date> = {};
      if (filters.dateFrom) workDate.gte = filters.dateFrom;
      if (filters.dateTo) workDate.lte = filters.dateTo;
      where.workDate = workDate;
    }

    return this.prisma.attendanceLog.findMany({
      where,
      include: {
        employee: { include: { user: true } },
        location: true,
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    }) as Promise<AttendanceLogFull[]>;
  }

  async listActiveAtLocation(locationId: string, tenantId: string): Promise<AttendanceLogFull[]> {
    const today = this.getTodayWorkDate();

    const logs = await this.prisma.attendanceLog.findMany({
      where: { locationId, tenantId, workDate: today, isActive: true },
      orderBy: { timestamp: 'asc' },
      include: {
        employee: { include: { user: true } },
        location: true,
      },
    });

    // Group by employeeId, keep the most recent log per employee.
    // If the last log is ENTRY → employee is currently at the location.
    const lastByEmployee = new Map<string, (typeof logs)[0]>();
    for (const log of logs) {
      lastByEmployee.set(log.employeeId, log);
    }

    return Array.from(lastByEmployee.values()).filter(
      (log) => log.eventType === AttendanceEventType.ENTRY,
    ) as AttendanceLogFull[];
  }

  findById(id: string, tenantId: string): Promise<AttendanceLogFull | null> {
    return this.prisma.attendanceLog.findFirst({
      where: { id, tenantId, isActive: true },
      include: {
        employee: { include: { user: true } },
        location: true,
      },
    }) as Promise<AttendanceLogFull | null>;
  }

  private getTodayWorkDate(): Date {
    return normalizeWorkDate(new Date());
  }
}

export function normalizeWorkDate(timestamp: Date): Date {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(timestamp);
  return new Date(`${dateStr}T00:00:00.000Z`);
}
