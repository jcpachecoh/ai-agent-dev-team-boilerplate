import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

import type { JwtPayload } from '../../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AdminRolesService } from '../service/admin-roles.service';

@ObjectType('PermissionCatalog')
class PermissionCatalogType {
  @Field(() => ID) id!: string;
  @Field() code!: string;
  @Field() name!: string;
  @Field(() => String, { nullable: true }) description!: string | null;
  @Field(() => String, { nullable: true }) module!: string | null;
  @Field(() => String, { nullable: true }) resource!: string | null;
  @Field(() => String, { nullable: true }) action!: string | null;
}

@ObjectType('RolePermissionRef')
class RolePermissionRefType {
  @Field(() => ID) id!: string;
  @Field() code!: string;
  @Field() name!: string;
  @Field(() => String, { nullable: true }) module!: string | null;
  @Field(() => String, { nullable: true }) resource!: string | null;
  @Field(() => String, { nullable: true }) action!: string | null;
}

@ObjectType('AdminRole')
export class AdminRoleType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field() code!: string;
  @Field() name!: string;
  @Field(() => String, { nullable: true }) description!: string | null;
  @Field() isActive!: boolean;
  @Field(() => Int) userCount!: number;
  @Field(() => Int) permissionCount!: number;
  @Field() createdAt!: Date;
}

@ObjectType('AdminRoleDetail')
class AdminRoleDetailType extends AdminRoleType {
  @Field(() => [RolePermissionRefType]) permissions!: RolePermissionRefType[];
}

@InputType()
class CreateRoleInput {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'code must be UPPER_SNAKE_CASE' })
  @Field()
  code!: string;

  @IsString() @IsNotEmpty() @Field() name!: string;

  @IsString() @IsOptional() @Field({ nullable: true }) description?: string;
}

@InputType()
class UpdateRoleInput {
  @IsString() @IsOptional() @Field({ nullable: true }) name?: string;
  @IsString() @IsOptional() @Field({ nullable: true }) description?: string;
  @IsBoolean() @IsOptional() @Field({ nullable: true }) isActive?: boolean;
}

@Resolver(() => AdminRoleType)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminRolesResolver {
  constructor(private readonly service: AdminRolesService) {}

  @RequirePermission('admin.roles.read')
  @Query(() => [PermissionCatalogType], { name: 'adminPermissions' })
  getPermissions() {
    return this.service.getPermissionCatalog();
  }

  @RequirePermission('admin.roles.read')
  @Query(() => [AdminRoleType], { name: 'adminRoles' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Args('includeInactive', { nullable: true, type: () => Boolean }) includeInactive?: boolean,
  ) {
    return this.service.findAll(user.tenantId, includeInactive ?? false);
  }

  @RequirePermission('admin.roles.read')
  @Query(() => AdminRoleDetailType, { name: 'adminRole', nullable: true })
  findOne(@CurrentUser() user: JwtPayload, @Args('id', { type: () => ID }) id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @RequirePermission('admin.roles.manage')
  @Mutation(() => AdminRoleType, { name: 'adminCreateRole' })
  createRole(@CurrentUser() user: JwtPayload, @Args('input') input: CreateRoleInput) {
    return this.service.createRole(user.tenantId, input);
  }

  @RequirePermission('admin.roles.manage')
  @Mutation(() => AdminRoleType, { name: 'adminUpdateRole' })
  updateRole(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRoleInput,
  ) {
    return this.service.updateRole(user.tenantId, id, input);
  }

  @RequirePermission('admin.roles.manage')
  @Mutation(() => Boolean, { name: 'adminDeactivateRole' })
  async deactivateRole(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ) {
    await this.service.deactivateRole(user.tenantId, id);
    return true;
  }

  @RequirePermission('admin.roles.permissions.assign')
  @Mutation(() => Boolean, { name: 'adminAssignRolePermissions' })
  async assignRolePermissions(
    @CurrentUser() user: JwtPayload,
    @Args('roleId', { type: () => ID }) roleId: string,
    @Args('permissionIds', { type: () => [ID] }) permissionIds: string[],
  ) {
    await this.service.assignRolePermissions(user.tenantId, roleId, permissionIds);
    return true;
  }
}
