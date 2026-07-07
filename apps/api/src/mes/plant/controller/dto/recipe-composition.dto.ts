import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecipeComponentType, RecipeUsageUnit } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecipeCompositionLineDto {
  @ApiPropertyOptional({ example: 'line-uuid' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ example: 'supply-item-uuid' })
  @IsString()
  @IsNotEmpty()
  supplyItemId!: string;

  @ApiProperty({ enum: RecipeComponentType, example: RecipeComponentType.INGREDIENT })
  @IsEnum(RecipeComponentType)
  componentType!: RecipeComponentType;

  @ApiProperty({ enum: RecipeUsageUnit, example: RecipeUsageUnit.GRAM })
  @IsEnum(RecipeUsageUnit)
  usageUnit!: RecipeUsageUnit;

  @ApiProperty({
    description: 'Gross quantity (decimal string, up to 3 decimals)',
    example: '1.250',
  })
  @IsNumberString()
  grossQuantity!: string;

  @ApiProperty({ description: 'Net quantity (decimal string, up to 3 decimals)', example: '1.000' })
  @IsNumberString()
  netQuantity!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class RecipeCompositionLineResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplyItemId!: string;

  @ApiProperty()
  supplyItemCode!: string;

  @ApiProperty()
  supplyItemName!: string;

  @ApiProperty({ enum: RecipeComponentType })
  componentType!: RecipeComponentType;

  @ApiProperty({ enum: RecipeUsageUnit })
  usageUnit!: RecipeUsageUnit;

  @ApiProperty()
  grossQuantity!: string;

  @ApiProperty()
  netQuantity!: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ description: 'Calculated shrinkage percentage' })
  shrinkagePercent!: number;
}

export class RecipeCompositionLinesDto {
  @ApiProperty({ type: [RecipeCompositionLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeCompositionLineDto)
  lines!: RecipeCompositionLineDto[];
}
