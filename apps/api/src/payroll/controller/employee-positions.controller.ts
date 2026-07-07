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
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeePositionsService } from '../service/employee-positions.service';
import { CreateEmployeePositionDto } from './dto/create-employee-position.dto';
import { UpdateEmployeePositionDto } from './dto/update-employee-position.dto';
import { EmployeePositionResponseDto } from './dto/employee-position.response.dto';
import { ListEmployeePositionsQueryDto } from './dto/list-employee-positions-query.dto';
import type {
  EmployeePositionHistoryRecord,
  EmployeePositionRecord,
} from '../interfaces/employee-positions.interfaces';

function resolveTenantId(user: { tenantId?: string }, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toPositionResponse(position: EmployeePositionRecord): EmployeePositionResponseDto {
  return {
    id: position.id,
    title: position.title,
    area: position.area,
    baseSalaryRange: Number(position.baseSalaryRange),
    isActive: position.isActive,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
  };
}

@ApiTags('employee-positions')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('employee-positions')
export class EmployeePositionsController {
  constructor(private readonly employeePositionsService: EmployeePositionsService) {}

  @ApiOperation({ summary: 'List employee positions' })
  @ApiResponse({ status: 200, type: [EmployeePositionResponseDto] })
  @Get()
  async findAll(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListEmployeePositionsQueryDto,
  ): Promise<EmployeePositionResponseDto[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const positions = await this.employeePositionsService.findAll(tenantId, query);
    return positions.map(toPositionResponse);
  }

  @ApiOperation({ summary: 'Get employee position history' })
  @Get('employees/:employeeDetailsId/history')
  async getEmployeeHistory(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeDetailsId') employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryRecord[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    return this.employeePositionsService.getEmployeePositionHistory(tenantId, employeeDetailsId);
  }

  @ApiOperation({ summary: 'Get employee position by ID' })
  @ApiResponse({ status: 200, type: EmployeePositionResponseDto })
  @Get(':id')
  async findOne(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<EmployeePositionResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const position = await this.employeePositionsService.findById(tenantId, id);
    return toPositionResponse(position);
  }

  @ApiOperation({ summary: 'Create employee position' })
  @ApiResponse({ status: 201, type: EmployeePositionResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post()
  async create(
    @CurrentUser() user: { tenantId?: string; sub?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CreateEmployeePositionDto,
  ): Promise<EmployeePositionResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const position = await this.employeePositionsService.create(tenantId, {
      title: body.title,
      area: body.area,
      baseSalaryRange: String(body.baseSalaryRange),
    });
    return toPositionResponse(position);
  }

  @ApiOperation({ summary: 'Update employee position' })
  @ApiResponse({ status: 200, type: EmployeePositionResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch(':id')
  async update(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateEmployeePositionDto,
  ): Promise<EmployeePositionResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const position = await this.employeePositionsService.update(tenantId, id, {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.area !== undefined ? { area: body.area } : {}),
      ...(body.baseSalaryRange !== undefined
        ? { baseSalaryRange: String(body.baseSalaryRange) }
        : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    });
    return toPositionResponse(position);
  }

  @ApiOperation({ summary: 'Deactivate employee position' })
  @ApiResponse({ status: 200, type: EmployeePositionResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch(':id/deactivate')
  async deactivate(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<EmployeePositionResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const position = await this.employeePositionsService.deactivate(tenantId, id);
    return toPositionResponse(position);
  }
}
