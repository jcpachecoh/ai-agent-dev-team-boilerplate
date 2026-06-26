import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  BatchDisplayUnit,
  OperationCenter,
  RecipeAllergen,
  RecipeType,
  StockUnit,
  TechnicalResponsible,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateRecipeDto {
  @ApiPropertyOptional({ example: 'Pan integral 500g' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'recipe-category-uuid', nullable: true })
  @IsString()
  @IsOptional()
  categoryId?: string | null;

  @ApiPropertyOptional({ enum: RecipeType, example: RecipeType.FINAL_PRODUCT })
  @IsEnum(RecipeType)
  @IsOptional()
  recipeType?: RecipeType;

  @ApiPropertyOptional({ example: 'finished-product-uuid' })
  @IsString()
  @IsOptional()
  finishedProductId?: string;

  @ApiPropertyOptional({
    description: 'Batch size (decimal string)',
    example: '10.000',
  })
  @IsNumberString()
  @IsOptional()
  batchSize?: string;

  @ApiPropertyOptional({ enum: StockUnit })
  @IsEnum(StockUnit)
  @IsOptional()
  batchUnit?: StockUnit;

  @ApiPropertyOptional({ enum: BatchDisplayUnit, example: BatchDisplayUnit.UNIT })
  @IsEnum(BatchDisplayUnit)
  @IsOptional()
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
  @IsInt()
  @Min(1)
  @IsOptional()
  packageWeightGrams?: number;

  @ApiPropertyOptional({ description: 'Expected yield quantity', example: '10.00' })
  @IsNumberString()
  @IsOptional()
  expectedYield?: string;

  @ApiPropertyOptional({ description: 'Expected yield unit label', example: 'porciones' })
  @IsString()
  @IsOptional()
  expectedYieldUnit?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsInt()
  @Min(1)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ enum: OperationCenter, example: OperationCenter.PLANT })
  @IsEnum(OperationCenter)
  @IsOptional()
  operationCenter?: OperationCenter;

  @ApiPropertyOptional({ type: [String], example: ['location-uuid'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  locationIds?: string[];

  @ApiPropertyOptional({ enum: TechnicalResponsible, example: TechnicalResponsible.CHEF })
  @IsEnum(TechnicalResponsible)
  @IsOptional()
  technicalResponsible?: TechnicalResponsible;

  @ApiPropertyOptional({ enum: RecipeAllergen, isArray: true })
  @IsArray()
  @IsEnum(RecipeAllergen, { each: true })
  @IsOptional()
  allergens?: RecipeAllergen[];

  @ApiPropertyOptional({ example: 'Notas de la receta' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDraft?: boolean;
}
