import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OvertimeStatus } from '@prisma/client';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type {
  OvertimeRequestDetail,
  OvertimeRequestSummary,
} from '../interfaces/overtime.interfaces';
import { OvertimeService } from '../service/overtime.service';
import {
  ApproveOvertimeRequestDto,
  ListOvertimeRequestsQueryDto,
  ObjectOvertimeRequestDto,
  OvertimeInboxResponseDto,
  OvertimePeriodSummaryQueryDto,
  OvertimePeriodSummaryResponseDto,
  OvertimeRequestDetailResponseDto,
  OvertimeRequestResponseDto,
} from './dto/overtime.dto';

function mapSummary(row: OvertimeRequestSummary): OvertimeRequestResponseDto {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employeeName,
    locationId: row.locationId,
    locationName: row.locationName,
    accumulatedMinutes: row.accumulatedMinutes,
    shiftEndTime: row.shiftEndTime,
    actualEndTime: row.actualEndTime,
    status: row.status,
    payrollPeriod: row.payrollPeriod,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapDetail(row: OvertimeRequestDetail): OvertimeRequestDetailResponseDto {
  return {
    ...mapSummary(row),
    approvals: row.approvals.map((approval) => ({
      id: approval.id,
      level: approval.level,
      approverId: approval.approverId,
      decision: approval.decision,
      decidedAt: approval.decidedAt,
      comment: approval.comment,
    })),
  };
}

function parseStatusFilter(status?: OvertimeStatus[]): OvertimeStatus[] | undefined {
  if (!status?.length) return undefined;
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
    const row = await this.overtimeService.object(user.tenantId, user.sub, {
      overtimeRequestId: id,
      comment: dto.comment,
    });
    return mapDetail(row);
  }
}
