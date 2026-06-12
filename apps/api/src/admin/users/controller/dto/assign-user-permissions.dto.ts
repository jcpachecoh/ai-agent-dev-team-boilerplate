import { ApiProperty } from '@nestjs/swagger';
import { PermissionEffect } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsString, ValidateNested } from 'class-validator';

class PermissionOverrideItemDto {
  @IsString()
  permissionId!: string;

  @IsEnum(PermissionEffect)
  effect!: PermissionEffect;
}

export class AssignUserPermissionsDto {
  @ApiProperty({ type: [PermissionOverrideItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideItemDto)
  overrides!: PermissionOverrideItemDto[];
}
