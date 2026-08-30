import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeSocialProfileService } from '../service/employee-social-profile.service';
import { CreateSocialProfileDto } from './dto/create-social-profile.dto';
import {
  SocialProfileResponseDto,
  toSocialProfileResponse,
} from './dto/social-profile-response.dto';
import { UpdateSocialProfileDto } from './dto/update-social-profile.dto';

@ApiTags('employee-social-profile')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('employees')
export class EmployeeSocialProfileController {
  constructor(private readonly service: EmployeeSocialProfileService) {}

  // ── Self-service: empleado lee sus propios familiares ─────────────────────

  @ApiOperation({ summary: 'Listar mis familiares (self-service)' })
  @ApiResponse({ status: 200, type: [SocialProfileResponseDto] })
  @UseGuards(JwtAuthGuard)
  @Get('me/social-profile')
  async findMyProfiles(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
  ): Promise<SocialProfileResponseDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profiles = await this.service.findMyProfiles(user.sub, tenantId);
    return profiles.map(toSocialProfileResponse);
  }

  // ── Admin: RRHH / nómina gestiona familiares de cualquier empleado ────────

  @ApiOperation({ summary: 'Listar familiares de un empleado' })
  @ApiResponse({ status: 200, type: [SocialProfileResponseDto] })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.read')
  @Get(':employeeId/social-profile')
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<SocialProfileResponseDto[]> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profiles = await this.service.findAllByEmployee(tenantId, employeeId);
    return profiles.map(toSocialProfileResponse);
  }

  @ApiOperation({ summary: 'Crear familiar de un empleado' })
  @ApiResponse({ status: 201, type: SocialProfileResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.create')
  @Post(':employeeId/social-profile')
  async create(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: CreateSocialProfileDto,
  ): Promise<SocialProfileResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profile = await this.service.create(tenantId, employeeId, {
      primerNombre: body.primerNombre.trim(),
      segundoNombre: body.segundoNombre?.trim(),
      primerApellido: body.primerApellido.trim(),
      segundoApellido: body.segundoApellido?.trim(),
      documentType: body.documentType,
      documentNumber: body.documentNumber?.trim(),
      relationshipType: body.relationshipType,
      disability: body.disability,
      birthDate: body.birthDate,
      isDependent: body.isDependent ?? false,
    });
    return toSocialProfileResponse(profile);
  }

  @ApiOperation({ summary: 'Actualizar familiar de un empleado' })
  @ApiResponse({ status: 200, type: SocialProfileResponseDto })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.update')
  @Patch(':employeeId/social-profile/:id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
    @Body() body: UpdateSocialProfileDto,
  ): Promise<SocialProfileResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const profile = await this.service.update(tenantId, id, employeeId, {
      primerNombre: body.primerNombre !== undefined ? body.primerNombre.trim() : undefined,
      segundoNombre: body.segundoNombre !== undefined ? body.segundoNombre.trim() : undefined,
      primerApellido: body.primerApellido !== undefined ? body.primerApellido.trim() : undefined,
      segundoApellido: body.segundoApellido !== undefined ? body.segundoApellido.trim() : undefined,
      documentType: body.documentType,
      documentNumber: body.documentNumber !== undefined ? body.documentNumber.trim() : undefined,
      relationshipType: body.relationshipType,
      disability: body.disability,
      birthDate: body.birthDate,
      isDependent: body.isDependent,
    });
    return toSocialProfileResponse(profile);
  }

  @ApiOperation({ summary: 'Eliminar (soft delete) familiar de un empleado' })
  @ApiResponse({ status: 200, type: Boolean })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.delete')
  @Delete(':employeeId/social-profile/:id')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('employeeId') employeeId: string,
    @Param('id') id: string,
  ): Promise<boolean> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    await this.service.remove(tenantId, id, employeeId);
    return true;
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId ?? headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
