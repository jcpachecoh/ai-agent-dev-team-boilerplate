import { ApiProperty } from '@nestjs/swagger';

export class InventoryReportRowDto {
  @ApiProperty()
  category!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  percent!: string;
}

export class InventoryReportDistributionDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  progress!: number;

  @ApiProperty()
  accent!: string;
}

export class InventoryReportSummaryDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  accent!: string;
}

export class InventoryReportDto {
  @ApiProperty({ type: [InventoryReportRowDto] })
  rows!: InventoryReportRowDto[];

  @ApiProperty({ type: [InventoryReportDistributionDto] })
  distribution!: InventoryReportDistributionDto[];

  @ApiProperty({ type: [InventoryReportSummaryDto] })
  summary!: InventoryReportSummaryDto[];
}
