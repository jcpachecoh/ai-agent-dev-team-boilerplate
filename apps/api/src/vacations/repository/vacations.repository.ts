import { Injectable } from '@nestjs/common';
import { Prisma, VacationStatus, VacationType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  AccrualEmployeeRecord,
  ApprovedVacationRange,
  CreateVacationRequestData,
  EmployeeApprovalContext,
  IVacationsRepository,
  ListVacationRequestsOptions,
  UpdateVacationRequestData,
  VacationBalanceRecord,
  VacationRequestRecord,
  VacationRequestSummary,
} from '../interfaces/vacations.interfaces';

const DEFAULT_LIST_PAGE_SIZE = 20;

@Injectable()
export class VacationsRepository implements IVacationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBalanceByEmployee(
    tenantId: string,
    employeeId: string,
  ): Promise<VacationBalanceRecord | null> {
    const row = await this.prisma.vacationBalance.findFirst({
      where: { tenantId, employeeId },
    });
    return row ? this.mapBalance(row) : null;
  }

  async upsertBalance(
    tenantId: string,
    employeeId: string,
    data: Partial<
      Pick<
        VacationBalanceRecord,
        'accruedDays' | 'takenDays' | 'compensatedDays' | 'lastAccrualDate'
      >
    >,
  ): Promise<VacationBalanceRecord> {
    const row = await this.prisma.vacationBalance.upsert({
      where: { employeeId },
      create: {
        tenantId,
        employeeId,
        accruedDays: data.accruedDays ?? new Decimal(0),
        takenDays: data.takenDays ?? new Decimal(0),
        compensatedDays: data.compensatedDays ?? new Decimal(0),
        lastAccrualDate: data.lastAccrualDate ?? new Date(0),
      },
      update: {
        ...(data.accruedDays !== undefined ? { accruedDays: data.accruedDays } : {}),
        ...(data.takenDays !== undefined ? { takenDays: data.takenDays } : {}),
        ...(data.compensatedDays !== undefined ? { compensatedDays: data.compensatedDays } : {}),
        ...(data.lastAccrualDate !== undefined ? { lastAccrualDate: data.lastAccrualDate } : {}),
      },
    });
    return this.mapBalance(row);
  }

  async createRequest(
    tenantId: string,
    data: CreateVacationRequestData,
  ): Promise<VacationRequestRecord> {
    const row = await this.prisma.vacationRequest.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
        daysRequested: data.daysRequested,
        type: data.type,
        status: VacationStatus.SOLICITADA,
      },
    });
    return this.mapRequest(row);
  }

  async findRequestById(tenantId: string, id: string): Promise<VacationRequestRecord | null> {
    const row = await this.prisma.vacationRequest.findFirst({
      where: { tenantId, id, isActive: true },
    });
    return row ? this.mapRequest(row) : null;
  }

  async updateRequest(
    tenantId: string,
    id: string,
    data: UpdateVacationRequestData,
  ): Promise<VacationRequestRecord> {
    const row = await this.prisma.vacationRequest.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.level1ApprovedBy !== undefined ? { level1ApprovedBy: data.level1ApprovedBy } : {}),
        ...(data.level1ActedAt !== undefined ? { level1ActedAt: data.level1ActedAt } : {}),
        ...(data.level2ApprovedBy !== undefined ? { level2ApprovedBy: data.level2ApprovedBy } : {}),
        ...(data.level2ActedAt !== undefined ? { level2ActedAt: data.level2ActedAt } : {}),
        ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
        ...(data.letterStorageObjectId !== undefined
          ? { letterStorageObjectId: data.letterStorageObjectId }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    if (row.tenantId !== tenantId) {
      throw new Error(`VacationRequest ${id} does not belong to tenant ${tenantId}`);
    }

    return this.mapRequest(row);
  }

  async listRequests(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestRecord[]> {
    const where = this.buildListRequestsWhere(tenantId, options);
    const take = options.take !== undefined ? options.take + 1 : undefined;

    const rows = await this.prisma.vacationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });

    const pageSize = options.take ?? DEFAULT_LIST_PAGE_SIZE;
    const hasNextPage = options.take !== undefined && rows.length > pageSize;
    const edges = hasNextPage ? rows.slice(0, pageSize) : rows;

    return edges.map((row) => this.mapRequest(row));
  }

  async listRequestSummaries(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Promise<VacationRequestSummary[]> {
    const where = this.buildListRequestsWhere(tenantId, options);
    const take = options.take !== undefined ? options.take + 1 : undefined;

    const rows = await this.prisma.vacationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: {
        employee: {
          select: {
            name: true,
            locationId: true,
            location: { select: { name: true } },
          },
        },
      },
    });

    const pageSize = options.take ?? DEFAULT_LIST_PAGE_SIZE;
    const hasNextPage = options.take !== undefined && rows.length > pageSize;
    const edges = hasNextPage ? rows.slice(0, pageSize) : rows;

    return edges.map((row) => ({
      ...this.mapRequest(row),
      employeeName: row.employee?.name ?? '',
      locationId: row.employee?.locationId ?? null,
      locationName: row.employee?.location?.name ?? null,
    }));
  }

  async findApprovedDisfruteRanges(
    tenantId: string,
    employeeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<ApprovedVacationRange[]> {
    const rows = await this.prisma.vacationRequest.findMany({
      where: {
        tenantId,
        employeeId,
        type: VacationType.DISFRUTE,
        status: VacationStatus.APROBADA,
        isActive: true,
        startDate: { lte: dateTo },
        endDate: { gte: dateFrom },
      },
      orderBy: { startDate: 'asc' },
    });

    return rows.map((row) => this.mapApprovedRange(row));
  }

  async findApprovedDisfruteByDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<ApprovedVacationRange | null> {
    const dayStart = this.startOfDay(date);
    const dayEnd = this.endOfDay(date);

    const row = await this.prisma.vacationRequest.findFirst({
      where: {
        tenantId,
        employeeId,
        type: VacationType.DISFRUTE,
        status: VacationStatus.APROBADA,
        isActive: true,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
      orderBy: { startDate: 'asc' },
    });

    return row ? this.mapApprovedRange(row) : null;
  }

  async findSubordinatePositionIds(
    tenantId: string,
    supervisorPositionId: string,
  ): Promise<string[]> {
    const visited = new Set<string>([supervisorPositionId]);
    const result = new Set<string>();
    let frontier = [supervisorPositionId];

    while (frontier.length > 0) {
      const rows = await this.prisma.employeePositionSupervisor.findMany({
        where: { tenantId, supervisorPositionId: { in: frontier } },
        select: { positionId: true },
      });

      const nextFrontier: string[] = [];
      for (const row of rows) {
        if (!visited.has(row.positionId)) {
          visited.add(row.positionId);
          result.add(row.positionId);
          nextFrontier.push(row.positionId);
        }
      }
      frontier = nextFrontier;
    }

    return [...result];
  }

  async findEmployeeApprovalContext(
    tenantId: string,
    employeeId: string,
  ): Promise<EmployeeApprovalContext | null> {
    const row = await this.prisma.employeeDetails.findFirst({
      where: { tenantId, id: employeeId, isActive: true, deletedAt: null },
      select: { userId: true, locationId: true, positionId: true },
    });

    if (!row) {
      return null;
    }

    return {
      userId: row.userId,
      locationId: row.locationId,
      positionId: row.positionId,
    };
  }

  async findActiveEmployeesForAccrual(tenantId: string): Promise<AccrualEmployeeRecord[]> {
    return this.prisma.employeeDetails.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      select: { id: true, hireDate: true },
      orderBy: { hireDate: 'asc' },
    });
  }

  async findActorUser(
    tenantId: string,
    userId: string,
  ): Promise<{ roleCode: string; positionId: string | null } | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: {
        role: { select: { code: true } },
        employeeDetails: { select: { positionId: true } },
      },
    });

    if (!user) {
      return null;
    }

    return {
      roleCode: user.role.code,
      positionId: user.employeeDetails?.positionId ?? null,
    };
  }

  async findEmployeeIdByUserId(tenantId: string, userId: string): Promise<string | null> {
    const employee = await this.prisma.employeeDetails.findFirst({
      where: { tenantId, userId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    return employee?.id ?? null;
  }

  async findEmployeeHireDate(tenantId: string, employeeId: string): Promise<Date | null> {
    const employee = await this.prisma.employeeDetails.findFirst({
      where: { tenantId, id: employeeId, isActive: true, deletedAt: null },
      select: { hireDate: true },
    });
    return employee?.hireDate ?? null;
  }

  private buildListRequestsWhere(
    tenantId: string,
    options: ListVacationRequestsOptions,
  ): Prisma.VacationRequestWhereInput {
    const where: Prisma.VacationRequestWhereInput = {
      tenantId,
      isActive: true,
      ...(options.employeeId ? { employeeId: options.employeeId } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.dateFrom || options.dateTo
        ? {
            AND: [
              ...(options.dateFrom ? [{ endDate: { gte: options.dateFrom } }] : []),
              ...(options.dateTo ? [{ startDate: { lte: options.dateTo } }] : []),
            ],
          }
        : {}),
      ...(options.locationId
        ? {
            employee: {
              locationId: options.locationId,
              tenantId,
            },
          }
        : {}),
    };

    return where;
  }

  private mapBalance(row: {
    id: string;
    tenantId: string;
    employeeId: string;
    accruedDays: Decimal;
    takenDays: Decimal;
    compensatedDays: Decimal;
    lastAccrualDate: Date;
    createdAt: Date;
    updatedAt: Date;
  }): VacationBalanceRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      accruedDays: row.accruedDays,
      takenDays: row.takenDays,
      compensatedDays: row.compensatedDays,
      lastAccrualDate: row.lastAccrualDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapRequest(row: {
    id: string;
    tenantId: string;
    employeeId: string;
    startDate: Date;
    endDate: Date;
    daysRequested: Decimal;
    type: VacationType;
    status: VacationStatus;
    level1ApprovedBy: string | null;
    level1ActedAt: Date | null;
    level2ApprovedBy: string | null;
    level2ActedAt: Date | null;
    rejectionReason: string | null;
    letterStorageObjectId: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): VacationRequestRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      startDate: row.startDate,
      endDate: row.endDate,
      daysRequested: row.daysRequested,
      type: row.type,
      status: row.status,
      level1ApprovedBy: row.level1ApprovedBy,
      level1ActedAt: row.level1ActedAt,
      level2ApprovedBy: row.level2ApprovedBy,
      level2ActedAt: row.level2ActedAt,
      rejectionReason: row.rejectionReason,
      letterStorageObjectId: row.letterStorageObjectId,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapApprovedRange(row: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
    type: VacationType;
  }): ApprovedVacationRange {
    return {
      employeeId: row.employeeId,
      startDate: row.startDate,
      endDate: row.endDate,
      type: row.type,
    };
  }

  private startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private endOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }
}
