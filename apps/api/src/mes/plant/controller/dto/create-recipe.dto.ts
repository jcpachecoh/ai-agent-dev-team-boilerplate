import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BatchDisplayUnit,
  OperationCenter,
  RecipeAllergen,
  RecipeType,
  StockUnit,
  TechnicalResponsible,
} from '@prisma/client';
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
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { RecipeCompositionLineDto } from './recipe-composition.dto';

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
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'recipe-category-uuid' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ enum: RecipeType, example: RecipeType.FINAL_PRODUCT })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsEnum(RecipeType)
  @IsNotEmpty()
  recipeType?: RecipeType;

  @ApiPropertyOptional({ example: 'finished-product-uuid', nullable: true })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsString()
  @IsNotEmpty()
  finishedProductId?: string;

  @ApiProperty({
    description: 'Batch size (decimal string, up to 3 fractional digits)',
    example: '10.000',
  })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsNumberString()
  batchSize?: string;

  @ApiPropertyOptional({ enum: StockUnit, example: StockUnit.UNIT })
  @IsEnum(StockUnit)
  @IsOptional()
  batchUnit?: StockUnit;

  @ApiPropertyOptional({ enum: BatchDisplayUnit, example: BatchDisplayUnit.UNIT })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsEnum(BatchDisplayUnit)
  batchDisplayUnit?: BatchDisplayUnit;

  @ApiPropertyOptional({
    description: 'Legacy approximate weight per package in kg (decimal string)',
    example: '0.440',
    nullable: true,
  })
  @IsNumberString()
  @IsOptional()
  packageWeight?: string | null;

  @ApiPropertyOptional({
    description: 'Approximate weight per batch in grams',
    example: 440,
  })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsInt()
  @Min(1)
  packageWeightGrams?: number;

  @ApiPropertyOptional({ description: 'Expected yield quantity', example: '10.00' })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsNumberString()
  expectedYield?: string;

  @ApiPropertyOptional({ description: 'Expected yield unit label', example: 'porciones' })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsString()
  @IsNotEmpty()
  expectedYieldUnit?: string;

  @ApiPropertyOptional({ example: 120 })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ enum: OperationCenter, example: OperationCenter.PLANT })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsEnum(OperationCenter)
  operationCenter?: OperationCenter;

  @ApiPropertyOptional({ type: [String], example: ['location-uuid'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  locationIds?: string[];

  @ApiPropertyOptional({ enum: TechnicalResponsible, example: TechnicalResponsible.CHEF })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsEnum(TechnicalResponsible)
  technicalResponsible?: TechnicalResponsible;

  @ApiPropertyOptional({ enum: RecipeAllergen, isArray: true })
  @IsArray()
  @IsEnum(RecipeAllergen, { each: true })
  @IsOptional()
  allergens?: RecipeAllergen[];

  @ApiPropertyOptional({ example: 'Receta estándar de producción' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;

  @ApiPropertyOptional({ type: [CreatePhaseDto], default: [] })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePhaseDto)
  phases?: CreatePhaseDto[];

  @ApiPropertyOptional({ type: [RecipeCompositionLineDto] })
  @ValidateIf((dto: CreateRecipeDto) => !dto.isDraft)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeCompositionLineDto)
  composition?: RecipeCompositionLineDto[];
}
