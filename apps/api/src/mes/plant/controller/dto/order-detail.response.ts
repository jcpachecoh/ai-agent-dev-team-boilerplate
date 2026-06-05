import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PhaseExecutionStatus,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
  StockUnit,
} from '@prisma/client';

export class OrderListItemResponseDto {
  @ApiProperty({ example: 'order-uuid' })
  id!: string;

  @ApiProperty({ example: 'palos-de-lena' })
  tenantId!: string;

  @ApiProperty({ example: '0134' })
  number!: string;

  @ApiProperty({ enum: ProductionOrderStatus })
  status!: ProductionOrderStatus;

  @ApiProperty({ enum: ProductionPriority })
  priority!: ProductionPriority;

  @ApiProperty({ enum: ProductionShift })
  shift!: ProductionShift;

  @ApiProperty()
  plannedStartAt!: Date;

  @ApiProperty({ example: 'recipe-uuid' })
  recipeId!: string;

  @ApiPropertyOptional({ example: 'Pan integral 500g' })
  recipeName?: string;
}

export class OrderExecutionResponseDto {
  @ApiProperty({ example: 'execution-uuid' })
  id!: string;

  @ApiProperty({ example: 'phase-uuid' })
  phaseId!: string;

  @ApiProperty({ example: 1 })
  phaseOrder!: number;

  @ApiProperty({ example: 'Mezclado' })
  phaseName!: string;

  @ApiProperty({ example: false })
  requiresQA!: boolean;

  @ApiProperty({ example: 'work-station-uuid' })
  workStationId!: string;

  @ApiProperty({ enum: PhaseExecutionStatus })
  status!: PhaseExecutionStatus;

  @ApiProperty({ example: 30 })
  plannedMinutes!: number;

  @ApiPropertyOptional({ example: 28, nullable: true })
  actualMinutes!: number | null;

  @ApiPropertyOptional({ example: '100.000', nullable: true })
  producedQuantity!: string | null;

  @ApiPropertyOptional({ nullable: true })
  qaApprovedAt!: Date | null;

  @ApiPropertyOptional({ example: 'supervisor-uuid', nullable: true })
  qaApprovedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
}

export class ActiveOperatorResponseDto {
  @ApiProperty({ example: 'session-uuid' })
  sessionId!: string;

  @ApiProperty({ example: 'operator-uuid' })
  operatorUserId!: string;

  @ApiProperty({ example: 'work-station-uuid' })
  workStationId!: string;

  @ApiPropertyOptional({ example: 'execution-uuid', nullable: true })
  phaseExecutionId!: string | null;

  @ApiProperty()
  startedAt!: Date;
}

export class OrderDetailResponseDto {
  @ApiProperty({ example: 'order-uuid' })
  id!: string;

  @ApiProperty({ example: 'palos-de-lena' })
  tenantId!: string;

  @ApiProperty({ example: '0134' })
  number!: string;

  @ApiProperty({ example: 'recipe-uuid' })
  recipeId!: string;

  @ApiProperty({ example: 'Pan integral 500g' })
  recipeName!: string;

  @ApiProperty({ example: 1 })
  recipeVersion!: number;

  @ApiProperty({ enum: ProductionOrderStatus })
  status!: ProductionOrderStatus;

  @ApiProperty({ enum: ProductionPriority })
  priority!: ProductionPriority;

  @ApiProperty({ enum: ProductionShift })
  shift!: ProductionShift;

  @ApiProperty({ example: 2 })
  batchCount!: number;

  @ApiProperty({ example: '20.000', description: 'Decimal serialized as string' })
  plannedQuantity!: string;

  @ApiPropertyOptional({ example: '18.500', nullable: true })
  producedQuantity!: string | null;

  @ApiProperty({ enum: StockUnit })
  unit!: StockUnit;

  @ApiProperty()
  plannedStartAt!: Date;

  @ApiProperty()
  plannedEndAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  actualStartAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  actualEndAt!: Date | null;

  @ApiPropertyOptional({ example: 'supervisor-uuid', nullable: true })
  supervisorId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [OrderExecutionResponseDto] })
  executions!: OrderExecutionResponseDto[];

  @ApiProperty({ type: [ActiveOperatorResponseDto] })
  activeOperators!: ActiveOperatorResponseDto[];
}
