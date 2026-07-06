import { Injectable } from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLog,
  AttendanceLogSource,
  AttendanceObservation,
  EmployeeDetails,
  LaborClassification,
  Location,
  User,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AlertDismissalRecord,
  AttendanceHistoryFilters,
  AttendanceLogFull,
  AttendanceLogWithEmployee,
  AttendanceObservationFull,
  CreateAttendanceLogData,
  CreateManualLogData,
  EmployeeWithUser,
  IAttendanceRepository,
  LaborClassificationCounts,
  RegisterEventLogData,
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
        createdBy: { select: { email: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit ?? 500,
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

  findLocationById(locationId: string, tenantId: string): Promise<Location | null> {
    return this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null },
    });
  }

  findEmployeesAtLocation(
    locationId: string,
    tenantId: string,
    laborClassifications?: LaborClassification[],
  ): Promise<EmployeeWithUser[]> {
    return this.prisma.employeeDetails.findMany({
      where: {
        locationId,
        tenantId,
        isActive: true,
        deletedAt: null,
        ...(laborClassifications ? { laborClassification: { in: laborClassifications } } : {}),
      },
      include: { user: true },
      orderBy: { name: 'asc' },
    }) as Promise<EmployeeWithUser[]>;
  }

  async countByLaborClassification(
    locationId: string,
    tenantId: string,
  ): Promise<LaborClassificationCounts> {
    const groups = await this.prisma.employeeDetails.groupBy({
      by: ['laborClassification'],
      where: { locationId, tenantId, isActive: true, deletedAt: null },
      _count: { _all: true },
    });

    const counts: LaborClassificationCounts = { cocina: 0, servicio: 0, administrativo: 0 };
    for (const group of groups) {
      counts[group.laborClassification.toLowerCase() as keyof LaborClassificationCounts] =
        group._count._all;
    }
    return counts;
  }

  async findTenantLabel(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { name: true, tradeName: true, legalName: true },
    });
    if (!tenant) return 'Empresa';
    return tenant.tradeName ?? tenant.legalName ?? tenant.name;
  }

  listActiveLocations(tenantId: string, locationIds?: string[]): Promise<Location[]> {
    return this.prisma.location.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        ...(locationIds?.length ? { id: { in: locationIds } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async listControlPanelLogs(
    filters: AttendanceHistoryFilters & {
      locationIds?: string[];
      laborClassifications?: LaborClassification[];
    },
  ): Promise<AttendanceLogFull[]> {
    const where: Record<string, unknown> = { tenantId: filters.tenantId, isActive: true };

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.locationIds?.length) where.locationId = { in: filters.locationIds };
    if (filters.laborClassifications?.length) {
      where.employee = { laborClassification: { in: filters.laborClassifications } };
    }

    if (filters.dateFrom || filters.dateTo) {
      const workDate: Record<string, Date> = {};
      if (filters.dateFrom) workDate.gte = filters.dateFrom;
      if (filters.dateTo) workDate.lte = filters.dateTo;
      where.workDate = workDate;
    }

    return this.prisma.attendanceLog.findMany({
      where,
      include: {
        employee: {
          include: {
            user: true,
            personalData: {
              select: { nombres: true, primerApellido: true, segundoApellido: true },
            },
            photoStorageObject: { select: { key: true } },
          },
        },
        location: true,
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit ?? 5000,
      skip: filters.offset ?? 0,
    }) as Promise<AttendanceLogFull[]>;
  }

  async findDuplicateEvent(params: {
    employeeId: string;
    eventType: AttendanceEventType;
    source: AttendanceLogSource;
    timestamp: Date;
    windowMs: number;
  }): Promise<AttendanceLog | null> {
    const from = new Date(params.timestamp.getTime() - params.windowMs);
    const to = new Date(params.timestamp.getTime() + params.windowMs);

    return this.prisma.attendanceLog.findFirst({
      where: {
        employeeId: params.employeeId,
        eventType: params.eventType,
        source: params.source,
        isActive: true,
        timestamp: { gte: from, lte: to },
      },
    });
  }

  createEventLog(data: RegisterEventLogData): Promise<AttendanceLog> {
    return this.prisma.attendanceLog.create({
      data: {
        tenantId: data.tenantId,
        employeeId: data.employeeId,
        locationId: data.locationId,
        eventType: data.eventType,
        shift: data.shift ?? null,
        workDate: data.workDate,
        timestamp: data.timestamp,
        notes: data.notes ?? null,
        source: data.source,
        createdByUserId: data.createdByUserId ?? null,
        manualReason: data.manualReason ?? null,
        manualParentLogId: data.manualParentLogId ?? null,
        validationStatus: data.validationStatus ?? null,
        clientLatitude: data.clientLatitude ?? null,
        clientLongitude: data.clientLongitude ?? null,
        distanceMeters: data.distanceMeters ?? null,
        radiusMeters: data.radiusMeters ?? null,
        storageObjectId: data.storageObjectId ?? null,
        photoUrl: data.photoUrl ?? null,
        facialMatchScore: data.facialMatchScore ?? null,
        facialMatchResult: data.facialMatchResult ?? null,
        rejectionReason: data.rejectionReason ?? null,
      },
    });
  }

  async dismissAlert(
    tenantId: string,
    userId: string,
    alertKey: string,
  ): Promise<AlertDismissalRecord> {
    return this.prisma.alertDismissal.upsert({
      where: { tenantId_userId_alertKey: { tenantId, userId, alertKey } },
      update: { dismissedAt: new Date() },
      create: { tenantId, userId, alertKey },
    });
  }

  async listDismissedAlertKeys(tenantId: string, userId: string): Promise<Set<string>> {
    const rows = await this.prisma.alertDismissal.findMany({
      where: { tenantId, userId },
      select: { alertKey: true },
    });
    return new Set(rows.map((row) => row.alertKey));
  }

  private getTodayWorkDate(): Date {
    return normalizeWorkDate(new Date());
  }

  // ── OS-551 — Tarjeta de Asistencia ────────────────────────────────────────

  findLogById(id: string, tenantId: string): Promise<AttendanceLogWithEmployee | null> {
    return this.prisma.attendanceLog.findFirst({
      where: { id, tenantId },
      include: { employee: true },
    }) as Promise<AttendanceLogWithEmployee | null>;
  }

  createManualLog(data: CreateManualLogData): Promise<AttendanceLog> {
    return this.createEventLog({
      tenantId: data.tenantId,
      employeeId: data.employeeId,
      locationId: data.locationId,
      eventType: data.eventType,
      workDate: data.workDate,
      timestamp: data.timestamp,
      source: AttendanceLogSource.MANUAL,
      createdByUserId: data.createdByUserId,
      manualReason: data.manualReason,
      manualParentLogId: data.manualParentLogId ?? null,
    });
  }

  // OS-553 — la condición source=MANUAL se valida en el service antes de llamar
  // este método; aquí se repite en el `where` como defensa adicional a nivel de
  // datos (si no matchea, Prisma lanza P2025 "record not found").
  deleteManualLog(id: string, tenantId: string): Promise<AttendanceLog> {
    return this.prisma.attendanceLog.delete({
      where: { id, tenantId, source: AttendanceLogSource.MANUAL },
    });
  }

  listObservationsInRange(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<AttendanceObservationFull[]> {
    return this.prisma.attendanceObservation.findMany({
      where: {
        tenantId,
        employeeId,
        workDate: { gte: dateFrom, lte: dateTo },
      },
      include: {
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
      orderBy: { workDate: 'asc' },
    });
  }

  findObservation(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<AttendanceObservationFull | null> {
    return this.prisma.attendanceObservation.findUnique({
      where: { tenantId_employeeId_workDate: { tenantId, employeeId, workDate } },
      include: {
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });
  }

  upsertObservation(
    tenantId: string,
    employeeId: string,
    workDate: Date,
    note: string,
    actorUserId: string,
  ): Promise<AttendanceObservationFull> {
    return this.prisma.attendanceObservation.upsert({
      where: { tenantId_employeeId_workDate: { tenantId, employeeId, workDate } },
      create: {
        tenantId,
        employeeId,
        workDate,
        note,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      },
      update: {
        note,
        updatedByUserId: actorUserId,
      },
      include: {
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });
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
