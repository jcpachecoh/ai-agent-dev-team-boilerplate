import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WeeklyShiftPlanStatus } from '@prisma/client';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import type {
  ActorContext,
  IWeeklyShiftPlanService,
  WeeklyShiftPlanRecord,
} from '../interfaces/weekly-shift-plan.interfaces';
import { WeeklyShiftPlanRepository } from '../repository/weekly-shift-plan.repository';
import { getMondayOfWeek } from '../turno-assignments.utils';
import {
  TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES,
  WEEKLY_SHIFT_PLAN_APPROVE_FORBIDDEN_MESSAGE,
  WEEKLY_SHIFT_PLAN_APPROVE_ROLES,
  WEEKLY_SHIFT_PLAN_INVALID_TRANSITION_MESSAGE,
  WEEKLY_SHIFT_PLAN_REJECT_REASON_REQUIRED_MESSAGE,
} from '../turnos.constants';

@Injectable()
export class WeeklyShiftPlanService implements IWeeklyShiftPlanService {
  constructor(
    private readonly repository: WeeklyShiftPlanRepository,
    private readonly userLocationsService: UserLocationsService,
  ) {}

  async getOrCreatePlan(
    tenantId: string,
    actor: ActorContext,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord> {
    const monday = getMondayOfWeek(weekStart);
    await this.assertLocationAccess(tenantId, actor, locationId);
    await this.assertLocationExists(tenantId, locationId);

    const existing = await this.repository.findByLocationAndWeek(tenantId, locationId, monday);
    if (existing) {
      return existing;
    }

    return this.repository.createDraft(tenantId, locationId, monday);
  }

  async getPlan(
    tenantId: string,
    actor: ActorContext,
    locationId: string,
    weekStart: Date,
  ): Promise<WeeklyShiftPlanRecord | null> {
    const monday = getMondayOfWeek(weekStart);
    await this.assertLocationAccess(tenantId, actor, locationId);
    return this.repository.findByLocationAndWeek(tenantId, locationId, monday);
  }

  async submitForApproval(
    tenantId: string,
    actor: ActorContext,
    planId: string,
  ): Promise<WeeklyShiftPlanRecord> {
    const plan = await this.requirePlan(tenantId, planId);
    await this.assertLocationAccess(tenantId, actor, plan.locationId);

    if (
      plan.status !== WeeklyShiftPlanStatus.DRAFT &&
      plan.status !== WeeklyShiftPlanStatus.REJECTED
    ) {
      throw new ConflictException(WEEKLY_SHIFT_PLAN_INVALID_TRANSITION_MESSAGE);
    }

    const now = new Date();
    return this.persistStatus(tenantId, plan.id, {
      status: WeeklyShiftPlanStatus.PENDING_APPROVAL,
      submittedByUserId: actor.userId,
      submittedAt: now,
      rejectedByUserId: null,
      rejectedAt: null,
      rejectionReason: null,
    });
  }

  async approve(
    tenantId: string,
    actor: ActorContext,
    planId: string,
  ): Promise<WeeklyShiftPlanRecord> {
    this.assertCanApprove(actor);
    const plan = await this.requirePlan(tenantId, planId);
    await this.assertLocationAccess(tenantId, actor, plan.locationId);

    if (plan.status !== WeeklyShiftPlanStatus.PENDING_APPROVAL) {
      throw new ConflictException(WEEKLY_SHIFT_PLAN_INVALID_TRANSITION_MESSAGE);
    }

    const now = new Date();
    return this.persistStatus(tenantId, plan.id, {
      status: WeeklyShiftPlanStatus.APPROVED,
      approvedByUserId: actor.userId,
      approvedAt: now,
      rejectedByUserId: null,
      rejectedAt: null,
      rejectionReason: null,
    });
  }

  async reject(
    tenantId: string,
    actor: ActorContext,
    planId: string,
    reason: string,
  ): Promise<WeeklyShiftPlanRecord> {
    this.assertCanApprove(actor);
    const trimmed = reason?.trim() ?? '';
    if (!trimmed) {
      throw new BadRequestException(WEEKLY_SHIFT_PLAN_REJECT_REASON_REQUIRED_MESSAGE);
    }

    const plan = await this.requirePlan(tenantId, planId);
    await this.assertLocationAccess(tenantId, actor, plan.locationId);

    if (plan.status !== WeeklyShiftPlanStatus.PENDING_APPROVAL) {
      throw new ConflictException(WEEKLY_SHIFT_PLAN_INVALID_TRANSITION_MESSAGE);
    }

    const now = new Date();
    return this.persistStatus(tenantId, plan.id, {
      status: WeeklyShiftPlanStatus.REJECTED,
      rejectedByUserId: actor.userId,
      rejectedAt: now,
      rejectionReason: trimmed,
    });
  }

  async assertPlanOperational(
    tenantId: string,
    locationId: string,
    weekStart: Date,
  ): Promise<boolean> {
    const monday = getMondayOfWeek(weekStart);
    const plan = await this.repository.findByLocationAndWeek(tenantId, locationId, monday);
    return plan?.status === WeeklyShiftPlanStatus.APPROVED;
  }

  private async persistStatus(
    tenantId: string,
    planId: string,
    data: Parameters<WeeklyShiftPlanRepository['updateStatus']>[2],
  ): Promise<WeeklyShiftPlanRecord> {
    const updated = await this.repository.updateStatus(tenantId, planId, data);
    if (!updated) {
      throw new NotFoundException(`Plan semanal "${planId}" no encontrado`);
    }
    return updated;
  }

  private async requirePlan(tenantId: string, planId: string): Promise<WeeklyShiftPlanRecord> {
    const plan = await this.repository.findById(tenantId, planId);
    if (!plan) {
      throw new NotFoundException(`Plan semanal "${planId}" no encontrado`);
    }
    return plan;
  }

  private assertCanApprove(actor: ActorContext): void {
    if (!(WEEKLY_SHIFT_PLAN_APPROVE_ROLES as readonly string[]).includes(actor.roleCode)) {
      throw new ForbiddenException(WEEKLY_SHIFT_PLAN_APPROVE_FORBIDDEN_MESSAGE);
    }
  }

  private async assertLocationExists(tenantId: string, locationId: string): Promise<void> {
    const exists = await this.repository.locationExists(tenantId, locationId);
    if (!exists) {
      throw new NotFoundException(`Sede "${locationId}" no encontrada`);
    }
  }

  private async assertLocationAccess(
    tenantId: string,
    actor: ActorContext,
    locationId: string,
  ): Promise<void> {
    const isScoped = (TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES as readonly string[]).includes(
      actor.roleCode,
    );
    if (!isScoped) {
      return;
    }

    const allowed = await this.userLocationsService.resolveAllowedLocationIds(tenantId, {
      userId: actor.userId,
      roleCode: actor.roleCode,
    });
    this.userLocationsService.assertLocationAllowed(allowed, locationId);
  }
}
