import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NovedadType } from '@prisma/client';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { SYSTEM_ADMIN_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  PayrollNovedadRecord,
  PayrollNovedadSummary,
} from '../interfaces/payroll-novedades.interfaces';
import { PayrollNovedadesService } from '../service/payroll-novedades.service';
import { NovedadTypeConfigService } from '../service/novedad-type-config.service';
import {
  ListPayrollNovedadesQueryDto,
  NovedadTypeConfigResponseDto,
  PayrollNovedadResponseDto,
  PayrollNovedadSummaryResponseDto,
  RejectNovedadDto,
  SubmitNovedadDto,
  SubmitNovedadResponseDto,
  SupportDocumentUrlResponseDto,
  UpdateNovedadTypeConfigDto,
} from './dto/payroll-novedades.dto';

const NOVEDAD_WRITE_ROLES = ['NOMINA', ...SYSTEM_ADMIN_ROLES] as const;
const NOVEDAD_VIEW_ROLES = ['NOMINA', 'SUPERVISOR', 'MANAGER', ...SYSTEM_ADMIN_ROLES] as const;
const SUPERVISOR_ACT_ROLES = ['SUPERVISOR', 'MANAGER', ...SYSTEM_ADMIN_ROLES] as const;

function parseCalendarDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapRecord(record: PayrollNovedadRecord): PayrollNovedadResponseDto {
  return { ...record };
}

function mapSummary(record: PayrollNovedadSummary): PayrollNovedadSummaryResponseDto {
  return { ...record };
}

@ApiTags('Payroll Novedades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll-novedades')
export class PayrollNovedadesController {
  constructor(
    private readonly service: PayrollNovedadesService,
    private readonly typeConfigService: NovedadTypeConfigService,
  ) {}

