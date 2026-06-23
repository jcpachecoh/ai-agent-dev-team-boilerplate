import { UseGuards } from '@nestjs/common';
import { Args, Field, ID, InputType, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { DocumentType, PermissionEffect } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import type { JwtPayload } from '../../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AdminUsersService } from '../service/admin-users.service';

@ObjectType('AdminUserRole')
class AdminUserRoleType {
  @Field(() => ID) id!: string;
  @Field() code!: string;
  @Field() name!: string;
}

@ObjectType('AdminUser')
export class AdminUserType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field() name!: string;
  @Field() cedula!: string;
  @Field() documentType!: string;
  @Field() email!: string;
  @Field(() => AdminUserRoleType) role!: AdminUserRoleType;
  @Field() isActive!: boolean;
  @Field() emailVerified!: boolean;
  @Field(() => Date, { nullable: true }) lastLoginAt!: Date | null;
  @Field() createdAt!: Date;
}

@ObjectType('AdminUserDetail')
export class AdminUserDetailType extends AdminUserType {
  @Field() loginAttempts!: number;
  @Field(() => Date, { nullable: true }) lockedUntil!: Date | null;
  @Field(() => Date, { nullable: true }) passwordChangedAt!: Date | null;
  @Field(() => String, { nullable: true }) createdBy!: string | null;
}

@InputType()
class CreateAdminUserInput {
  @IsString() @IsNotEmpty() @Field() name!: string;
  @IsString() @IsNotEmpty() @Field() cedula!: string;
  @IsEnum(DocumentType) @Field() documentType!: DocumentType;
  @IsEmail() @Field() email!: string;
  @IsString() @IsNotEmpty() @Field() roleId!: string;
  @IsString() @IsOptional() @Field({ nullable: true }) locationId?: string;
  @IsString() @IsOptional() @Field({ nullable: true }) password?: string;
}

@InputType()
class UpdateAdminUserInput {
  @IsEmail() @IsOptional() @Field({ nullable: true }) email?: string;
  @IsString() @IsOptional() @Field({ nullable: true }) roleId?: string;
  @IsBoolean() @IsOptional() @Field({ nullable: true }) isActive?: boolean;
}

@InputType()
class PermissionOverrideInput {
  @IsString() @Field() permissionId!: string;
  @IsEnum(PermissionEffect) @Field() effect!: PermissionEffect;
}

@InputType()
class AssignUserPermissionsInput {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideInput)
  @Field(() => [PermissionOverrideInput])
  overrides!: PermissionOverrideInput[];
}

@Resolver(() => AdminUserType)
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersResolver {
  constructor(private readonly service: AdminUsersService) {}

  @RequirePermission('admin.users.read')
  @Query(() => [AdminUserType], { name: 'adminUsers' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Args('includeInactive', { nullable: true, type: () => Boolean }) includeInactive?: boolean,
  ) {
    return this.service.findAll(user.tenantId, includeInactive ?? false);
  }

  @RequirePermission('admin.users.read')
  @Query(() => AdminUserDetailType, { name: 'adminUser', nullable: true })
  findOne(@CurrentUser() user: JwtPayload, @Args('id', { type: () => ID }) id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @RequirePermission('admin.users.create')
  @Mutation(() => AdminUserType, { name: 'adminCreateUser' })
  createUser(@CurrentUser() user: JwtPayload, @Args('input') input: CreateAdminUserInput) {
    return this.service.createUser(user.tenantId, input, user.sub);
  }

  @RequirePermission('admin.users.update')
  @Mutation(() => AdminUserType, { name: 'adminUpdateUser' })
  updateUser(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateAdminUserInput,
  ) {
    return this.service.updateUser(user.tenantId, id, input, user.sub);
  }

  @RequirePermission('admin.users.deactivate')
  @Mutation(() => Boolean, { name: 'adminDeactivateUser' })
  async deactivateUser(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ) {
    await this.service.deactivateUser(user.tenantId, id, user.sub);
    return true;
  }

  @RequirePermission('admin.users.update')
  @Mutation(() => Boolean, { name: 'adminAssignUserPermissions' })
  async assignUserPermissions(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: AssignUserPermissionsInput,
    @Args('userId', { type: () => ID }) userId: string,
  ) {
    await this.service.assignUserPermissions(user.tenantId, userId, input.overrides);
    return true;
  }
}
