import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
