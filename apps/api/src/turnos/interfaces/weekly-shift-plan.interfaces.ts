import type { WeeklyShiftPlanStatus } from '@prisma/client';

import type { ActorContext } from './turno-assignments.interfaces';

export type { ActorContext };

export interface WeeklyShiftPlanRecord {
  id: string;
  tenantId: string;
  locationId: string;
  weekStart: Date;
  status: WeeklyShiftPlanStatus;
  submittedByUserId: string | null;
  submittedAt: Date | null;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  rejectedByUserId: string | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeeklyShiftPlanRepository {
  findById(tenantId: string, id: string): Promise<WeeklyShiftPlanRecord | null>;
  findByLocationAndWeek(
    tenantId: string,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord | null>;
  createDraft(
    tenantId: string,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord>;
  updateStatus(
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
  ): Promise<WeeklyShiftPlanRecord | null>;
  locationExists(tenantId: string, locationId: string): Promise<boolean>;
}

export interface IWeeklyShiftPlanService {
  getOrCreatePlan(
    tenantId: string,
    actor: ActorContext,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord>;
  getPlan(
    tenantId: string,
    actor: ActorContext,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord | null>;
  submitForApproval(
    tenantId: string,
    actor: ActorContext,
    planId: string,
  ): Promise<WeeklyShiftPlanRecord>;
  approve(tenantId: string, actor: ActorContext, planId: string): Promise<WeeklyShiftPlanRecord>;
  reject(
    tenantId: string,
    actor: ActorContext,
    planId: string,
    reason: string,
  ): Promise<WeeklyShiftPlanRecord>;
  /** true solo si existe plan con status APPROVED para esa sede/semana. */
  assertPlanOperational(tenantId: string, locationId: string, weekStart: Date): Promise<boolean>;
}
