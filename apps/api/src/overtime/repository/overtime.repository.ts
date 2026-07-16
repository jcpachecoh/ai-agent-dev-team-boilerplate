import { Injectable } from '@nestjs/common';
import {
  AttendanceEventType,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
  Prisma,
  AttendanceMarkingScope,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateOvertimeRequestData,
  EmployeeOvertimeApprovalStatus,
  IOvertimeRepository,
  OvertimeActorContext,
  OvertimeApprovalRecord,
  OvertimeInboxFilters,
  OvertimeInboxPage,
  OvertimeRequestDetail,
  OvertimeRequestRecord,
  OvertimeRequestSummary,
  UpdateOvertimeRequestData,
  UpsertOvertimeApprovalData,
} from '../interfaces/overtime.interfaces';

const REQUEST_INCLUDE = {
  employee: {
    select: {
      user: { select: { email: true } },
    },
  },
  location: { select: { name: true } },
  approvals: { orderBy: { level: 'asc' as const } },
} satisfies Prisma.OvertimeRequestInclude;

function mapApproval(row: {
  id: string;
  tenantId: string;
  overtimeRequestId: string;
  level: OvertimeApprovalLevel;
  approverId: string | null;
  decision: OvertimeApprovalRecord['decision'];
  decidedAt: Date | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}): OvertimeApprovalRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    overtimeRequestId: row.overtimeRequestId,
    level: row.level,
    approverId: row.approverId,
    decision: row.decision,
    decidedAt: row.decidedAt,
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRequest(row: {
  id: string;
  tenantId: string;
  employeeId: string;
  locationId: string;
  type: OvertimeRequestType;
  shiftEndTime: Date;
  actualEndTime: Date;
  accumulatedMinutes: number;
  status: OvertimeStatus;
  payrollPeriod: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): OvertimeRequestRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    employeeId: row.employeeId,
    locationId: row.locationId,
    type: row.type,
    shiftEndTime: row.shiftEndTime,
    actualEndTime: row.actualEndTime,
    accumulatedMinutes: row.accumulatedMinutes,
    status: row.status,
    payrollPeriod: row.payrollPeriod,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  };
}

function employeeDisplayName(email: string): string {
  return email.split('@')[0] ?? email;
}

