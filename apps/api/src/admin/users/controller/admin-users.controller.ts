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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AssignUserPermissionsDto } from './dto/assign-user-permissions.dto';
import type { JwtPayload } from '../../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AdminUsersService } from '../service/admin-users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@ApiTags('admin-users')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Tenant ID (falls back to JWT)' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @ApiOperation({ summary: 'List users in tenant' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @RequirePermission('admin.users.read')
  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(user.tenantId, includeInactive === 'true');
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @RequirePermission('admin.users.read')
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @ApiOperation({ summary: 'Create user with temporary password' })
  @RequirePermission('admin.users.create')
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateAdminUserDto) {
    return this.service.createUser(user.tenantId, body, user.sub);
  }

  @ApiOperation({ summary: 'Update user email, role or status' })
  @RequirePermission('admin.users.update')
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
  ) {
    return this.service.updateUser(user.tenantId, id, body, user.sub);
  }

  @ApiOperation({ summary: 'Soft-delete user (isActive=false, deletedAt=now)' })
  @RequirePermission('admin.users.deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deactivate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deactivateUser(user.tenantId, id, user.sub);
  }

  @ApiOperation({ summary: 'Replace user permission overrides' })
  @RequirePermission('admin.users.update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Put(':id/permissions')
  assignPermissions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: AssignUserPermissionsDto,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Tenant required');
    }
    return this.service.assignUserPermissions(user.tenantId, id, body.overrides);
  }
}
