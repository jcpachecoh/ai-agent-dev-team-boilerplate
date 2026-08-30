import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import type { JwtPayload } from '../../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AdminRolesService } from '../service/admin-roles.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { DuplicateRoleDto } from './dto/duplicate-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('admin-roles')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Tenant ID (falls back to JWT)' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminRolesController {
  constructor(private readonly service: AdminRolesService) {}

  // ── Permissions catalog ───────────────────────────────────────────────────

  @ApiOperation({ summary: 'List permissions in catalog' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @RequirePermission('admin.roles.read')
  @Get('permissions')
  getPermissions(@Query('includeInactive') includeInactive?: string) {
    return this.service.getPermissionCatalog(includeInactive === 'true');
  }

  @ApiOperation({ summary: 'Create a new permission in the catalog' })
  @RequirePermission('admin.roles.manage')
  @Post('permissions')
  createPermission(@Body() body: CreatePermissionDto) {
    return this.service.createPermission(body);
  }

  @ApiOperation({ summary: 'Update a permission in the catalog' })
  @RequirePermission('admin.roles.manage')
  @Patch('permissions/:id')
  updatePermission(@Param('id') id: string, @Body() body: UpdatePermissionDto) {
    return this.service.updatePermission(id, body);
  }

  @ApiOperation({ summary: 'Deactivate a permission (semantic endpoint)' })
  @RequirePermission('admin.roles.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('permissions/:id/deactivate')
  deactivatePermission(@Param('id') id: string) {
    return this.service.deactivatePermission(id);
  }

  @ApiOperation({
    summary: 'Deactivate a permission — @deprecated use PATCH /permissions/:id/deactivate',
  })
  @RequirePermission('admin.roles.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('permissions/:id')
  deactivatePermissionLegacy(@Param('id') id: string) {
    return this.service.deactivatePermission(id);
  }

  // ── Roles ─────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List roles in tenant' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @RequirePermission('admin.roles.read')
  @Get('roles')
  findAll(@CurrentUser() user: JwtPayload, @Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(user.tenantId, includeInactive === 'true');
  }

  @ApiOperation({ summary: 'Get role by ID with permissions' })
  @RequirePermission('admin.roles.read')
  @Get('roles/:id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new role (UPPER_SNAKE_CASE code)' })
  @RequirePermission('admin.roles.manage')
  @Post('roles')
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateRoleDto) {
    return this.service.createRole(user.tenantId, body);
  }

  @ApiOperation({ summary: 'Update role name, description or status' })
  @RequirePermission('admin.roles.manage')
  @Patch('roles/:id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.service.updateRole(user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Deactivate role (fails if has active users or is system role)' })
  @RequirePermission('admin.roles.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('roles/:id')
  deactivate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deactivateRole(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Duplicate role and copy all its permissions' })
  @RequirePermission('admin.roles.manage')
  @Post('roles/:id/duplicate')
  duplicate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: DuplicateRoleDto,
  ) {
    return this.service.duplicateRole(user.tenantId, id, body);
  }

  @ApiOperation({ summary: 'Replace all permissions on a role' })
  @RequirePermission('admin.roles.permissions.assign')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put('roles/:id/permissions')
  assignPermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: AssignRolePermissionsDto,
  ) {
    return this.service.assignRolePermissions(user.tenantId, id, body.permissionIds);
  }
}
