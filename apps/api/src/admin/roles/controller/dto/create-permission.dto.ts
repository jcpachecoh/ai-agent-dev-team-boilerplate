import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'plant.orders.export' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Exportar órdenes de producción' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'plant' })
  @IsString()
  @IsOptional()
  module?: string;

  @ApiPropertyOptional({ example: 'orders' })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ example: 'export' })
  @IsString()
  @IsOptional()
  action?: string;
}
