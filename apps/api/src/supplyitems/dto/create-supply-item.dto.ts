import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSupplyItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Internal code; auto-generated from category prefix when omitted',
  })
  @IsString()
  @IsOptional()
  codigoInterno?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoriaId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ enum: StockUnit })
  @IsEnum(StockUnit)
  unidadBase!: StockUnit;

  @ApiProperty({ example: '1' })
  @IsNumberString()
  factorConversion!: string;

  @ApiPropertyOptional({ example: '0' })
  @IsNumberString()
  @IsOptional()
  costoPromedioPonderado?: string;

  @ApiProperty({ example: '10' })
  @IsNumberString()
  stockMinimoBodega!: string;

  @ApiProperty({ example: '100' })
  @IsNumberString()
  stockMaximoBodega!: string;

  @ApiPropertyOptional({ example: '0', description: 'Current warehouse stock; defaults to 0' })
  @IsNumberString()
  @IsOptional()
  stockActualBodega?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  aplicaVencimiento?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  aplicaLote?: boolean;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Required when aplicaVencimiento is true',
  })
  @IsString()
  @IsOptional()
  fechaVencimiento?: string | null;

  @ApiPropertyOptional({ example: 'LOTE-0001', description: 'Required when aplicaLote is true' })
  @IsString()
  @IsOptional()
  lote?: string | null;

  @ApiPropertyOptional({ description: 'Required for Dotación category' })
  @IsString()
  @IsOptional()
  subcategoria?: string;

  @ApiPropertyOptional({ description: 'Required for Dotación category' })
  @IsString()
  @IsOptional()
  genero?: string;

  @ApiPropertyOptional({ description: 'Required for Dotación category' })
  @IsString()
  @IsOptional()
  talla?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Location (sede/planta) id' })
  @IsString()
  @IsOptional()
  locationId?: string;
}
