import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceMonitorSummaryService } from '../service/attendance-monitor-summary.service';
import { AttendanceControlPanelService } from '../service/attendance-control-panel.service';
import { AttendanceComparisonService } from '../service/attendance-comparison.service';
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
    private readonly monitorSummaryService: AttendanceMonitorSummaryService,
    private readonly controlPanelService: AttendanceControlPanelService,
    private readonly comparisonService: AttendanceComparisonService,
  ) {}

  // ── Public kiosk endpoints ─────────────────────────────────────────────────
  //
  // kiosk-auth es público (sin JWT) para permitir que el dispositivo kiosko
  // opere en modo embebido sin gestionar tokens de empleados.
  // Seguridad provista por:
  //   • Scope de tenant (header x-tenant-id obligatorio)
  //   • Scope de sede (locationId en body — empleado debe pertenecer a esa Location)
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
  @ApiResponse({ status: 403, description: 'Cuenta bloqueada o empleado no en esta sede' })
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
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListAttendanceQueryDto,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.attendanceService.listHistory(query, tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('active')
  @ApiOperation({ summary: 'Empleados con entrada activa (sin salida) en una sede' })
  @ApiResponse({ status: 200, type: [ActiveAttendanceEntryDto] })
  listActive(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ActiveAttendanceQueryDto,
  ): Promise<ActiveAttendanceEntryDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    if (!query.locationId) {
      throw new BadRequestException('locationId es requerido');
    }
    return this.attendanceService.listActive(query.locationId, tenantId) as Promise<
      ActiveAttendanceEntryDto[]
    >;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('locations/:locationId/monitor-summary')
  @ApiOperation({ summary: 'Resumen de monitor de asistencia por sede y periodo' })
  @ApiResponse({ status: 200, type: AttendanceMonitorSummaryDto })
  @ApiResponse({ status: 404, description: 'Sede no encontrada' })
  getMonitorSummary(
    @CurrentUser() user: any,
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
    ) as Promise<AttendanceMonitorSummaryDto>;
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('control-panel/comparison')
  @ApiOperation({ summary: 'Comparativo de asistencias (periodo actual vs anterior)' })
  @ApiResponse({ status: 200, type: AttendanceComparisonSummaryDto })
  getControlPanelComparison(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: AttendanceComparisonQueryDto,
  ): Promise<AttendanceComparisonSummaryDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.comparisonService.getComparison(
      tenantId,
      query,
    ) as Promise<AttendanceComparisonSummaryDto>;
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
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ControlPanelQueryDto,
  ): Promise<ControlPanelSummaryDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.controlPanelService.getControlPanel(
      tenantId,
      user?.sub,
      query,
    ) as Promise<ControlPanelSummaryDto>;
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
    @CurrentUser() user: any,
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
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Query() query: OvertimeSummaryQueryDto,
  ): Promise<OvertimeSummaryDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const date = query.date ? new Date(query.date) : undefined;
    return this.attendanceService.getOvertimeSummary(
      userId,
      tenantId,
      date,
    ) as Promise<OvertimeSummaryDto>;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private resolveTenantId(user: any, headerTenantId: string): string {
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
