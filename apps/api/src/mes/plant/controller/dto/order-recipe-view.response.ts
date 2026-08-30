import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderRecipePhaseIngredientResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: '20 g' })
  quantity!: string;

  @ApiProperty({ example: 'GRAMS' })
  unit!: string;

  @ApiPropertyOptional()
  supplier?: string;

  @ApiProperty()
  stockWarning!: boolean;
}

export class OrderRecipePhaseResponseDto {
  @ApiProperty({ description: 'Phase execution ID' })
  id!: string;

  @ApiProperty({ example: 1 })
  index!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: 5 })
  durationMinutes!: number;

  @ApiPropertyOptional()
  instruction?: string;

  @ApiProperty({ type: [OrderRecipePhaseIngredientResponseDto] })
  ingredients!: OrderRecipePhaseIngredientResponseDto[];

  @ApiProperty({ enum: ['completed', 'current', 'pending'] })
  status!: 'completed' | 'current' | 'pending';
}

export class OrderRecipeViewResponseDto {
  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  recipeName!: string;

  @ApiProperty({ example: '10 unidades' })
  batchSize!: string;

  @ApiProperty()
  stationId!: string;

  @ApiProperty({ example: 'Parrilla' })
  stationName!: string;

  @ApiProperty({ example: 2 })
  currentPhaseIndex!: number;

  @ApiPropertyOptional({ description: 'Active phase execution ID for operator actions' })
  currentStepId?: string;

  @ApiProperty({ enum: ['pending', 'in_progress', 'paused', 'completed'] })
  status!: 'pending' | 'in_progress' | 'paused' | 'completed';

  @ApiProperty({ type: [OrderRecipePhaseResponseDto] })
  phases!: OrderRecipePhaseResponseDto[];

  @ApiPropertyOptional({ example: 872 })
  elapsedSeconds?: number;
}
