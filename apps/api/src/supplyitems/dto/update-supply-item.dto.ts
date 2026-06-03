import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSupplyItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nombre?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  codigoInterno?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoriaId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ enum: StockUnit })
  @IsEnum(StockUnit)
  @IsOptional()
  unidadBase?: StockUnit;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  factorConversion?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  costoPromedioPonderado?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  stockMinimoBodega?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  stockMaximoBodega?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  aplicaVencimiento?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  aplicaLote?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
