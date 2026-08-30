import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { PayrollService } from '../service/payroll.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { EmployeeContractType } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { toEmployeeResponse, EmployeeResponseDto } from '../mapper/employees.mapper';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';

@ApiTags('employees')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('employees')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, type: EmployeeResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post()
  async create(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CreateEmployeeDto,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const employee = await this.payrollService.create(tenantId, body);
    return toEmployeeResponse(employee);
  }

  @ApiOperation({ summary: 'List employees' })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListEmployeesQueryDto,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const employees = await this.payrollService.findAll(tenantId, query, {
      userId: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    });
    return employees.map(toEmployeeResponse);
  }

  @ApiOperation({ summary: 'Get employee details' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @Get(':userId')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const employee = await this.payrollService.findOne(tenantId, userId, {
      userId: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    });
    return toEmployeeResponse(employee);
  }

  @ApiOperation({ summary: 'Update employee details' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Patch(':userId')
  async update(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
    @Body() body: UpdateEmployeeDto,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const employee = await this.payrollService.update(tenantId, userId, body);
    return toEmployeeResponse(employee);
  }

  @ApiOperation({ summary: 'Soft delete employee (isActive=false, deletedAt=now)' })
  @ApiResponse({ status: 200, type: Boolean })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Delete(':userId')
  async remove(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('userId') userId: string,
  ): Promise<boolean> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    await this.payrollService.remove(tenantId, userId);
    return true;
  }

  @ApiOperation({ summary: 'List employees by location' })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  @Get('location/:locationId')
  async findByLocation(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('locationId') locationId: string,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const employees = await this.payrollService.findByLocation(tenantId, locationId, {
      userId: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    });
    return employees.map(toEmployeeResponse);
  }

  @ApiOperation({ summary: 'List employees by contract type' })
  @ApiResponse({ status: 200, type: [EmployeeResponseDto] })
  @Get('contract-type/:type')
  async findByContractType(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('type') type: EmployeeContractType,
  ) {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const employees = await this.payrollService.findByContractType(tenantId, type, {
      userId: user?.sub ?? '',
      roleCode: user?.roleCode ?? '',
    });
    return employees.map(toEmployeeResponse);
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
