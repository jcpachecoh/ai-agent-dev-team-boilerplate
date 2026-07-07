import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { EmployeeShiftAssignmentRecord } from '../interfaces/employee-shift-assignment.interfaces';
import { EmployeeShiftAssignmentsService } from '../service/employee-shift-assignments.service';
import { formatDateOnly } from '../turno-assignments.utils';
import {
  TURNOS_READ_PERMISSION,
  TURNOS_READ_ROLES,
  TURNOS_WRITE_PERMISSION,
  TURNOS_WRITE_ROLES,
} from '../turnos.constants';
import {
  CreateEmployeeShiftAssignmentDto,
  EmployeeShiftAssignmentResponseDto,
  PatchEmployeeShiftAssignmentDto,
} from './dto/employee-shift-assignment.dto';

function resolveTenantId(user: JwtPayload, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toResponse(record: EmployeeShiftAssignmentRecord): EmployeeShiftAssignmentResponseDto {
  return {
    id: record.id,
    employeeId: record.employeeId,
    turnoId: record.turnoId,
    effectiveFrom: formatDateOnly(record.effectiveFrom),
    effectiveTo: record.effectiveTo ? formatDateOnly(record.effectiveTo) : null,
    turno: {
      id: record.turno.id,
      nombre: record.turno.nombre,
      sigla: record.turno.sigla,
      horaInicio: record.turno.horaInicio,
      horaFin: record.turno.horaFin,
      jornada: record.turno.jornada,
      locationId: record.turno.locationId,
      daysOfWeek: record.turno.daysOfWeek,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@ApiTags('turnos-empleados')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('turnos/empleados')
export class EmployeeShiftAssignmentsController {
  constructor(private readonly service: EmployeeShiftAssignmentsService) {}

  @ApiOperation({ summary: 'Historial de asignación vigente de turno por empleado' })
  @ApiOkResponse({ type: [EmployeeShiftAssignmentResponseDto] })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_READ_ROLES)
  @RequirePermission(TURNOS_READ_PERMISSION)
  @Get(':employeeId/asignaciones')
  async list(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<EmployeeShiftAssignmentResponseDto[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const rows = await this.service.listByEmployee(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      employeeId,
    );
    return rows.map(toResponse);
  }

  @ApiOperation({ summary: 'Asignar turno base vigente a un empleado' })
  @ApiResponse({ status: 201, type: EmployeeShiftAssignmentResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_WRITE_ROLES)
  @RequirePermission(TURNOS_WRITE_PERMISSION)
  @Post(':employeeId/asignaciones')
  async create(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: CreateEmployeeShiftAssignmentDto,
  ): Promise<EmployeeShiftAssignmentResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.service.create(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      employeeId,
      body,
    );
    return toResponse(record);
  }

  @ApiOperation({ summary: 'Ajustar vigencia o turno de una asignación de empleado' })
  @ApiOkResponse({ type: EmployeeShiftAssignmentResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_WRITE_ROLES)
  @RequirePermission(TURNOS_WRITE_PERMISSION)
  @Patch(':employeeId/asignaciones/:id')
  async patch(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() body: PatchEmployeeShiftAssignmentDto,
  ): Promise<EmployeeShiftAssignmentResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.service.patch(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      employeeId,
      id,
      body,
    );
    return toResponse(record);
  }
}
