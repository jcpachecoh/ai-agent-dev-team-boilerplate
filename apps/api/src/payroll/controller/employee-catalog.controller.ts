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

import {
  CreateEmployeeCatalogOptionDto,
  EmployeeCatalogOptionResponseDto,
  ListEmployeeCatalogQueryDto,
  UpdateEmployeeCatalogOptionDto,
} from './dto/employee-catalog.dto';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { EmployeeCatalogOptionRecord } from '../interfaces/employee-catalog.interfaces';
import { EmployeeCatalogService } from '../service/employee-catalog.service';

function resolveTenantId(user: { tenantId?: string }, headerTenantId: string): string {
  const tenantId = user?.tenantId || headerTenantId;
  if (!tenantId) {
    throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
  }
  return tenantId;
}

function toResponse(option: EmployeeCatalogOptionRecord): EmployeeCatalogOptionResponseDto {
  return {
    id: option.id,
    type: option.type,
    name: option.name,
    pilaCode: option.pilaCode,
    isActive: option.isActive,
  };
}

@ApiTags('employee-catalogs')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('employee-catalogs')
export class EmployeeCatalogController {
  constructor(private readonly employeeCatalogService: EmployeeCatalogService) {}

  @ApiOperation({
    summary:
      'List employee catalog options. Active-only by default; includeInactive=true for admin.',
  })
  @ApiResponse({ status: 200, type: [EmployeeCatalogOptionResponseDto] })
  @Get()
  async findAll(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListEmployeeCatalogQueryDto,
  ): Promise<EmployeeCatalogOptionResponseDto[]> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const options = await this.employeeCatalogService.findAll(tenantId, {
      type: query.type,
      includeInactive: query.includeInactive,
    });
    return options.map(toResponse);
  }

  @ApiOperation({ summary: 'Create employee catalog option (EPS, OVERTIME_REASON, etc.)' })
  @ApiResponse({ status: 201, type: EmployeeCatalogOptionResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post()
  async create(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CreateEmployeeCatalogOptionDto,
  ): Promise<EmployeeCatalogOptionResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const created = await this.employeeCatalogService.create(tenantId, {
      type: body.type,
      name: body.name,
      pilaCode: body.pilaCode,
    });
    return toResponse(created);
  }

  @ApiOperation({
    summary: 'Update catalog option label / active flag. Type and tenant are immutable.',
  })
  @ApiResponse({ status: 200, type: EmployeeCatalogOptionResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch(':id')
  async update(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateEmployeeCatalogOptionDto,
  ): Promise<EmployeeCatalogOptionResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const updated = await this.employeeCatalogService.update(tenantId, id, {
      name: body.name,
      isActive: body.isActive,
      pilaCode: body.pilaCode,
    });
    return toResponse(updated);
  }

  @ApiOperation({
    summary:
      'Soft-deactivate catalog option (keeps history/FKs). Physical delete is not supported.',
  })
  @ApiResponse({ status: 200, type: EmployeeCatalogOptionResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch(':id/deactivate')
  async deactivate(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<EmployeeCatalogOptionResponseDto> {
    const tenantId = resolveTenantId(user, headerTenantId);
    const deactivated = await this.employeeCatalogService.deactivate(tenantId, id);
    return toResponse(deactivated);
  }
}
