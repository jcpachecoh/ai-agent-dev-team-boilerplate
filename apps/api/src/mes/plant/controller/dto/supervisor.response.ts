import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupervisorOverviewKpiDto {
  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  delta?: string;

  @ApiPropertyOptional()
  accent?: string;
}

export class SupervisorOverviewResponseDto {
  @ApiProperty({ type: [SupervisorOverviewKpiDto] })
  kpis!: SupervisorOverviewKpiDto[];

  @ApiProperty({ type: [Object] })
  stations!: unknown[];

  @ApiProperty({ type: [Object] })
  alarms!: unknown[];

  @ApiProperty({ type: [Object] })
  news!: unknown[];

  @ApiProperty()
  activeStationCount!: number;
}

export class SupervisorStationsResponseDto {
  @ApiProperty({ type: [Object] })
  stations!: unknown[];
}
