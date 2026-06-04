import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePhaseInputNestedDto {
  @ApiProperty({ example: 'supply-item-uuid' })
  @IsString()
  @IsNotEmpty()
  supplyItemId!: string;

  @ApiProperty({
    description: 'Quantity per recipe batch (decimal string)',
    example: '1.250',
  })
  @IsNumberString()
  quantityPerBatch!: string;

  @ApiProperty({ enum: StockUnit, example: StockUnit.GRAMS })
  @IsEnum(StockUnit)
  unit!: StockUnit;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}

export class CreatePhaseDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  order!: number;

  @ApiProperty({ example: 'Mezclado' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Mezclar ingredientes secos' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'work-station-uuid' })
  @IsString()
  @IsNotEmpty()
  workStationId!: string;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  standardMinutes!: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  minOperators?: number;

  @ApiPropertyOptional({ example: 4, default: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxOperators?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  requiresQA?: boolean;

  @ApiPropertyOptional({ type: [CreatePhaseInputNestedDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePhaseInputNestedDto)
  @IsOptional()
  inputs?: CreatePhaseInputNestedDto[];
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Pan integral 500g' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'recipe-category-uuid', nullable: true })
  @IsString()
  @IsOptional()
  categoryId?: string | null;

  @ApiProperty({ example: 'finished-product-uuid' })
  @IsString()
  @IsNotEmpty()
  finishedProductId!: string;

  @ApiProperty({
    description: 'Batch size (decimal string, up to 3 fractional digits)',
    example: '10.000',
  })
  @IsNumberString()
  batchSize!: string;

  @ApiProperty({ enum: StockUnit, example: StockUnit.UNIT })
  @IsEnum(StockUnit)
  batchUnit!: StockUnit;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(1)
  estimatedMinutes!: number;

  @ApiPropertyOptional({ example: 'Receta estándar de producción' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ type: [CreatePhaseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePhaseDto)
  phases!: CreatePhaseDto[];
}
