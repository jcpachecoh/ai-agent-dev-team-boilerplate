import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  PAYROLL_MODULE_ROLES,
  PAYROLL_WRITE_ROLES,
  SYSTEM_ADMIN_ROLES,
} from '../../common/config/rbac.config';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceCardService } from '../service/attendance-card.service';
import { AttendanceMonitorSummaryService } from '../service/attendance-monitor-summary.service';
import { AttendanceControlPanelService } from '../service/attendance-control-panel.service';
import { AttendanceComparisonService } from '../service/attendance-comparison.service';
import { AttendanceCollaboratorsService } from '../service/attendance-collaborators.service';
import { KioskAuthDto } from './dto/kiosk-auth.dto';
import { RegisterEntryDto, RegisterExitDto } from './dto/register-event.dto';
import {
  ActiveAttendanceQueryDto,
  ListAttendanceQueryDto,
  OvertimeSummaryQueryDto,
} from './dto/list-attendance-query.dto';
import {
  ActiveAttendanceEntryDto,
  EntryResponseDto,
  ExitResponseDto,
  KioskAuthResponseDto,
  OvertimeSummaryDto,
} from './dto/attendance-summary.response';
import { MonitorSummaryQueryDto } from './dto/monitor-summary-query.dto';
import { AttendanceMonitorSummaryDto } from './dto/monitor-summary.response';
import { ControlPanelQueryDto } from './dto/control-panel-query.dto';
import { ControlPanelSummaryDto, DismissAlertResponseDto } from './dto/control-panel.response';
import { DismissAlertDto } from './dto/dismiss-alert.dto';
import { AttendanceComparisonQueryDto } from './dto/attendance-comparison-query.dto';
import { AttendanceComparisonSummaryDto } from './dto/attendance-comparison.response';
import { AttendanceCardQueryDto } from './dto/attendance-card-query.dto';
import { AttendanceCardResponseDto } from './dto/attendance-card.response';
import { UpsertAttendanceObservationDto } from './dto/upsert-attendance-observation.dto';
import { AttendanceObservationResponseDto } from './dto/attendance-observation.response';
import { CreateManualMarkingDto } from './dto/create-manual-marking.dto';
import { ManualMarkingReasonOptionDto } from './dto/manual-marking-reason-option.dto';
import { MANUAL_MARKING_REASON_CATALOG } from '../manual-marking-reason.constants';
import { ListAttendanceCollaboratorsQueryDto } from './dto/list-attendance-collaborators-query.dto';
import {
  AttendanceCollaboratorSupervisorOptionDto,
  AttendanceCollaboratorsResponseDto,
} from './dto/attendance-collaborator-response.dto';
import { PatchPortalWorkerDto, PortalWorkerResponseDto } from './dto/patch-portal-worker.dto';
import { ExportCollaboratorsQueryDto } from './dto/export-collaborators-query.dto';
import { EmailExportCollaboratorsDto } from './dto/email-export-collaborators.dto';
import { AttendanceCollaboratorAuditResponseDto } from './dto/attendance-collaborator-audit-response.dto';

