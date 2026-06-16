import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockUnit } from '@prisma/client';

export class PhaseInputResponseDto {
  @ApiProperty({ example: 'input-uuid' })
  id!: string;

  @ApiProperty({ example: 'tenant-uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'phase-uuid' })
  phaseId!: string;

  @ApiProperty({ example: 'supply-item-uuid' })
  supplyItemId!: string;

  @ApiProperty({ example: '1.250', description: 'Decimal serialized as string' })
  quantityPerBatch!: string;

  @ApiProperty({ enum: StockUnit })
  unit!: StockUnit;

  @ApiProperty({ example: false })
  isOptional!: boolean;
}

export class ProductionPhaseResponseDto {
  @ApiProperty({ example: 'phase-uuid' })
  id!: string;

  @ApiProperty({ example: 'tenant-uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'recipe-uuid' })
  recipeId!: string;

  @ApiProperty({ example: 'work-station-uuid' })
  workStationId!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 'Mezclado' })
  name!: string;

  @ApiPropertyOptional({ example: 'Mezclar ingredientes secos', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 15 })
  standardMinutes!: number;

  @ApiProperty({ example: 1 })
  minOperators!: number;

  @ApiProperty({ example: 4 })
  maxOperators!: number;

  @ApiProperty({ example: false })
  requiresQA!: boolean;

  @ApiProperty({ type: [PhaseInputResponseDto] })
  inputs!: PhaseInputResponseDto[];
}

export class RecipeDetailResponseDto {
  @ApiProperty({ example: 'recipe-uuid' })
  id!: string;

  @ApiProperty({ example: 'tenant-uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'Pan integral 500g' })
  name!: string;

  @ApiProperty({ example: 'finished-product-uuid' })
  finishedProductId!: string;

  @ApiProperty({ example: '10.000', description: 'Decimal serialized as string' })
  batchSize!: string;

  @ApiProperty({ enum: StockUnit })
  batchUnit!: StockUnit;

  @ApiProperty({ example: 120 })
  estimatedMinutes!: number;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [ProductionPhaseResponseDto] })
  phases!: ProductionPhaseResponseDto[];

  @ApiProperty({
    example: 45,
    description: 'Sum of phases.standardMinutes',
  })
  totalStandardMinutes!: number;
}
