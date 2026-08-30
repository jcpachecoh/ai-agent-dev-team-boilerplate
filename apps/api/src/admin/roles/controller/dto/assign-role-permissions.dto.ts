import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class AssignRolePermissionsDto {
  @ApiProperty({ type: [String], example: ['permission-id-1', 'permission-id-2'] })
  @IsArray()
  @IsString({ each: true })
  permissionIds!: string[];
}
