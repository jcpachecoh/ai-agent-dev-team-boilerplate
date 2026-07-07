import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
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
import { DocumentFileType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeeDocumentsService } from '../service/employee-documents.service';
import { CreateEmployeeDocumentDto } from './dto/create-employee-document.dto';
import { EmployeeDocumentResponseDto } from './dto/employee-document.response.dto';
import type { EmployeeDocumentRecord } from '../interfaces/employee-documents.interfaces';

function resolveTenantId(user: { tenantId?: string }, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  return tenantId;
}

function toResponse(record: EmployeeDocumentRecord): EmployeeDocumentResponseDto {
  return {
    id: record.id,
    tenantId: record.tenantId,
    employeeId: record.employeeId,
    fileType: record.fileType,
    title: record.title,
    issueDate: record.issueDate,
    expiryDate: record.expiryDate,
    storageObjectId: record.storageObjectId,
    mimeType: record.mimeType,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@ApiTags('employee-documents')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('employee-documents')
export class EmployeeDocumentsController {
  constructor(private readonly service: EmployeeDocumentsService) {}

  @ApiOperation({ summary: 'Upload / register employee document' })
  @ApiResponse({ status: 201, type: EmployeeDocumentResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post()
  async create(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CreateEmployeeDocumentDto,
  ): Promise<EmployeeDocumentResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const record = await this.service.create(tenantId, {
      employeeId: body.employeeId,
      fileType: body.fileType,
      title: body.title,
      storageObjectId: body.storageObjectId,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
      notes: body.notes,
    });
    return toResponse(record);
  }

  @ApiOperation({ summary: 'List documents by employee, optionally filtered by fileType' })
  @ApiResponse({ status: 200, type: [EmployeeDocumentResponseDto] })
  @ApiQuery({ name: 'employeeId', required: true })
  @ApiQuery({ name: 'fileType', enum: DocumentFileType, required: false })
  @Get()
  async findByEmployee(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Query('employeeId') employeeId: string,
    @Query('fileType') fileType?: DocumentFileType,
  ): Promise<EmployeeDocumentResponseDto[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const records = await this.service.findByEmployee(tenantId, employeeId, { fileType });
    return records.map(toResponse);
  }

  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, type: EmployeeDocumentResponseDto })
  @Get(':id')
  async findOne(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<EmployeeDocumentResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    return toResponse(await this.service.findById(tenantId, id));
  }

  @ApiOperation({ summary: 'Get signed download URL for document file' })
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

  @ApiOperation({ summary: 'Soft-delete employee document' })
  @ApiResponse({ status: 200, type: EmployeeDocumentResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Delete(':id')
  async remove(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<EmployeeDocumentResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    return toResponse(await this.service.remove(tenantId, id));
  }
}
