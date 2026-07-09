import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES, SYSTEM_ADMIN_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  MedicalLeaveRecord,
  MedicalLeaveRegistrationResult,
  MedicalLeaveSummary,
} from '../interfaces/medical-leaves.interfaces';
import { MedicalLeavesService } from '../service/medical-leaves.service';
import { CreateMedicalLeaveDto } from './dto/create-medical-leave.dto';
import { ListMedicalLeavesQueryDto } from './dto/list-medical-leaves-query.dto';
import {
  MedicalLeaveDetailResponseDto,
  MedicalLeaveResponseDto,
  MedicalLeaveSummaryResponseDto,
  MedicalLeaveSupportDocumentUrlResponseDto,
} from './dto/medical-leave-response.dto';
import { UpdateMedicalLeaveStatusDto } from './dto/update-medical-leave-status.dto';

const MEDICAL_LEAVE_WRITE_ROLES = ['NOMINA', ...SYSTEM_ADMIN_ROLES] as const;
const SUPPORT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

function parseCalendarDateInput(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function decimalToNumber(value: Decimal | null): number | null {
  return value === null ? null : Number(value.toString());
}

function mapMedicalLeave(record: MedicalLeaveRecord): MedicalLeaveResponseDto {
  return {
    id: record.id,
    employeeId: record.employeeId,
    origin: record.origin,
    startDate: record.startDate,
    endDate: record.endDate,
    totalDays: record.totalDays,
    employerPaidDays: record.employerPaidDays,
    epsArlPaidDays: record.epsArlPaidDays,
    epsArlAmount: decimalToNumber(record.epsArlAmount),
    employerAmount: Number(record.employerAmount.toString()),
    supportStorageObjectId: record.supportStorageObjectId,
    status: record.status,
    radicatedAt: record.radicatedAt,
    recoveredAt: record.recoveredAt,
    rejectedAt: record.rejectedAt,
    rejectionReason: record.rejectionReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapMedicalLeaveDetail(
  record: MedicalLeaveRegistrationResult,
): MedicalLeaveDetailResponseDto {
  return {
    ...mapMedicalLeave(record),
    annualAccumulatedDays: record.annualAccumulatedDays,
    exceeds180DayThreshold: record.exceeds180DayThreshold,
  };
}

function mapMedicalLeaveSummary(record: MedicalLeaveSummary): MedicalLeaveSummaryResponseDto {
  return {
    ...mapMedicalLeave(record),
    employeeName: record.employeeName,
    locationId: record.locationId,
    locationName: record.locationName,
  };
}

@ApiTags('medical-leaves')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('medical-leaves')
export class MedicalLeavesController {
  constructor(private readonly medicalLeavesService: MedicalLeavesService) {}

  @ApiOperation({ summary: 'Registrar incapacidad médica' })
  @ApiResponse({ status: 201, type: MedicalLeaveDetailResponseDto })
  @HttpCode(HttpStatus.CREATED)
  @Roles(...MEDICAL_LEAVE_WRITE_ROLES)
  @Post()
  async register(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMedicalLeaveDto,
  ): Promise<MedicalLeaveDetailResponseDto> {
    const record = await this.medicalLeavesService.register(user.tenantId, user.sub, {
      employeeId: dto.employeeId,
      origin: dto.origin,
      startDate: parseCalendarDateInput(dto.startDate),
      endDate: parseCalendarDateInput(dto.endDate),
    });
    return mapMedicalLeaveDetail(record);
  }

  @ApiOperation({ summary: 'Listar incapacidades médicas' })
  @ApiResponse({ status: 200, type: [MedicalLeaveSummaryResponseDto] })
  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMedicalLeavesQueryDto,
  ): Promise<MedicalLeaveSummaryResponseDto[]> {
    const records = await this.medicalLeavesService.list(user.tenantId, {
      employeeId: query.employeeId,
      locationId: query.locationId,
      status: query.status,
      origin: query.origin,
      month: query.month,
      cursor: query.cursor,
      take: query.take,
    });
    return records.map(mapMedicalLeaveSummary);
  }

  @ApiOperation({ summary: 'Detalle de incapacidad médica' })
  @ApiResponse({ status: 200, type: MedicalLeaveDetailResponseDto })
  @Get(':id')
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<MedicalLeaveDetailResponseDto> {
    const record = await this.medicalLeavesService.getById(user.tenantId, id);
    return mapMedicalLeaveDetail(record);
  }

  @ApiOperation({ summary: 'Cambiar estado de incapacidad médica' })
  @ApiResponse({ status: 200, type: MedicalLeaveResponseDto })
  @Roles(...MEDICAL_LEAVE_WRITE_ROLES)
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMedicalLeaveStatusDto,
  ): Promise<MedicalLeaveResponseDto> {
    const record = await this.medicalLeavesService.updateStatus(user.tenantId, user.sub, id, {
      status: dto.status,
      rejectionReason: dto.rejectionReason,
    });
    return mapMedicalLeave(record);
  }

  @ApiOperation({ summary: 'Adjuntar soporte médico escaneado' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: MedicalLeaveResponseDto })
  @Roles(...MEDICAL_LEAVE_WRITE_ROLES)
  @Post(':id/support-document')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: SUPPORT_DOCUMENT_MAX_BYTES } }))
  async attachSupportDocument(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<MedicalLeaveResponseDto> {
    if (!file) {
      throw new BadRequestException('Archivo requerido');
    }

    const record = await this.medicalLeavesService.attachSupportDocument(
      user.tenantId,
      user.sub,
      id,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
    );
    return mapMedicalLeave(record);
  }

  @ApiOperation({ summary: 'Obtener URL prefirmada del soporte médico' })
  @ApiResponse({ status: 200, type: MedicalLeaveSupportDocumentUrlResponseDto })
  @Get(':id/support-document/url')
  async getSupportDocumentUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<MedicalLeaveSupportDocumentUrlResponseDto> {
    const url = await this.medicalLeavesService.getSupportDocumentUrl(user.tenantId, id);
    return { url };
  }

  @ApiOperation({ summary: 'Eliminar incapacidad médica (soft delete)' })
  @ApiResponse({ status: 200, type: MedicalLeaveResponseDto })
  @Roles(...MEDICAL_LEAVE_WRITE_ROLES)
  @Delete(':id')
  async softDelete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<MedicalLeaveResponseDto> {
    const record = await this.medicalLeavesService.softDelete(user.tenantId, user.sub, id);
    return mapMedicalLeave(record);
  }
}