@ApiTags('attendance')
@ApiHeader({
  name: 'x-tenant-id',
  required: false,
  description: 'Tenant identifier (público o JWT)',
})
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly attendanceCardService: AttendanceCardService,
    private readonly monitorSummaryService: AttendanceMonitorSummaryService,
    private readonly controlPanelService: AttendanceControlPanelService,
    private readonly comparisonService: AttendanceComparisonService,
    private readonly collaboratorsService: AttendanceCollaboratorsService,
  ) {}

  // ── Public kiosk endpoints ─────────────────────────────────────────────────
  //
  // kiosk-auth es público (sin JWT) para permitir que el dispositivo kiosko
  // opere en modo embebido sin gestionar tokens de empleados.
  // La sede del empleado se resuelve en el backend y se devuelve en la respuesta.
  // Seguridad provista por:
  //   • Scope de tenant (header x-tenant-id obligatorio)
  //   • bcrypt PIN (SALT_ROUNDS=12, hash en EmployeeDetails.pinHash)
  //   • Lockout in-memory: 3 intentos fallidos → bloqueo 15 min
  //
  // GAP conocido: lockout se pierde al reiniciar el proceso. Para persistencia
  // agregar loginAttempts/lockedUntil a EmployeeDetails (requiere migración — NOM-04).

  @Public()
  @Post('kiosk-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autenticación kiosko: cédula + PIN → userId + JWT' })
  @ApiResponse({ status: 200, type: KioskAuthResponseDto })
  @ApiResponse({ status: 401, description: 'Cédula o PIN incorrecto' })
  @ApiResponse({ status: 403, description: 'Cuenta bloqueada' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  @ApiResponse({ status: 422, description: 'PIN no configurado' })
  kioskAuth(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Body() dto: KioskAuthDto,
  ): Promise<KioskAuthResponseDto> {
    const tenantId = this.requireTenantFromHeader(tenantIdHeader);
    return this.attendanceService.kioskAuth(dto, tenantId) as Promise<KioskAuthResponseDto>;
  }

  @Public()
  @Post('entry')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar entrada (ENTRY) desde kiosko' })
  @ApiResponse({ status: 201, type: EntryResponseDto })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado en esta sede' })
  @ApiResponse({ status: 409, description: 'Ya existe una entrada activa' })
  registerEntry(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Body() dto: RegisterEntryDto,
  ): Promise<EntryResponseDto> {
    const tenantId = this.requireTenantFromHeader(tenantIdHeader);
    return this.attendanceService.registerEntry(dto, tenantId) as Promise<EntryResponseDto>;
  }

  @Public()
  @Post('exit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar salida (EXIT) desde kiosko' })
  @ApiResponse({ status: 200, type: ExitResponseDto })
  @ApiResponse({ status: 400, description: 'No hay entrada activa' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado en esta sede' })
  registerExit(
    @Headers('x-tenant-id') tenantIdHeader: string,
    @Body() dto: RegisterExitDto,
  ): Promise<ExitResponseDto> {
    const tenantId = this.requireTenantFromHeader(tenantIdHeader);
    return this.attendanceService.registerExit(dto, tenantId) as Promise<ExitResponseDto>;
  }

  // ── JWT-protected endpoints ────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get()
  @ApiOperation({ summary: 'Historial de asistencia con filtros (tenant + JWT)' })
  @ApiResponse({ status: 200, description: 'Array de AttendanceLog' })
  listHistory(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListAttendanceQueryDto,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.attendanceService.listHistory(query, tenantId, {
      sub: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    });
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('active')
  @ApiOperation({ summary: 'Empleados con entrada activa (sin salida) en una sede' })
  @ApiResponse({ status: 200, type: [ActiveAttendanceEntryDto] })
  listActive(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ActiveAttendanceQueryDto,
  ): Promise<ActiveAttendanceEntryDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    if (!query.locationId) {
      throw new BadRequestException('locationId es requerido');
    }
    return this.attendanceService.listActive(query.locationId, tenantId, {
      sub: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    }) as Promise<ActiveAttendanceEntryDto[]>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('locations/:locationId/monitor-summary')
  @ApiOperation({ summary: 'Resumen de monitor de asistencia por sede y periodo' })
  @ApiResponse({ status: 200, type: AttendanceMonitorSummaryDto })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  getMonitorSummary(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('locationId') locationId: string,
    @Query() query: MonitorSummaryQueryDto,
  ): Promise<AttendanceMonitorSummaryDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.monitorSummaryService.getMonitorSummary(
      {
        locationId,
        period: query.period,
        anchorDate: query.anchorDate,
        clasificacion: query.clasificacion,
      },
      tenantId,
      { sub: user?.sub ?? '', roleCode: user.roleCode },
    ) as Promise<AttendanceMonitorSummaryDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('control-panel/comparison')
  @ApiOperation({ summary: 'Comparativo de asistencias (periodo actual vs anterior)' })
  @ApiResponse({ status: 200, type: AttendanceComparisonSummaryDto })
  getControlPanelComparison(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: AttendanceComparisonQueryDto,
  ): Promise<AttendanceComparisonSummaryDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.comparisonService.getComparison(tenantId, query, {
      sub: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    }) as Promise<AttendanceComparisonSummaryDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('control-panel')
  @ApiOperation({
    summary: 'Panel de control de asistencia (indicadores, línea de tiempo y alertas)',
  })
  @ApiResponse({ status: 200, type: ControlPanelSummaryDto })
  getControlPanel(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ControlPanelQueryDto,
  ): Promise<ControlPanelSummaryDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.controlPanelService.getControlPanel(tenantId, user.sub, query, {
      sub: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    }) as Promise<ControlPanelSummaryDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Post('control-panel/alerts/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descartar una alerta del panel de control para el usuario autenticado',
  })
  @ApiResponse({ status: 200, type: DismissAlertResponseDto })
  dismissControlPanelAlert(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() dto: DismissAlertDto,
  ): Promise<DismissAlertResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.controlPanelService.dismissAlert(
      tenantId,
      user?.sub,
      dto.alertKey,
    ) as Promise<DismissAlertResponseDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('employees/:userId/overtime')
  @ApiOperation({ summary: 'Resumen de horas trabajadas y overtime de un empleado por día' })
  @ApiResponse({ status: 200, type: OvertimeSummaryDto })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
  getOvertimeSummary(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Query() query: OvertimeSummaryQueryDto,
  ): Promise<OvertimeSummaryDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const date = query.date ? new Date(query.date) : undefined;
    return this.attendanceService.getOvertimeSummary(
      userId,
      tenantId,
      {
        sub: user.sub,
        roleCode: user.roleCode,
      },
      date,
    ) as Promise<OvertimeSummaryDto>;
  }

  // ── OS-551 — Tarjeta de Asistencia (marcaciones manuales + observaciones) ──

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('employees/:userId/card')
  @ApiOperation({ summary: 'Tarjeta de asistencia: historial + observaciones del rango' })
  @ApiResponse({ status: 200, type: AttendanceCardResponseDto })
  getAttendanceCard(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Query() query: AttendanceCardQueryDto,
  ): Promise<AttendanceCardResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.attendanceCardService.getCard(
      userId,
      tenantId,
      query.dateFrom,
      query.dateTo,
      {
        sub: user.sub,
        roleCode: user.roleCode,
        locationId: user.locationId,
      },
      query.locationId,
    ) as unknown as Promise<AttendanceCardResponseDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('employees/:userId/observations')
  @ApiOperation({ summary: 'Observaciones del colaborador en un rango de fechas' })
  @ApiResponse({ status: 200, type: [AttendanceObservationResponseDto] })
  async getObservations(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Query() query: AttendanceCardQueryDto,
  ): Promise<AttendanceObservationResponseDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const card = await this.attendanceCardService.getCard(
      userId,
      tenantId,
      query.dateFrom,
      query.dateTo,
      { sub: user.sub, roleCode: user.roleCode, locationId: user.locationId },
      query.locationId,
    );
    return card.observations as unknown as AttendanceObservationResponseDto[];
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @Put('employees/:userId/observations')
  @ApiOperation({ summary: 'Crear o editar la observación de una fecha' })
  @ApiResponse({ status: 200, type: AttendanceObservationResponseDto })
  @ApiResponse({ status: 403, description: 'Sin permisos sobre la sede del colaborador' })
  upsertObservation(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Body() dto: UpsertAttendanceObservationDto,
  ): Promise<AttendanceObservationResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.attendanceCardService.upsertObservation(
      userId,
      tenantId,
      user,
      dto,
    ) as unknown as Promise<AttendanceObservationResponseDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @Get('manual-marking-reasons')
  @ApiOperation({ summary: 'Catálogo unificado de motivos de cambio (OS-553 / CONN-05)' })
  @ApiResponse({ status: 200, type: [ManualMarkingReasonOptionDto] })
  listManualMarkingReasons(): ManualMarkingReasonOptionDto[] {
    return MANUAL_MARKING_REASON_CATALOG;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post('employees/:userId/manual-markings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una marcación manual (source=MANUAL, no modifica DEVICE)' })
  @ApiResponse({ status: 201, description: 'AttendanceLog creado con source=MANUAL' })
  @ApiResponse({ status: 403, description: 'Sin permisos sobre la sede del colaborador' })
  @ApiResponse({ status: 400, description: 'parentLogId inválido o timestamp fuera de workDate' })
  createManualMarking(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Body() dto: CreateManualMarkingDto,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.attendanceCardService.createManualMarking(userId, tenantId, user, dto);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_WRITE_ROLES)
  @Delete('manual-markings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una marcación manual (source=MANUAL). DEVICE es inmutable.' })
  @ApiResponse({ status: 204, description: 'Marcación eliminada' })
  @ApiResponse({
    status: 403,
    description: 'Es DEVICE o sin permisos sobre la sede del colaborador',
  })
  @ApiResponse({ status: 404, description: 'Marcación no encontrada' })
  deleteManualMarking(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.attendanceCardService.deleteManualMarking(id, tenantId, user);
  }

  // ── OS-550 — Colaboradores de Asistencia (listado con búsqueda/filtros/paginación) ──

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('collaborators')
  @ApiOperation({
    summary: 'Listado de colaboradores con búsqueda, filtros, scoping de sede y paginación real',
  })
  @ApiResponse({ status: 200, type: AttendanceCollaboratorsResponseDto })
  getCollaborators(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListAttendanceCollaboratorsQueryDto,
  ): Promise<AttendanceCollaboratorsResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.collaboratorsService.list(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      {
        search: query.search,
        positionId: query.positionId,
        contractType: query.contractType,
        area: query.area,
        locationId: query.locationId,
        supervisorUserId: query.supervisorUserId,
        laborClassification: query.laborClassification,
        status: query.status ?? 'all',
        sortBy: query.sortBy,
        sortDir: query.sortDir,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      },
    ) as Promise<AttendanceCollaboratorsResponseDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('collaborators/supervisors')
  @ApiOperation({
    summary:
      'Usuarios SUPERVISOR/MANAGER visibles dentro del scope del caller (para el filtro Supervisor)',
  })
  @ApiResponse({ status: 200, type: [AttendanceCollaboratorSupervisorOptionDto] })
  getCollaboratorSupervisors(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
  ): Promise<AttendanceCollaboratorSupervisorOptionDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.collaboratorsService.listSupervisorOptions(tenantId, {
      userId: user.sub,
      roleCode: user.roleCode,
    }) as Promise<AttendanceCollaboratorSupervisorOptionDto[]>;
  }

  // ── OS-550 follow-up — Portal trabajador, exportaciones e historial mínimo ──

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @Patch('collaborators/:employeeDetailsId/portal')
  @ApiOperation({
    summary: 'Activar/desactivar el flag administrativo Portal trabajador (OWNER/SUPER_ADMIN)',
  })
  @ApiResponse({ status: 200, type: PortalWorkerResponseDto })
  @ApiResponse({ status: 404, description: 'Colaborador no encontrado en este tenant' })
  setCollaboratorPortalWorker(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeDetailsId') employeeDetailsId: string,
    @Body() dto: PatchPortalWorkerDto,
  ): Promise<PortalWorkerResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.collaboratorsService.setPortalWorkerEnabled(
      tenantId,
      employeeDetailsId,
      dto.enabled,
      user.sub,
    );
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('collaborators/export')
  @ApiOperation({
    summary: 'Exportar el listado filtrado completo (Excel/PDF), respetando scoping de sede',
  })
  @ApiResponse({ status: 200, description: 'Archivo binario (xlsx/pdf)' })
  @ApiResponse({
    status: 400,
    description: 'Sin registros para exportar con los filtros aplicados',
  })
  async exportCollaborators(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ExportCollaboratorsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const { buffer, filename } = await this.collaboratorsService.exportFile(
      tenantId,
      { userId: user?.sub ?? '', roleCode: user.roleCode },
      {
        search: query.search,
        positionId: query.positionId,
        contractType: query.contractType,
        area: query.area,
        locationId: query.locationId,
        supervisorUserId: query.supervisorUserId,
        laborClassification: query.laborClassification,
        status: query.status ?? 'all',
      },
      query.format,
      user.sub,
    );

    res.setHeader(
      'Content-Type',
      query.format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Post('collaborators/export/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar el listado filtrado completo por correo (Excel/PDF adjunto)' })
  @ApiResponse({ status: 200, description: 'Correo encolado' })
  @ApiResponse({
    status: 400,
    description: 'Destinatarios inválidos o sin registros para exportar',
  })
  async emailExportCollaborators(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() dto: EmailExportCollaboratorsDto,
  ): Promise<{ sent: true }> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    await this.collaboratorsService.emailExport(
      tenantId,
      { userId: user?.sub ?? '', roleCode: user.roleCode },
      user.email,
      {
        recipients: dto.recipients,
        format: dto.format,
        filters: {
          search: dto.filters.search,
          positionId: dto.filters.positionId,
          contractType: dto.filters.contractType,
          area: dto.filters.area,
          locationId: dto.filters.locationId,
          supervisorUserId: dto.filters.supervisorUserId,
          laborClassification: dto.filters.laborClassification,
          status: dto.filters.status ?? 'all',
        },
      },
      user.sub,
    );
    return { sent: true };
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @Get('collaborators/:employeeDetailsId/audit')
  @ApiOperation({ summary: 'Últimos 50 cambios de auditoría del colaborador (OWNER/SUPER_ADMIN)' })
  @ApiResponse({ status: 200, type: AttendanceCollaboratorAuditResponseDto })
  @ApiResponse({ status: 404, description: 'Colaborador no encontrado en este tenant' })
  async getCollaboratorAudit(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeDetailsId') employeeDetailsId: string,
  ): Promise<AttendanceCollaboratorAuditResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const items = await this.collaboratorsService.getAuditHistory(tenantId, employeeDetailsId);
    return { items };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID requerido (JWT o x-tenant-id header)');
    }
    return tenantId;
  }

  private requireTenantFromHeader(headerTenantId: string): string {
    if (!headerTenantId?.trim()) {
      throw new BadRequestException('Header x-tenant-id requerido en endpoints públicos');
    }
    return headerTenantId.trim();
  }
}
