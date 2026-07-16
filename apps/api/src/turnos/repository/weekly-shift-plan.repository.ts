import { Injectable } from '@nestjs/common';
import type { WeeklyShiftPlan, WeeklyShiftPlanStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  IWeeklyShiftPlanRepository,
  WeeklyShiftPlanRecord,
} from '../interfaces/weekly-shift-plan.interfaces';

@Injectable()
export class WeeklyShiftPlanRepository implements IWeeklyShiftPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, id: string): Promise<WeeklyShiftPlanRecord | null> {
    const row = await this.prisma.weeklyShiftPlan.findFirst({
      where: { id, tenantId },
    });
    return row ? this.toRecord(row) : null;
  }

  async findByLocationAndWeek(
    tenantId: string,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord | null> {
    const row = await this.prisma.weeklyShiftPlan.findUnique({
      where: {
        tenantId_locationId_weekStart: { tenantId, locationId, weekStart },
      },
    });
    return row ? this.toRecord(row) : null;
  }

  async createDraft(
    tenantId: string,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord> {
    const row = await this.prisma.weeklyShiftPlan.create({
      data: {
        tenantId,
        locationId,
        weekStart,
        status: 'DRAFT',
      },
    });
    return this.toRecord(row);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    data: {
      status: WeeklyShiftPlanStatus;
      submittedByUserId?: string | null;
      submittedAt?: Date | null;
      approvedByUserId?: string | null;
      approvedAt?: Date | null;
      rejectedByUserId?: string | null;
      rejectedAt?: Date | null;
      rejectionReason?: string | null;
    },
  ): Promise<WeeklyShiftPlanRecord | null> {
    const existing = await this.prisma.weeklyShiftPlan.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) {
      return null;
    }

    const row = await this.prisma.weeklyShiftPlan.update({
      where: { id: existing.id },
      data,
    });
    return this.toRecord(row);
  }

  async locationExists(tenantId: string, locationId: string): Promise<boolean> {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null },
      select: { id: true },
    });
    return location !== null;
  }

  private toRecord(row: WeeklyShiftPlan): WeeklyShiftPlanRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      locationId: row.locationId,
      weekStart: row.weekStart,
      status: row.status,
      submittedByUserId: row.submittedByUserId,
      submittedAt: row.submittedAt,
      approvedByUserId: row.approvedByUserId,
      approvedAt: row.approvedAt,
      rejectedByUserId: row.rejectedByUserId,
      rejectedAt: row.rejectedAt,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
