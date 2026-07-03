import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { TurnoRecord } from '../interfaces/turnos.interfaces';
import { TurnosService } from '../service/turnos.service';
import {
  TURNOS_READ_PERMISSION,
  TURNOS_READ_ROLES,
  TURNOS_WRITE_PERMISSION,
  TURNOS_WRITE_ROLES,
} from '../turnos.constants';
import { CreateTurnoDto, UpdateTurnoDto } from './dto/create-turno.dto';
import { ExportTurnosQueryDto, ListTurnosQueryDto } from './dto/list-turnos-query.dto';
import { PatchTurnoEstadoDto } from './dto/patch-turno-estado.dto';
import { TurnoResponseDto, TurnosListResponseDto } from './dto/turno-response.dto';

function resolveTenantId(user: JwtPayload, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toTurnoResponse(turno: TurnoRecord): TurnoResponseDto {
  return {
    id: turno.id,
    nombre: turno.nombre,
    sigla: turno.sigla,
    tipo: turno.tipo,
    jornada: turno.jornada,
    horaInicio: turno.horaInicio,
    horaFin: turno.horaFin,
    estado: turno.estado,
    createdAt: turno.createdAt,
    updatedAt: turno.updatedAt,
  };
}

@ApiTags('turnos')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @ApiOperation({ summary: 'Exportar turnos a Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiNoContentResponse({ description: 'Sin registros para exportar' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_READ_ROLES)
  @RequirePermission(TURNOS_READ_PERMISSION)
  @Get('exportar')
  async exportar(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ExportTurnosQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    if (query.formato !== 'excel') {
      throw new BadRequestException('formato debe ser excel');
    }

    const tenantId = resolveTenantId(user, headerTenantId);
    const { formato: _formato, page: _page, limit: _limit, ...filters } = query;
    const buffer = await this.turnosService.exportExcel(tenantId, filters, user.sub);

    if (!buffer) {
      res.status(204).send();
      return;
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="turnos.xlsx"');
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Listar turnos con filtros y paginación' })
  @ApiOkResponse({ type: TurnosListResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_READ_ROLES)
  @RequirePermission(TURNOS_READ_PERMISSION)
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListTurnosQueryDto,
  ): Promise<TurnosListResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const result = await this.turnosService.findAll(tenantId, query);
    return {
      data: result.data.map(toTurnoResponse),
      pagination: result.pagination,
    };
  }

  @ApiOperation({ summary: 'Crear turno' })
  @ApiResponse({ status: 201, type: TurnoResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_WRITE_ROLES)
  @RequirePermission(TURNOS_WRITE_PERMISSION)
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CreateTurnoDto,
  ): Promise<TurnoResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const turno = await this.turnosService.create(tenantId, body, user.sub);
    return toTurnoResponse(turno);
  }

  @ApiOperation({ summary: 'Editar turno' })
  @ApiOkResponse({ type: TurnoResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_WRITE_ROLES)
  @RequirePermission(TURNOS_WRITE_PERMISSION)
  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateTurnoDto,
  ): Promise<TurnoResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const turno = await this.turnosService.update(tenantId, id, body, user.sub);
    return toTurnoResponse(turno);
  }

  @ApiOperation({ summary: 'Activar o desactivar turno' })
  @ApiOkResponse({ type: TurnoResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNOS_WRITE_ROLES)
  @RequirePermission(TURNOS_WRITE_PERMISSION)
  @Patch(':id/estado')
  async updateEstado(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: PatchTurnoEstadoDto,
  ): Promise<TurnoResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const turno = await this.turnosService.updateEstado(tenantId, id, body.estado, user.sub);
    return toTurnoResponse(turno);
  }
}
