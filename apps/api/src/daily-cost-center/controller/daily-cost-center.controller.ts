import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { formatDateOnly, parseDateOnly } from '../../turnos/turno-assignments.utils';
import {
  DAILY_COST_CENTER_READ_PERMISSION,
  DAILY_COST_CENTER_READ_ROLES,
  DAILY_COST_CENTER_WRITE_PERMISSION,
  DAILY_COST_CENTER_WRITE_ROLES,
} from '../daily-cost-center.constants';
import { DailyCostCenterService } from '../service/daily-cost-center.service';
import {
  EmployeeCalendarDayResponseDto,
  ManualAssignmentResponseDto,
  PendingAssignmentResponseDto,
} from './dto/daily-cost-center-assignment-response.dto';
import { ListAssignmentsQueryDto } from './dto/list-assignments-query.dto';
import { UpsertManualAssignmentDto } from './dto/upsert-manual-assignment.dto';

function resolveTenantId(user: JwtPayload, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

@ApiTags('daily-cost-center')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller()
export class DailyCostCenterController {
  constructor(private readonly service: DailyCostCenterService) {}

  @ApiOperation({ summary: 'Calendario de sede diaria de un empleado Rotante (CONN-06)' })
  @ApiOkResponse({ type: [EmployeeCalendarDayResponseDto] })
  @Roles(...DAILY_COST_CENTER_READ_ROLES)
  @RequirePermission(DAILY_COST_CENTER_READ_PERMISSION)
  @Get('employees/:employeeId/daily-cost-center-assignments')
  async listForEmployeeCalendar(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Query() query: ListAssignmentsQueryDto,
  ): Promise<EmployeeCalendarDayResponseDto[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const days = await this.service.listForEmployeeCalendar(
      tenantId,
      employeeId,
      parseDateOnly(query.from),
      parseDateOnly(query.to),
    );

    return days.map((day) => ({
      date: formatDateOnly(day.date),
      locationId: day.locationId,
      locationName: day.locationName,
      source: day.source,
      isPending: day.isPending,
    }));
  }

  @ApiOperation({ summary: 'Corrección manual de sede diaria (source=MANUAL, siempre gana — D2)' })
  @ApiOkResponse({ type: ManualAssignmentResponseDto })
  @Roles(...DAILY_COST_CENTER_WRITE_ROLES)
  @RequirePermission(DAILY_COST_CENTER_WRITE_PERMISSION)
  @Put('employees/:employeeId/daily-cost-center-assignments/:date')
  async assignManual(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
    @Body() body: UpsertManualAssignmentDto,
  ): Promise<ManualAssignmentResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.service.assignManual({
      tenantId,
      employeeId,
      date: parseDateOnly(date),
      locationId: body.locationId,
      actorUserId: user.sub,
    });

    return {
      id: record.id,
      employeeId: record.employeeId,
      date: formatDateOnly(record.date),
      locationId: record.locationId,
      shiftId: record.shiftId,
      source: record.source,
    };
  }

  @ApiOperation({
    summary: 'Días pendientes de asignación manual, todos los empleados Rotante (D5)',
  })
  @ApiOkResponse({ type: [PendingAssignmentResponseDto] })
  @Roles(...DAILY_COST_CENTER_READ_ROLES)
  @RequirePermission(DAILY_COST_CENTER_READ_PERMISSION)
  @Get('daily-cost-center-assignments/pending')
  async listPendingForTenant(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListAssignmentsQueryDto,
  ): Promise<PendingAssignmentResponseDto[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const pending = await this.service.listPendingForTenant(
      tenantId,
      parseDateOnly(query.from),
      parseDateOnly(query.to),
    );

    return pending.map((row) => ({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      date: formatDateOnly(row.date),
      suggestedLocationId: row.suggestedLocationId,
    }));
  }

  @ApiOperation({ summary: 'Elimina una corrección manual (solo source=MANUAL)' })
  @ApiNoContentResponse()
  @Roles(...DAILY_COST_CENTER_WRITE_ROLES)
  @RequirePermission(DAILY_COST_CENTER_WRITE_PERMISSION)
  @Delete('daily-cost-center-assignments/:id')
  @HttpCode(204)
  async deleteManual(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const deleted = await this.service.deleteManual(tenantId, id);
    if (!deleted) {
      throw new NotFoundException(`Asignación manual "${id}" no encontrada`);
    }
  }
}
