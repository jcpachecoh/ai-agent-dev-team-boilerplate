import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumberString,
} from 'class-validator';
import { StockUnit } from '@prisma/client';

export class CreateSupplyItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codigoInterno!: string;

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

  @ApiProperty()
  @IsNumberString()
  factorConversion!: string;

  @ApiProperty()
  @IsNumberString()
  costoPromedioPonderado!: string;

  @ApiProperty()
  @IsNumberString()
  stockMinimoBodega!: string;

  @ApiProperty()
  @IsNumberString()
  stockMaximoBodega!: string;

  @ApiProperty()
  @IsBoolean()
  aplicaVencimiento!: boolean;

  @ApiProperty()
  @IsBoolean()
  aplicaLote!: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
