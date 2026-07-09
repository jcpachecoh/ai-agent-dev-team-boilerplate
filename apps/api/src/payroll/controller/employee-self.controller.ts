import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmployeeResponseDto, toEmployeeResponse } from '../mapper/employees.mapper';
import { PayrollService } from '../service/payroll.service';

@ApiTags('employees')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeeSelfController {
  constructor(private readonly payrollService: PayrollService) {}

  @ApiOperation({ summary: 'Obtener el registro de empleado del usuario autenticado' })
  @ApiResponse({ status: 200, type: EmployeeResponseDto })
  @Get('me')
  async findMe(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
  ): Promise<EmployeeResponseDto> {
    const tenantId = headerTenantId?.trim() || user.tenantId;
    const employee = await this.payrollService.findSelf(tenantId, user.sub);
    return toEmployeeResponse(employee);
  }
}
