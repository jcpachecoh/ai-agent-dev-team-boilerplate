import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWorkstationDto {
  @ApiProperty({ example: 'Línea de empaque' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'LINE-01' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ example: 'Planta norte' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Bodega A' })
  @IsString()
  @IsOptional()
  location?: string;
}
