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
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  VacationBalanceRecord,
  VacationRequestRecord,
  VacationRequestSummary,
} from '../interfaces/vacations.interfaces';
import { VacationsService } from '../service/vacations.service';
import { ListVacationRequestsQueryDto } from './dto/list-vacation-requests-query.dto';
import { RejectVacationDto } from './dto/reject-vacation.dto';
import { RequestVacationDto } from './dto/request-vacation.dto';
import {
  VacationBalanceResponseDto,
  VacationLetterUrlResponseDto,
  VacationRequestResponseDto,
  VacationRequestSummaryResponseDto,
} from './dto/vacation-response.dto';

function parseCalendarDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function decimalToNumber(value: Decimal): number {
  return Number(value.toString());
}

function mapBalance(record: VacationBalanceRecord): VacationBalanceResponseDto {
  const available = record.accruedDays.minus(record.takenDays).minus(record.compensatedDays);
  return {
    id: record.id,
    employeeId: record.employeeId,
    accruedDays: decimalToNumber(record.accruedDays),
    takenDays: decimalToNumber(record.takenDays),
    compensatedDays: decimalToNumber(record.compensatedDays),
    availableDays: decimalToNumber(available),
    lastAccrualDate: record.lastAccrualDate,
  };
}

function mapRequest(record: VacationRequestRecord): VacationRequestResponseDto {
  return {
    id: record.id,
    employeeId: record.employeeId,
    startDate: record.startDate,
    endDate: record.endDate,
    daysRequested: decimalToNumber(record.daysRequested),
    type: record.type,
    status: record.status,
    level1ApprovedBy: record.level1ApprovedBy,
    level1ActedAt: record.level1ActedAt,
    level2ApprovedBy: record.level2ApprovedBy,
    level2ActedAt: record.level2ActedAt,
    rejectionReason: record.rejectionReason,
    letterStorageObjectId: record.letterStorageObjectId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapRequestSummary(record: VacationRequestSummary): VacationRequestSummaryResponseDto {
  return {
    ...mapRequest(record),
    employeeName: record.employeeName,
    locationId: record.locationId,
    locationName: record.locationName,
  };
}

@ApiTags('vacations')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vacations')
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) {}

  @ApiOperation({ summary: 'Consultar saldo de vacaciones del usuario autenticado' })
  @ApiResponse({ status: 200, type: VacationBalanceResponseDto })
  @Get('me/balance')
  async getMyBalance(@CurrentUser() user: JwtPayload): Promise<VacationBalanceResponseDto> {
    const balance = await this.vacationsService.getMyBalance(user.tenantId, user.sub);
    return mapBalance(balance);
  }

  @ApiOperation({ summary: 'Listar solicitudes de vacaciones del usuario autenticado' })
  @ApiResponse({ status: 200, type: [VacationRequestSummaryResponseDto] })
  @Get('me/requests')
  async listMyRequests(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListVacationRequestsQueryDto,
  ): Promise<VacationRequestSummaryResponseDto[]> {
    const records = await this.vacationsService.listMyRequests(user.tenantId, user.sub, {
      status: query.status,
      dateFrom: query.dateFrom ? parseCalendarDateInput(query.dateFrom) : undefined,
      dateTo: query.dateTo ? parseCalendarDateInput(query.dateTo) : undefined,
      cursor: query.cursor,
      take: query.take,
    });
    return records.map(mapRequestSummary);
  }

  @ApiOperation({ summary: 'Consultar saldo de vacaciones de un empleado' })
  @ApiResponse({ status: 200, type: VacationBalanceResponseDto })
  @Get('balance/:employeeId')
  async getBalance(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
  ): Promise<VacationBalanceResponseDto> {
    await this.vacationsService.assertCanViewEmployee(user.tenantId, user.sub, employeeId);
    const balance = await this.vacationsService.getBalance(user.tenantId, employeeId);
    return mapBalance(balance);
  }

  @ApiOperation({ summary: 'Crear solicitud de vacaciones' })
  @ApiResponse({ status: 201, type: VacationRequestResponseDto })
  @HttpCode(HttpStatus.CREATED)
  @Post('requests')
  async createRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestVacationDto,
  ): Promise<VacationRequestResponseDto> {
    const record = await this.vacationsService.requestVacation(user.tenantId, user.sub, {
      employeeId: dto.employeeId,
      startDate: parseCalendarDateInput(dto.startDate),
      endDate: parseCalendarDateInput(dto.endDate),
      type: dto.type,
    });
    return mapRequest(record);
  }

  @ApiOperation({ summary: 'Listar solicitudes de vacaciones' })
  @ApiResponse({ status: 200, type: [VacationRequestSummaryResponseDto] })
  @Roles(...PAYROLL_MODULE_ROLES)
  @Get('requests')
  async listRequests(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListVacationRequestsQueryDto,
  ): Promise<VacationRequestSummaryResponseDto[]> {
    const records = await this.vacationsService.listRequests(user.tenantId, {
      employeeId: query.employeeId,
      locationId: query.locationId,
      status: query.status,
      dateFrom: query.dateFrom ? parseCalendarDateInput(query.dateFrom) : undefined,
      dateTo: query.dateTo ? parseCalendarDateInput(query.dateTo) : undefined,
      cursor: query.cursor,
      take: query.take,
    });
    return records.map(mapRequestSummary);
  }

  @ApiOperation({ summary: 'Aprobar solicitud — nivel 1 (Supervisor)' })
  @ApiResponse({ status: 200, type: VacationRequestResponseDto })
  @Roles(...PAYROLL_MODULE_ROLES)
  @Post('requests/:id/approve-level-1')
  async approveLevel1(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
  ): Promise<VacationRequestResponseDto> {
    const record = await this.vacationsService.approveLevel1(user.tenantId, user.sub, requestId);
    return mapRequest(record);
  }

  @ApiOperation({ summary: 'Aprobar solicitud — nivel 2 (RRHH / NOMINA)' })
  @ApiResponse({ status: 200, type: VacationRequestResponseDto })
  @Roles('NOMINA', 'OWNER', 'SUPER_ADMIN')
  @Post('requests/:id/approve-level-2')
  async approveLevel2(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
  ): Promise<VacationRequestResponseDto> {
    const record = await this.vacationsService.approveLevel2(user.tenantId, user.sub, requestId);
    return mapRequest(record);
  }

  @ApiOperation({ summary: 'Rechazar solicitud de vacaciones' })
  @ApiResponse({ status: 200, type: VacationRequestResponseDto })
  @Roles(...PAYROLL_MODULE_ROLES)
  @Post('requests/:id/reject')
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
    @Body() dto: RejectVacationDto,
  ): Promise<VacationRequestResponseDto> {
    const record = await this.vacationsService.reject(user.tenantId, user.sub, {
      requestId,
      rejectionReason: dto.rejectionReason,
    });
    return mapRequest(record);
  }

  @ApiOperation({ summary: 'Obtener URL prefirmada de la carta PDF' })
  @ApiResponse({ status: 200, type: VacationLetterUrlResponseDto })
  @Get('requests/:id/letter')
  async getLetterUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
  ): Promise<VacationLetterUrlResponseDto> {
    const url = await this.vacationsService.getLetterUrl(user.tenantId, user.sub, requestId);
    return { url };
  }
}