@Injectable()
export class OvertimeRepository implements IOvertimeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, id: string): Promise<OvertimeRequestDetail | null> {
    const row = await this.prisma.overtimeRequest.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: REQUEST_INCLUDE,
    });
    if (!row) return null;

    return {
      ...mapRequest(row),
      employeeName: employeeDisplayName(row.employee.user.email),
      locationName: row.location.name,
      approvals: row.approvals.map(mapApproval),
    };
  }

  async findActiveAutomaticByPeriod(
    tenantId: string,
    employeeId: string,
    locationId: string,
    payrollPeriod: string,
  ): Promise<OvertimeRequestRecord | null> {
    const row = await this.prisma.overtimeRequest.findFirst({
      where: {
        tenantId,
        employeeId,
        locationId,
        payrollPeriod,
        type: OvertimeRequestType.DETECCION_AUTOMATICA,
        deletedAt: null,
      },
    });
    return row ? mapRequest(row) : null;
  }

  async createRequest(
    tenantId: string,
    data: CreateOvertimeRequestData,
  ): Promise<OvertimeRequestRecord> {
    const row = await this.prisma.overtimeRequest.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        locationId: data.locationId,
        type: data.type,
        shiftEndTime: data.shiftEndTime,
        actualEndTime: data.actualEndTime,
        accumulatedMinutes: data.accumulatedMinutes,
        status: data.status,
        payrollPeriod: data.payrollPeriod,
      },
    });
    return mapRequest(row);
  }

  async updateRequest(
    tenantId: string,
    id: string,
    data: UpdateOvertimeRequestData,
  ): Promise<OvertimeRequestRecord | null> {
    const existing = await this.prisma.overtimeRequest.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.overtimeRequest.update({
      where: { id },
      data,
    });
    return mapRequest(row);
  }

  async incrementAccumulatedMinutes(
    tenantId: string,
    id: string,
    delta: number,
    actualEndTime: Date,
    shiftEndTime: Date,
  ): Promise<OvertimeRequestRecord | null> {
    const existing = await this.prisma.overtimeRequest.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        accumulatedMinutes: { increment: delta },
        actualEndTime,
        shiftEndTime,
      },
    });
    return mapRequest(row);
  }

  async listInbox(tenantId: string, filters: OvertimeInboxFilters): Promise<OvertimeInboxPage> {
    const take = Math.min(Math.max(filters.take ?? 20, 1), 100);

    const rows = await this.prisma.overtimeRequest.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters.status?.length ? { status: { in: filters.status } } : {}),
        ...(filters.payrollPeriod ? { payrollPeriod: filters.payrollPeriod } : {}),
        ...(filters.locationId ? { locationId: filters.locationId } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      },
      include: {
        employee: { select: { user: { select: { email: true } } } },
        location: { select: { name: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(filters.cursor
        ? {
            cursor: { id: filters.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasNextPage = rows.length > take;
    const pageRows = hasNextPage ? rows.slice(0, -1) : rows;

    const items: OvertimeRequestSummary[] = pageRows.map((row) => ({
      ...mapRequest(row),
      employeeName: employeeDisplayName(row.employee.user.email),
      locationName: row.location.name,
    }));

    return {
      items,
      pageInfo: {
        hasNextPage,
        endCursor: items.at(-1)?.id ?? null,
      },
    };
  }

  async findApprovalsByRequestId(
    tenantId: string,
    overtimeRequestId: string,
  ): Promise<OvertimeApprovalRecord[]> {
    const rows = await this.prisma.overtimeApproval.findMany({
      where: { tenantId, overtimeRequestId },
      orderBy: { level: 'asc' },
    });
    return rows.map(mapApproval);
  }

  async upsertApproval(
    tenantId: string,
    overtimeRequestId: string,
    level: OvertimeApprovalLevel,
    data: UpsertOvertimeApprovalData,
  ): Promise<OvertimeApprovalRecord> {
    const row = await this.prisma.overtimeApproval.upsert({
      where: {
        overtimeRequestId_level: {
          overtimeRequestId,
          level,
        },
      },
      create: {
        tenantId,
        overtimeRequestId,
        level,
        approverId: data.approverId ?? null,
        decision: data.decision ?? null,
        decidedAt: data.decidedAt ?? null,
        comment: data.comment ?? null,
      },
      update: {
        approverId: data.approverId ?? null,
        decision: data.decision ?? null,
        decidedAt: data.decidedAt ?? null,
        comment: data.comment ?? null,
      },
    });
    return mapApproval(row);
  }

  async findOvertimeScopeLogsForPeriod(
    tenantId: string,
    employeeId: string,
    locationId: string,
    workDateFrom: Date,
    workDateTo: Date,
  ): Promise<
    Array<{ id: string; workDate: Date; eventType: AttendanceEventType; timestamp: Date }>
  > {
    const rows = await this.prisma.attendanceLog.findMany({
      where: {
        tenantId,
        employeeId,
        locationId,
        markingScope: AttendanceMarkingScope.OVERTIME,
        isActive: true,
        workDate: { gte: workDateFrom, lte: workDateTo },
      },
      select: { id: true, workDate: true, eventType: true, timestamp: true },
      orderBy: { timestamp: 'asc' },
    });
    return rows;
  }

  async findActorContext(tenantId: string, userId: string): Promise<OvertimeActorContext | null> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, isActive: true, deletedAt: null },
      select: {
        id: true,
        role: { select: { code: true } },
        employeeDetails: { select: { positionId: true } },
        userLocations: {
          select: { locationId: true },
        },
      },
    });
    if (!user) return null;

    return {
      userId: user.id,
      roleCode: user.role.code,
      positionId: user.employeeDetails?.positionId ?? null,
      locationIds: user.userLocations.map((row: { locationId: string }) => row.locationId),
    };
  }

  async findApproverUserIdsByPosition(
    tenantId: string,
    positionIds: readonly string[],
    locationId?: string,
  ): Promise<string[]> {
    if (positionIds.length === 0) return [];

    const rows = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        employeeDetails: {
          positionId: { in: [...positionIds] },
        },
        ...(locationId
          ? {
              userLocations: {
                some: {
                  locationId,
                },
              },
            }
          : {}),
      },
      select: { id: true },
    });

    return rows.map((row) => row.id);
  }

  async countByStatusForPeriod(
    tenantId: string,
    payrollPeriod: string,
    statuses: OvertimeStatus[],
  ): Promise<number> {
    return this.prisma.overtimeRequest.count({
      where: {
        tenantId,
        payrollPeriod,
        deletedAt: null,
        status: { in: statuses },
      },
    });
  }

  async findApprovalStatusByEmployeeIdsForPeriod(
    tenantId: string,
    employeeIds: string[],
    payrollPeriod: string,
  ): Promise<EmployeeOvertimeApprovalStatus[]> {
    if (employeeIds.length === 0) return [];

    const rows = await this.prisma.overtimeRequest.findMany({
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        payrollPeriod,
        type: OvertimeRequestType.DETECCION_AUTOMATICA,
        deletedAt: null,
      },
      select: {
        employeeId: true,
        status: true,
        accumulatedMinutes: true,
      },
    });

    return rows.map((row) => ({
      employeeId: row.employeeId,
      status: row.status,
      accumulatedMinutes: row.accumulatedMinutes,
    }));
  }
}
