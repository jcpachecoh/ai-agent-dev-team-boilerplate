import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateTurnoAssignmentDto } from './dto/create-turno-assignment.dto';
import { GetWeeklyAssignmentsQueryDto } from './dto/get-weekly-assignments-query.dto';
import {
  TurnoAssignmentResponseDto,
  WeeklyAssignmentsResponseDto,
} from './dto/turno-assignment-response.dto';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { TurnoAssignmentRecord } from '../interfaces/turno-assignments.interfaces';
import { TurnoAssignmentsService } from '../service/turno-assignments.service';
import { formatDateOnly, parseDateOnly } from '../turno-assignments.utils';
import {
  TURNO_ASSIGNMENTS_READ_PERMISSION,
  TURNO_ASSIGNMENTS_READ_ROLES,
  TURNO_ASSIGNMENTS_WRITE_PERMISSION,
  TURNO_ASSIGNMENTS_WRITE_ROLES,
} from '../turnos.constants';

function resolveTenantId(user: JwtPayload, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toAssignmentResponse(record: TurnoAssignmentRecord): TurnoAssignmentResponseDto {
  return {
    id: record.id,
    employeeId: record.employeeId,
    workDate: formatDateOnly(record.workDate),
    type: record.type,
    turno: record.turno,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@ApiTags('turnos-asignaciones')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('turnos/asignaciones')
export class TurnoAssignmentsController {
  constructor(private readonly assignmentsService: TurnoAssignmentsService) {}

  @ApiOperation({ summary: 'Vista semanal de asignación de turnos (colaborador x día)' })
  @ApiOkResponse({ type: WeeklyAssignmentsResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNO_ASSIGNMENTS_READ_ROLES)
  @RequirePermission(TURNO_ASSIGNMENTS_READ_PERMISSION)
  @Get()
  async findWeekly(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: GetWeeklyAssignmentsQueryDto,
  ): Promise<WeeklyAssignmentsResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    return this.assignmentsService.getWeekly(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      {
        weekStart: parseDateOnly(query.weekStart),
        search: query.search,
        field: query.field,
        page: query.page,
        limit: query.limit,
      },
    );
  }

  @ApiOperation({
    summary: 'Asignar turno o marcar descanso explícito (upsert por colaborador+fecha)',
  })
  @ApiResponse({ status: 201, type: TurnoAssignmentResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNO_ASSIGNMENTS_WRITE_ROLES)
  @RequirePermission(TURNO_ASSIGNMENTS_WRITE_PERMISSION)
  @Post()
  async assign(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CreateTurnoAssignmentDto,
  ): Promise<TurnoAssignmentResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.assignmentsService.assign(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      body,
    );
    return toAssignmentResponse(record);
  }

  @ApiOperation({ summary: 'Eliminar asignación explícita (la celda vuelve a BASE)' })
  @ApiNoContentResponse()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNO_ASSIGNMENTS_WRITE_ROLES)
  @RequirePermission(TURNO_ASSIGNMENTS_WRITE_PERMISSION)
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = resolveTenantId(user, headerTenantId);
    await this.assignmentsService.remove(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      id,
    );
  }
}
