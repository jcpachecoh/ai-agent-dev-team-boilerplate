import { Injectable } from '@nestjs/common';
import { FinancialPaymentStatus, NovedadStatus, NovedadType, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreatePayrollNovedadData,
  EditableNovedadSnapshot,
  IPayrollNovedadesRepository,
  NovedadAuditLogRecord,
  NovedadListFilters,
  OverlapCheckResult,
  PayrollNovedadPayrollPeriodRange,
  PayrollNovedadRecord,
  PayrollNovedadSummary,
  UpdatePayrollNovedadData,
  EmployeeApprovalContext,
} from '../interfaces/payroll-novedades.interfaces';

const ACTIVE_OVERLAP_STATUSES: NovedadStatus[] = [
  NovedadStatus.SOLICITADA,
  NovedadStatus.PENDIENTE_SUPERVISOR,
  NovedadStatus.PENDIENTE_RRHH,
  NovedadStatus.APROBADA,
];

@Injectable()
export class PayrollNovedadesRepository implements IPayrollNovedadesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, id: string): Promise<PayrollNovedadRecord | null> {
    const row = await this.prisma.payrollNovedad.findFirst({
      where: { tenantId, id, deletedAt: null },
    });
    return row ? this.mapRecord(row) : null;
  }

  async create(tenantId: string, data: CreatePayrollNovedadData): Promise<PayrollNovedadRecord> {
    const row = await this.prisma.payrollNovedad.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        isPaid: data.isPaid,
        linkedLeaveId: data.linkedLeaveId ?? null,
        supportStorageObjectId: data.supportStorageObjectId ?? null,
        notes: data.notes ?? null,
        requestedBy: data.requestedBy,
        status: data.status,
        overlapWarningAck: data.overlapWarningAck ?? false,
        rrhhApproverId: data.rrhhApproverId ?? null,
        rrhhDecisionAt: data.rrhhDecisionAt ?? null,
      },
    });
    return this.mapRecord(row);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdatePayrollNovedadData,
  ): Promise<PayrollNovedadRecord> {
    const row = await this.prisma.payrollNovedad.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.supervisorApproverId !== undefined
          ? { supervisorApproverId: data.supervisorApproverId }
          : {}),
        ...(data.supervisorDecisionAt !== undefined
          ? { supervisorDecisionAt: data.supervisorDecisionAt }
          : {}),
        ...(data.supervisorComment !== undefined
          ? { supervisorComment: data.supervisorComment }
          : {}),
        ...(data.rrhhApproverId !== undefined ? { rrhhApproverId: data.rrhhApproverId } : {}),
        ...(data.rrhhDecisionAt !== undefined ? { rrhhDecisionAt: data.rrhhDecisionAt } : {}),
        ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
        ...(data.supportStorageObjectId !== undefined
          ? { supportStorageObjectId: data.supportStorageObjectId }
          : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
        ...(data.isPaid !== undefined ? { isPaid: data.isPaid } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    if (row.tenantId !== tenantId) {
      throw new Error(`PayrollNovedad ${id} does not belong to tenant ${tenantId}`);
    }

    return this.mapRecord(row);
  }

  async listSummaries(
    tenantId: string,
    filters: NovedadListFilters,
  ): Promise<PayrollNovedadSummary[]> {
    const take = filters.take ?? 20;
    const rows = await this.prisma.payrollNovedad.findMany({
      where: this.buildListWhere(tenantId, filters),
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
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

    return rows.slice(0, take).map((row) => ({
      ...this.mapRecord(row),
      employeeName: row.employee?.name ?? '',
      locationId: row.employee?.locationId ?? null,
      locationName: row.employee?.location?.name ?? null,
    }));
  }

  async findOverlapping(
    tenantId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<OverlapCheckResult> {
    const rows = await this.prisma.payrollNovedad.findMany({
      where: {
        tenantId,
        employeeId,
        deletedAt: null,
        status: { in: ACTIVE_OVERLAP_STATUSES },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return {
      hasOverlap: rows.length > 0,
      conflictingNovedadIds: rows.map((row) => row.id),
    };
  }

  async findActiveRangesForEmployeeInPeriod(
    tenantId: string,
    employeeId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Array<{ startDate: Date; endDate: Date; type: NovedadType }>> {
    return this.prisma.payrollNovedad.findMany({
      where: {
        tenantId,
        employeeId,
        deletedAt: null,
        status: { in: ACTIVE_OVERLAP_STATUSES },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      select: { startDate: true, endDate: true, type: true },
      orderBy: { startDate: 'asc' },
    });
  }

  async findApprovedForPeriodByEmployeeIds(
    tenantId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date,
  ): Promise<PayrollNovedadPayrollPeriodRange[]> {
    if (employeeIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.payrollNovedad.findMany({
      where: {
        tenantId,
        employeeId: { in: employeeIds },
        deletedAt: null,
        status: NovedadStatus.APROBADA,
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
      orderBy: [{ employeeId: 'asc' }, { startDate: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      type: row.type,
      startDate: row.startDate,
      endDate: row.endDate,
      isPaid: row.isPaid,
    }));
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

  async findSupervisorCandidatesInLocation(
    tenantId: string,
    locationId: string,
  ): Promise<Array<{ id: string; positionId: string | null }>> {
    const rows = await this.prisma.userLocation.findMany({
      where: {
        tenantId,
        locationId,
        user: {
          tenantId,
          deletedAt: null,
          isActive: true,
          role: { code: { in: ['SUPERVISOR', 'MANAGER'] } },
        },
      },
      select: {
        user: {
          select: {
            id: true,
            employeeDetails: { select: { positionId: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.user.id,
      positionId: row.user.employeeDetails?.positionId ?? null,
    }));
  }

  async findEmployeeIdsInScope(
    tenantId: string,
    locationIds: string[],
    subordinatePositionIds: string[],
  ): Promise<string[]> {
    if (locationIds.length === 0) {
      return [];
    }

    const employees = await this.prisma.employeeDetails.findMany({
      where: {
        tenantId,
        isActive: true,
        deletedAt: null,
        locationId: { in: locationIds },
        ...(subordinatePositionIds.length > 0
          ? { positionId: { in: subordinatePositionIds } }
          : {}),
      },
      select: { id: true },
    });

    return employees.map((employee) => employee.id);
  }

  async updateEditableFields(
    tenantId: string,
    id: string,
    data: Pick<UpdatePayrollNovedadData, 'startDate' | 'endDate' | 'isPaid' | 'notes'>,
    auditLog: {
      changedBy: string;
      previousValue: EditableNovedadSnapshot;
      newValue: EditableNovedadSnapshot;
    },
  ): Promise<PayrollNovedadRecord> {
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payrollNovedad.update({
        where: { id },
        data: {
          ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
          ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
          ...(data.isPaid !== undefined ? { isPaid: data.isPaid } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      if (updated.tenantId !== tenantId) {
        throw new Error(`PayrollNovedad ${id} does not belong to tenant ${tenantId}`);
      }

      await tx.novedadAuditLog.create({
        data: {
          tenantId,
          novedadId: id,
          changedBy: auditLog.changedBy,
          previousValue: auditLog.previousValue as unknown as Prisma.InputJsonValue,
          newValue: auditLog.newValue as unknown as Prisma.InputJsonValue,
        },
      });

      return updated;
    });

    return this.mapRecord(row);
  }

  async listAuditLogsByNovedadId(
    tenantId: string,
    novedadId: string,
  ): Promise<NovedadAuditLogRecord[]> {
    const rows = await this.prisma.novedadAuditLog.findMany({
      where: { tenantId, novedadId },
      orderBy: { changedAt: 'desc' },
      include: {
        novedad: {
          select: { id: true },
        },
      },
    });

    const userIds = [...new Set(rows.map((row) => row.changedBy))];
    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { tenantId, id: { in: userIds } },
            select: {
              id: true,
              email: true,
              employeeDetails: { select: { name: true } },
            },
          })
        : [];
    const userNameById = new Map(
      users.map((user) => [user.id, user.employeeDetails?.name ?? user.email]),
    );

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      novedadId: row.novedadId,
      changedBy: row.changedBy,
      changedAt: row.changedAt,
      previousValue: row.previousValue as unknown as EditableNovedadSnapshot,
      newValue: row.newValue as unknown as EditableNovedadSnapshot,
      changedByName: userNameById.get(row.changedBy) ?? null,
    }));
  }

  async isConsumedByProcessedPayroll(
    tenantId: string,
    novedad: Pick<PayrollNovedadRecord, 'employeeId' | 'status' | 'startDate' | 'endDate'>,
  ): Promise<boolean> {
    if (novedad.status !== NovedadStatus.APROBADA) {
      return false;
    }

    const employee = await this.prisma.employeeDetails.findFirst({
      where: { tenantId, id: novedad.employeeId, deletedAt: null },
      select: {
        financialProfile: { select: { id: true } },
      },
    });

    const financialProfileId = employee?.financialProfile?.id;
    if (!financialProfileId) {
      return false;
    }

    const periods = this.enumerateMonthPeriods(novedad.startDate, novedad.endDate);
    if (periods.length === 0) {
      return false;
    }

    const paidCount = await this.prisma.employeePaymentHistory.count({
      where: {
        tenantId,
        financialProfileId,
        status: FinancialPaymentStatus.PAID,
        OR: periods.map(({ year, month }) => ({ periodYear: year, periodMonth: month })),
      },
    });

    return paidCount > 0;
  }

  private enumerateMonthPeriods(
    startDate: Date,
    endDate: Date,
  ): Array<{ year: number; month: number }> {
    const periods: Array<{ year: number; month: number }> = [];
    const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
    const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));

    while (cursor.getTime() <= end.getTime()) {
      periods.push({
        year: cursor.getUTCFullYear(),
        month: cursor.getUTCMonth() + 1,
      });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return periods;
  }

  private buildListWhere(
    tenantId: string,
    filters: NovedadListFilters,
  ): Prisma.PayrollNovedadWhereInput {
    const where: Prisma.PayrollNovedadWhereInput = {
      tenantId,
      deletedAt: null,
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
    };

    if (filters.status?.length) {
      where.status = { in: filters.status };
    } else if (filters.supervisorInbox) {
      where.status = NovedadStatus.PENDIENTE_SUPERVISOR;
    } else if (filters.rrhhInbox) {
      where.status = NovedadStatus.PENDIENTE_RRHH;
    }

    if (filters.employeeIds?.length) {
      where.employeeId = { in: filters.employeeIds };
    }

    if (filters.locationId) {
      where.employee = {
        locationId: filters.locationId,
        tenantId,
      };
    }

    const dateFilters: Prisma.PayrollNovedadWhereInput[] = [];
    if (filters.startDateFrom) {
      dateFilters.push({ endDate: { gte: filters.startDateFrom } });
    }
    if (filters.startDateTo) {
      dateFilters.push({ startDate: { lte: filters.startDateTo } });
    }
    if (dateFilters.length > 0) {
      where.AND = dateFilters;
    }

    return where;
  }

  private mapRecord(row: {
    id: string;
    tenantId: string;
    employeeId: string;
    type: NovedadType;
    startDate: Date;
    endDate: Date;
    isPaid: boolean;
    linkedLeaveId: string | null;
    supportStorageObjectId: string | null;
    notes: string | null;
    requestedBy: PayrollNovedadRecord['requestedBy'];
    status: NovedadStatus;
    supervisorApproverId: string | null;
    supervisorDecisionAt: Date | null;
    supervisorComment: string | null;
    rrhhApproverId: string | null;
    rrhhDecisionAt: Date | null;
    rejectionReason: string | null;
    overlapWarningAck: boolean;
    isEditable: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): PayrollNovedadRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      type: row.type,
      startDate: row.startDate,
      endDate: row.endDate,
      isPaid: row.isPaid,
      linkedLeaveId: row.linkedLeaveId,
      supportStorageObjectId: row.supportStorageObjectId,
      notes: row.notes,
      requestedBy: row.requestedBy,
      status: row.status,
      supervisorApproverId: row.supervisorApproverId,
      supervisorDecisionAt: row.supervisorDecisionAt,
      supervisorComment: row.supervisorComment,
      rrhhApproverId: row.rrhhApproverId,
      rrhhDecisionAt: row.rrhhDecisionAt,
      rejectionReason: row.rejectionReason,
      overlapWarningAck: row.overlapWarningAck,
      isEditable: row.isEditable,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }
}
