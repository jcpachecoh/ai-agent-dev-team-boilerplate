import { BadRequestException, Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { ResolvedShift } from '../interfaces/employee-shift-assignment.interfaces';
import { ShiftResolutionService } from '../service/shift-resolution.service';
import { parseDateOnly } from '../turno-assignments.utils';
import { TURNOS_READ_PERMISSION, TURNOS_READ_ROLES } from '../turnos.constants';
import { ResolveShiftQueryDto, ResolvedShiftResponseDto } from './dto/resolve-shift-query.dto';

function resolveTenantId(user: JwtPayload, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toResolvedResponse(resolved: ResolvedShift): ResolvedShiftResponseDto {
  if (resolved.kind === 'ASSIGNED') {
    return {
      kind: resolved.kind,
      source: resolved.source,
      targetMinutes: resolved.targetMinutes,
      shift: {
        id: resolved.turno.id,
        nombre: resolved.turno.nombre,
        sigla: resolved.turno.sigla,
        horaInicio: resolved.turno.horaInicio,
        horaFin: resolved.turno.horaFin,
        jornada: resolved.turno.jornada,
        locationId: resolved.turno.locationId,
        daysOfWeek: resolved.turno.daysOfWeek,
        targetMinutes: resolved.targetMinutes,
      },
    };
  }

  return {
    kind: resolved.kind,
    targetMinutes: resolved.targetMinutes,
    shift: null,
  };
}

@ApiTags('turnos')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('turnos')
export class ShiftResolutionController {
  constructor(private readonly shiftResolutionService: ShiftResolutionService) {}

  @ApiOperation({ summary: 'Resolver turno efectivo de un empleado para un día' })
  @ApiOkResponse({ type: ResolvedShiftResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_READ_ROLES)
  @RequirePermission(TURNOS_READ_PERMISSION)
  @Get('resolver')
  async resolve(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ResolveShiftQueryDto,
  ): Promise<ResolvedShiftResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const resolved = await this.shiftResolutionService.resolveForDay({
      tenantId,
      employeeId: query.employeeId,
      locationId: query.locationId,
      workDate: parseDateOnly(query.workDate),
    });
    return toResolvedResponse(resolved);
  }
}
