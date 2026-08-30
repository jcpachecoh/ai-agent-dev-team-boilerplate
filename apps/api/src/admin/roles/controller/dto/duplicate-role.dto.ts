import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class DuplicateRoleDto {
  @ApiProperty({ example: 'WAREHOUSE_ADMIN_COPY' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'code must be UPPER_SNAKE_CASE' })
  code!: string;

  @ApiProperty({ example: 'Warehouse Admin (Copia)' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
