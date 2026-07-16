import { Controller, Get, Headers, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeeCatalogService } from '../service/employee-catalog.service';
import {
  EmployeeCatalogOptionResponseDto,
  ListEmployeeCatalogQueryDto,
} from './dto/employee-catalog.dto';

@ApiTags('employee-catalogs')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('employee-catalogs')
export class EmployeeCatalogController {
  constructor(private readonly employeeCatalogService: EmployeeCatalogService) {}

  @ApiOperation({ summary: 'List employee catalog options (EPS, ARL, areas, etc.)' })
  @ApiResponse({ status: 200, type: [EmployeeCatalogOptionResponseDto] })
  @Get()
  async findAll(
    @CurrentUser() user: { tenantId?: string },
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListEmployeeCatalogQueryDto,
  ): Promise<EmployeeCatalogOptionResponseDto[]> {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }

    const options = await this.employeeCatalogService.findAll(tenantId, query.type);
    return options.map((option) => ({
      id: option.id,
      type: option.type,
      name: option.name,
      pilaCode: option.pilaCode,
    }));
  }
}
