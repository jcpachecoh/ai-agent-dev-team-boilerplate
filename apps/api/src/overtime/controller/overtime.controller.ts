import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OvertimeStatus } from '@prisma/client';

import { workDateFromIso } from '../../attendance/utils/period-range.util';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type {
  OvertimeRequestDetail,
  OvertimeRequestRecord,
  OvertimeRequestSummary,
} from '../interfaces/overtime.interfaces';
import { OVERTIME_REQUEST_PERMISSION } from '../overtime.constants';
import { OvertimeService } from '../service/overtime.service';
import {
  AdministrativeOvertimeCreatedItemDto,
  ApproveOvertimeRequestDto,
  CreateAdministrativeOvertimeBatchResponseDto,
  CreateAdministrativeOvertimeRequestDto,
  ListOvertimeRequestsQueryDto,
  ObjectOvertimeRequestDto,
  OvertimeApprovalResponseDto,
  OvertimeInboxResponseDto,
  OvertimePeriodSummaryQueryDto,
  OvertimePeriodSummaryResponseDto,
  OvertimeRequestDetailResponseDto,
  OvertimeRequestResponseDto,
} from './dto/overtime.dto';

function assertNotKioskMarkingToken(user: JwtPayload): void {
  if (user.tokenType === 'KIOSK_MARKING') {
    throw new ForbiddenException(
      'Token de modo marcación kiosko no tiene permisos de aprobación ni gestión',
    );
  }
}

function mapSummary(row: OvertimeRequestSummary): OvertimeRequestResponseDto {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    locationId: row.locationId,
    locationName: row.locationName,
    type: row.type,
    accumulatedMinutes: row.accumulatedMinutes,
    shiftEndTime: row.shiftEndTime,
    actualEndTime: row.actualEndTime,
    status: row.status,
    payrollPeriod: row.payrollPeriod,
    workDate: row.workDate,
    proposedStartTime: row.proposedStartTime,
    proposedEndTime: row.proposedEndTime,
    proposedMinutes: row.proposedMinutes,
    reasonOptionId: row.reasonOptionId,
    requestedByUserId: row.requestedByUserId,
    batchId: row.batchId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapDetail(row: OvertimeRequestDetail): OvertimeRequestDetailResponseDto {
  return {
    ...mapSummary(row),
    approvals: row.approvals.map(
      (approval): OvertimeApprovalResponseDto => ({
        id: approval.id,
        level: approval.level,
        approverId: approval.approverId,
        decision: approval.decision,
        decidedAt: approval.decidedAt,
        comment: approval.comment,
      }),
    ),
  };
}

function mapCreatedItem(row: OvertimeRequestRecord): AdministrativeOvertimeCreatedItemDto {
  return {
    id: row.id,
    employeeId: row.employeeId,
    locationId: row.locationId,
    type: row.type,
    status: row.status,
    workDate: row.workDate,
    proposedStartTime: row.proposedStartTime,
    proposedEndTime: row.proposedEndTime,
    proposedMinutes: row.proposedMinutes,
    reasonOptionId: row.reasonOptionId,
    requestedByUserId: row.requestedByUserId,
    batchId: row.batchId,
    payrollPeriod: row.payrollPeriod,
    accumulatedMinutes: row.accumulatedMinutes,
    shiftEndTime: row.shiftEndTime,
    actualEndTime: row.actualEndTime,
  };
}

function parseStatusFilter(status?: OvertimeStatus[]): OvertimeStatus[] | undefined {
  if (!status?.length) {
    return undefined;
  }
  return status;
}

@ApiTags('Attendance Overtime')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance/overtime-requests')
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de solicitudes de tiempo extra por período (OS-380)' })
  async getSummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: OvertimePeriodSummaryQueryDto,
  ): Promise<OvertimePeriodSummaryResponseDto> {
    return this.overtimeService.getPeriodSummary(user.tenantId, query.payrollPeriod);
  }

  @Post('administrative')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PermissionsGuard)
  @RequirePermission(OVERTIME_REQUEST_PERMISSION)
  @ApiOperation({
    summary: 'Crear solicitudes administrativas de extensión de jornada (OS-606 / CONN-04b)',
  })
  @ApiCreatedResponse({ type: CreateAdministrativeOvertimeBatchResponseDto })
  async createAdministrative(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAdministrativeOvertimeRequestDto,
  ): Promise<CreateAdministrativeOvertimeBatchResponseDto> {
    assertNotKioskMarkingToken(user);

    const result = await this.overtimeService.createAdministrativeBatch(user.tenantId, user.sub, {
      employeeIds: dto.employeeIds,
      locationId: dto.locationId,
      workDate: workDateFromIso(dto.workDate),
      proposedStartTime: new Date(dto.proposedStartTime),
      proposedEndTime: new Date(dto.proposedEndTime),
      reasonOptionId: dto.reasonOptionId,
    });

    return {
      batchId: result.batchId,
      createdCount: result.items.length,
      items: result.items.map(mapCreatedItem),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Bandeja de solicitudes de tiempo extra' })
  async listInbox(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListOvertimeRequestsQueryDto,
  ): Promise<OvertimeInboxResponseDto> {
    const page = await this.overtimeService.listInbox(user.tenantId, user.sub, {
      status: parseStatusFilter(query.status),
      payrollPeriod: query.payrollPeriod,
      locationId: query.locationId,
      employeeId: query.employeeId,
      cursor: query.cursor,
      take: query.take,
    });

    return {
      items: page.items.map(mapSummary),
      pageInfo: page.pageInfo,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de solicitud de tiempo extra' })
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<OvertimeRequestDetailResponseDto> {
    const row = await this.overtimeService.getById(user.tenantId, user.sub, id);
    return mapDetail(row);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar nivel activo (validación por cargo D4)' })
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ApproveOvertimeRequestDto,
  ): Promise<OvertimeRequestDetailResponseDto> {
    assertNotKioskMarkingToken(user);
    const row = await this.overtimeService.approve(user.tenantId, user.sub, {
      overtimeRequestId: id,
      comment: dto.comment,
    });
    return mapDetail(row);
  }

  @Post(':id/object')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Objetar solicitud con comentario obligatorio' })
  async object(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ObjectOvertimeRequestDto,
  ): Promise<OvertimeRequestDetailResponseDto> {
    assertNotKioskMarkingToken(user);
    const row = await this.overtimeService.object(user.tenantId, user.sub, {
      overtimeRequestId: id,
      comment: dto.comment,
    });
    return mapDetail(row);
  }
}
