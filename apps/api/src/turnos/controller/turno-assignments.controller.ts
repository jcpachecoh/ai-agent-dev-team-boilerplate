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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { BulkImportResultDto } from './dto/bulk-import-result.dto';
import { CreateTurnoAssignmentDto } from './dto/create-turno-assignment.dto';
import { GetBulkTemplateQueryDto } from './dto/get-bulk-template-query.dto';
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
import {
  ExcelFileValidationPipe,
  type ValidatedExcelFile,
} from '../pipes/excel-file-validation.pipe';
import { TurnoAssignmentsImportService } from '../service/turno-assignments-import.service';
import { TurnoAssignmentsTemplateService } from '../service/turno-assignments-template.service';
import { TurnoAssignmentsService } from '../service/turno-assignments.service';
import { formatDateOnly, parseDateOnly } from '../turno-assignments.utils';
import {
  BULK_IMPORT_MAX_FILE_BYTES,
  TURNO_ASSIGNMENTS_READ_PERMISSION,
  TURNO_ASSIGNMENTS_READ_ROLES,
  TURNO_ASSIGNMENTS_WRITE_PERMISSION,
  TURNO_ASSIGNMENTS_WRITE_ROLES,
} from '../turnos.constants';

function parseCsvNumbers(value: string): number[] {
  return value
    .split(',')
    .map((entry): string => entry.trim())
    .filter(Boolean)
    .map((entry): number => Number(entry));
}

function parseCsvStrings(value: string): string[] {
  return value
    .split(',')
    .map((entry): string => entry.trim())
    .filter(Boolean);
}

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
  constructor(
    private readonly assignmentsService: TurnoAssignmentsService,
    private readonly templateService: TurnoAssignmentsTemplateService,
    private readonly importService: TurnoAssignmentsImportService,
  ) {}

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

  @ApiOperation({ summary: 'Descarga la plantilla Excel de asignación masiva (OS-583)' })
  @ApiOkResponse({ description: 'Archivo .xlsx' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNO_ASSIGNMENTS_WRITE_ROLES)
  @RequirePermission(TURNO_ASSIGNMENTS_WRITE_PERMISSION)
  @Get('template')
  async downloadTemplate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: GetBulkTemplateQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const { buffer, filename } = await this.templateService.generateTemplate(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      {
        from: parseDateOnly(query.from),
        to: parseDateOnly(query.to),
        weekdaysIso: parseCsvNumbers(query.weekdays),
        employeeIds: parseCsvStrings(query.employeeIds),
      },
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
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

  @ApiOperation({ summary: 'Importa asignaciones masivas desde un archivo Excel (OS-583)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: BulkImportResultDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...TURNO_ASSIGNMENTS_WRITE_ROLES)
  @RequirePermission(TURNO_ASSIGNMENTS_WRITE_PERMISSION)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: BULK_IMPORT_MAX_FILE_BYTES } }))
  @Post('import')
  async importAssignments(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @UploadedFile(ExcelFileValidationPipe) file: ValidatedExcelFile,
  ): Promise<BulkImportResultDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    return this.importService.importFromExcel(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      file.buffer,
    );
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
