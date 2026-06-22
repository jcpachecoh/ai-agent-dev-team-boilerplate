import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class InventoryAlertDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty()
  product!: string;

  @ApiProperty()
  currentStock!: number;

  @ApiProperty()
  threshold!: number;

  @ApiProperty()
  supplier!: string;

  @ApiProperty({ enum: ['critical', 'warning', 'info'] })
  severity!: 'critical' | 'warning' | 'info';

  @ApiProperty()
  isResolved!: boolean;

  @ApiPropertyOptional()
  resolvedAt?: string;
}

export class InventoryAlertSummaryDto {
  @ApiProperty()
  critical!: number;

  @ApiProperty()
  warning!: number;

  @ApiProperty()
  resolvedToday!: number;
}

export class ResolveInventoryAlertDto {
  @ApiPropertyOptional({ description: 'Razón de resolución', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class InventoryResolvedAlertDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  supplyItemId!: string;

  @ApiProperty()
  product!: string;

  @ApiProperty()
  currentStock!: number;

  @ApiProperty()
  threshold!: number;

  @ApiProperty()
  supplier!: string;

  @ApiProperty()
  resolvedAt!: string;

  @ApiPropertyOptional()
  resolvedById?: string;

  @ApiPropertyOptional()
  note?: string;
}
