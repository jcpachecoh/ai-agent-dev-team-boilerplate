import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AssetStatus, AssetType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeeAssetsService } from '../service/employee-assets.service';
import { CreateEmployeeAssetDto } from './dto/create-employee-asset.dto';
import { UpdateEmployeeAssetDto } from './dto/update-employee-asset.dto';
import { EmployeeAssetResponseDto } from './dto/employee-asset.response.dto';
import type { EmployeeAssetRecord } from '../interfaces/employee-assets.interfaces';

function resolveTenantId(user: { tenantId?: string }, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toResponse(record: EmployeeAssetRecord): EmployeeAssetResponseDto {
  return {
    id: record.id,
    tenantId: record.tenantId,
    employeeId: record.employeeId,
    assetName: record.assetName,
    type: record.type,
    assignmentDate: record.assignmentDate,
    value: Number(record.value),
    status: record.status,
    notes: record.notes,
    storageObjectId: record.storageObjectId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@ApiTags('employee-assets')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('employee-assets')
export class EmployeeAssetsController {
  constructor(private readonly service: EmployeeAssetsService) {}

  @ApiOperation({ summary: 'Create employee asset' })
  @ApiResponse({ status: 201, type: EmployeeAssetResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post()
  async create(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CreateEmployeeAssetDto,
  ): Promise<EmployeeAssetResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.service.create(tenantId, {
      employeeId: body.employeeId,
      assetName: body.assetName,
      type: body.type,
      value: String(body.value),
      assignmentDate: body.assignmentDate ? new Date(body.assignmentDate) : undefined,
      notes: body.notes,
      storageObjectId: body.storageObjectId,
    });
    return toResponse(record);
  }

  @ApiOperation({ summary: 'List assets by employee' })
  @ApiResponse({ status: 200, type: [EmployeeAssetResponseDto] })
  @ApiQuery({ name: 'employeeId', required: true })
  @ApiQuery({ name: 'status', enum: AssetStatus, required: false })
  @ApiQuery({ name: 'type', enum: AssetType, required: false })
  @Get()
  async findByEmployee(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('employeeId') employeeId: string,
    @Query('status') status?: AssetStatus,
    @Query('type') type?: AssetType,
  ): Promise<EmployeeAssetResponseDto[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const records = await this.service.findByEmployee(tenantId, employeeId, { status, type });
    return records.map(toResponse);
  }

  @ApiOperation({ summary: 'Get asset by ID' })
  @ApiResponse({ status: 200, type: EmployeeAssetResponseDto })
  @Get(':id')
  async findOne(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<EmployeeAssetResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.service.findById(tenantId, id);
    return toResponse(record);
  }

  @ApiOperation({ summary: 'Update asset status/value/notes' })
  @ApiResponse({ status: 200, type: EmployeeAssetResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch(':id')
  async update(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateEmployeeAssetDto,
  ): Promise<EmployeeAssetResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.service.update(tenantId, id, {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.value !== undefined ? { value: String(body.value) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.storageObjectId !== undefined ? { storageObjectId: body.storageObjectId } : {}),
    });
    return toResponse(record);
  }

  @ApiOperation({ summary: 'Obtener URL firmada de descarga del archivo adjunto' })
  @ApiResponse({ status: 200, schema: { properties: { url: { type: 'string' } } } })
  @Get(':id/download')
  async download(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<{ url: string }> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const url = await this.service.getDownloadUrl(tenantId, id);
    return { url };
  }
}
