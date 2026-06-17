import { ApiProperty } from '@nestjs/swagger';

export class InventoryMetricBarDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: number;

  @ApiProperty()
  progress!: number;

  @ApiProperty()
  accent!: string;
}

export class InventorySiteBarDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  progress!: number;

  @ApiProperty()
  accent!: string;
}

export class InventoryHistoryPointDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: number;
}

export class InventoryDashboardDto {
  @ApiProperty()
  totalItems!: number;

  @ApiProperty()
  totalValue!: number;

  @ApiProperty()
  lowStockCount!: number;

  @ApiProperty()
  movementsToday!: number;

  @ApiProperty({ type: [InventoryMetricBarDto] })
  topProducts!: InventoryMetricBarDto[];

  @ApiProperty({ type: [InventorySiteBarDto] })
  stockBySite!: InventorySiteBarDto[];

  @ApiProperty({ type: [InventoryHistoryPointDto] })
  historyOccupancy!: InventoryHistoryPointDto[];
}