  @Get('type-config')
  @Roles(...NOVEDAD_WRITE_ROLES)
  @ApiOperation({ summary: 'Listar configuración de tipos por tenant' })
  async listTypeConfig(@CurrentUser() user: JwtPayload): Promise<NovedadTypeConfigResponseDto[]> {
    const rows = await this.typeConfigService.listConfigs(user.tenantId);
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      requiresSupervisorApproval: row.requiresSupervisorApproval,
      requiresSupportDocument: row.requiresSupportDocument,
      isPaidDefault: row.isPaidDefault,
    }));
  }

  @Patch('type-config/:type')
  @Roles(...NOVEDAD_WRITE_ROLES)
  @ApiOperation({ summary: 'Actualizar configuración de un tipo' })
  async updateTypeConfig(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: NovedadType,
    @Body() dto: UpdateNovedadTypeConfigDto,
  ): Promise<NovedadTypeConfigResponseDto> {
    const row = await this.typeConfigService.updateConfig(user.tenantId, type, dto);
    return {
      id: row.id,
      type: row.type,
      requiresSupervisorApproval: row.requiresSupervisorApproval,
      requiresSupportDocument: row.requiresSupportDocument,
      isPaidDefault: row.isPaidDefault,
    };
  }

  @Post()
  @Roles(...NOVEDAD_WRITE_ROLES, 'SUPERVISOR', 'MANAGER', 'OPERATOR')
  @ApiOperation({ summary: 'Crear solicitud o registro de novedad' })
  @ApiResponse({ status: 201, type: SubmitNovedadResponseDto })
  async submit(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitNovedadDto,
  ): Promise<SubmitNovedadResponseDto> {
    const result = await this.service.submit(user.tenantId, user.sub, {
      employeeId: dto.employeeId,
      type: dto.type,
      startDate: parseCalendarDate(dto.startDate),
      endDate: parseCalendarDate(dto.endDate),
      isPaid: dto.isPaid,
      notes: dto.notes,
      supportStorageObjectId: dto.supportStorageObjectId,
      requestedBy: dto.requestedBy,
      overlapWarningAck: dto.overlapWarningAck,
      autoApprove: dto.autoApprove,
    });
    return {
      novedad: mapRecord(result.novedad),
      warnings: result.warnings,
    };
  }

  @Get('me/type-config')
  @ApiOperation({ summary: 'Tipos de novedad disponibles para autoservicio del empleado' })
  @ApiResponse({ status: 200, type: [NovedadTypeConfigResponseDto] })
  async listMyTypeConfig(@CurrentUser() user: JwtPayload): Promise<NovedadTypeConfigResponseDto[]> {
    return this.service.listEmployeeTypeConfigs(user.tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Listar novedades del empleado autenticado' })
  @ApiResponse({ status: 200, type: [PayrollNovedadSummaryResponseDto] })
  async listMy(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPayrollNovedadesQueryDto,
  ): Promise<PayrollNovedadSummaryResponseDto[]> {
    const rows = await this.service.listMyNovedades(user.tenantId, user.sub, {
      type: query.type,
      startDateFrom: query.startDateFrom ? parseCalendarDate(query.startDateFrom) : undefined,
      startDateTo: query.startDateTo ? parseCalendarDate(query.startDateTo) : undefined,
      cursor: query.cursor,
      take: query.take,
    });
    return rows.map(mapSummary);
  }

  @Get()
  @Roles(...NOVEDAD_VIEW_ROLES)
  @ApiOperation({ summary: 'Listar novedades (bandeja o histórico)' })
  @ApiResponse({ status: 200, type: [PayrollNovedadSummaryResponseDto] })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListPayrollNovedadesQueryDto,
  ): Promise<PayrollNovedadSummaryResponseDto[]> {
    const rows = await this.service.list(user.tenantId, user.sub, {
      employeeId: query.employeeId,
      locationId: query.locationId,
      type: query.type,
      startDateFrom: query.startDateFrom ? parseCalendarDate(query.startDateFrom) : undefined,
      startDateTo: query.startDateTo ? parseCalendarDate(query.startDateTo) : undefined,
      supervisorInbox: query.supervisorInbox,
      rrhhInbox: query.rrhhInbox,
      cursor: query.cursor,
      take: query.take,
    });
    return rows.map(mapSummary);
  }

  @Get(':id')
  @Roles(...NOVEDAD_VIEW_ROLES, 'OPERATOR')
  @ApiOperation({ summary: 'Detalle de novedad' })
  @ApiResponse({ status: 200, type: PayrollNovedadResponseDto })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<PayrollNovedadResponseDto> {
    const record = await this.service.findOne(user.tenantId, user.sub, id);
    return mapRecord(record);
  }

  @Post(':id/approve/supervisor')
  @Roles(...SUPERVISOR_ACT_ROLES)
  @HttpCode(HttpStatus.OK)
  async approveBySupervisor(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<PayrollNovedadResponseDto> {
    const record = await this.service.approveBySupervisor(user.tenantId, user.sub, id);
    return mapRecord(record);
  }

  @Post(':id/reject/supervisor')
  @Roles(...SUPERVISOR_ACT_ROLES)
  @HttpCode(HttpStatus.OK)
  async rejectBySupervisor(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RejectNovedadDto,
  ): Promise<PayrollNovedadResponseDto> {
    const record = await this.service.rejectBySupervisor(user.tenantId, user.sub, {
      novedadId: id,
      rejectionReason: dto.rejectionReason,
      comment: dto.comment,
    });
    return mapRecord(record);
  }

  @Post(':id/approve/rrhh')
  @Roles(...NOVEDAD_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  async approveByRRHH(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<PayrollNovedadResponseDto> {
    const record = await this.service.approveByRRHH(user.tenantId, user.sub, id);
    return mapRecord(record);
  }

  @Post(':id/reject/rrhh')
  @Roles(...NOVEDAD_WRITE_ROLES)
  @HttpCode(HttpStatus.OK)
  async rejectByRRHH(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RejectNovedadDto,
  ): Promise<PayrollNovedadResponseDto> {
    const record = await this.service.rejectByRRHH(user.tenantId, user.sub, {
      novedadId: id,
      rejectionReason: dto.rejectionReason,
      comment: dto.comment,
    });
    return mapRecord(record);
  }

  @Post(':id/support')
  @Roles(...NOVEDAD_WRITE_ROLES)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async attachSupport(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<PayrollNovedadResponseDto> {
    if (!file) {
      throw new BadRequestException('El archivo de soporte es obligatorio');
    }
    const record = await this.service.attachSupportDocument(user.tenantId, user.sub, id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    });
    return mapRecord(record);
  }

  @Get(':id/support/download')
  @Roles(...NOVEDAD_VIEW_ROLES, 'OPERATOR')
  async getSupportDownloadUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<SupportDocumentUrlResponseDto> {
    const url = await this.service.getSupportDocumentUrl(user.tenantId, user.sub, id);
    return { url };
  }
}
