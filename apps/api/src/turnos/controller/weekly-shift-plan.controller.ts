import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { WeeklyShiftPlanRecord } from '../interfaces/weekly-shift-plan.interfaces';
import { WeeklyShiftPlanService } from '../service/weekly-shift-plan.service';
import { formatDateOnly, parseDateOnly } from '../turno-assignments.utils';
import {
  WEEKLY_SHIFT_PLAN_APPROVE_ROLES,
  WEEKLY_SHIFT_PLAN_READ_PERMISSION,
  WEEKLY_SHIFT_PLAN_READ_ROLES,
  WEEKLY_SHIFT_PLAN_SUBMIT_ROLES,
  WEEKLY_SHIFT_PLAN_WRITE_PERMISSION,
} from '../turnos.constants';
import { GetWeeklyShiftPlanQueryDto } from './dto/get-weekly-shift-plan-query.dto';
import { RejectWeeklyShiftPlanDto } from './dto/reject-weekly-shift-plan.dto';
import { WeeklyShiftPlanResponseDto } from './dto/weekly-shift-plan-response.dto';

function resolveTenantId(user: JwtPayload, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toResponse(record: WeeklyShiftPlanRecord): WeeklyShiftPlanResponseDto {
  return {
    id: record.id,
    locationId: record.locationId,
    weekStart: formatDateOnly(record.weekStart),
    status: record.status,
    submittedByUserId: record.submittedByUserId,
    submittedAt: record.submittedAt,
    approvedByUserId: record.approvedByUserId,
    approvedAt: record.approvedAt,
    rejectedByUserId: record.rejectedByUserId,
    rejectedAt: record.rejectedAt,
    rejectionReason: record.rejectionReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@ApiTags('turnos-planes-semanales')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('turnos/planes-semanales')
export class WeeklyShiftPlanController {
  constructor(private readonly planService: WeeklyShiftPlanService) {}

  @ApiOperation({
    summary: 'Obtiene o crea (DRAFT) el plan semanal de turnos para una sede',
  })
  @ApiOkResponse({ type: WeeklyShiftPlanResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...WEEKLY_SHIFT_PLAN_READ_ROLES)
  @RequirePermission(WEEKLY_SHIFT_PLAN_READ_PERMISSION)
  @Get()
  async getOrCreate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: GetWeeklyShiftPlanQueryDto,
  ): Promise<WeeklyShiftPlanResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const plan = await this.planService.getOrCreatePlan(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      query.locationId,
      parseDateOnly(query.weekStart),
    );
    return toResponse(plan);
  }

  @ApiOperation({ summary: 'Enviar plan semanal a aprobación (DRAFT/REJECTED → PENDING)' })
  @ApiOkResponse({ type: WeeklyShiftPlanResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...WEEKLY_SHIFT_PLAN_SUBMIT_ROLES)
  @RequirePermission(WEEKLY_SHIFT_PLAN_WRITE_PERMISSION)
  @Post(':id/submit')
  async submit(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<WeeklyShiftPlanResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const plan = await this.planService.submitForApproval(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      id,
    );
    return toResponse(plan);
  }

  @ApiOperation({ summary: 'Aprobar plan semanal (PENDING → APPROVED)' })
  @ApiOkResponse({ type: WeeklyShiftPlanResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...WEEKLY_SHIFT_PLAN_APPROVE_ROLES)
  @RequirePermission(WEEKLY_SHIFT_PLAN_WRITE_PERMISSION)
  @Post(':id/approve')
  async approve(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<WeeklyShiftPlanResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const plan = await this.planService.approve(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      id,
    );
    return toResponse(plan);
  }

  @ApiOperation({ summary: 'Rechazar plan semanal (PENDING → REJECTED)' })
  @ApiOkResponse({ type: WeeklyShiftPlanResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...WEEKLY_SHIFT_PLAN_APPROVE_ROLES)
  @RequirePermission(WEEKLY_SHIFT_PLAN_WRITE_PERMISSION)
  @Post(':id/reject')
  async reject(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: RejectWeeklyShiftPlanDto,
  ): Promise<WeeklyShiftPlanResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const plan = await this.planService.reject(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      id,
      body.reason,
    );
    return toResponse(plan);
  }
}
