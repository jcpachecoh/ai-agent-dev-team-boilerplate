import { ApiProperty } from '@nestjs/swagger';

export class AttendanceComparisonSeriesDto {
  @ApiProperty() key!: string;
  @ApiProperty() name!: string;
}

export class AttendanceComparisonPointDto {
  @ApiProperty() label!: string;
  @ApiProperty() bucketKey!: string;
  @ApiProperty() current!: number;
  @ApiProperty() previous!: number;
}

export class AttendanceComparisonSeriesGroupDto {
  @ApiProperty({ type: AttendanceComparisonSeriesDto }) current!: AttendanceComparisonSeriesDto;
  @ApiProperty({ type: AttendanceComparisonSeriesDto }) previous!: AttendanceComparisonSeriesDto;
}

export class AttendanceComparisonSummaryDto {
  @ApiProperty({ enum: ['day', 'week', 'month'] }) period!: 'day' | 'week' | 'month';
  @ApiProperty() anchorDate!: string;
  @ApiProperty() dateFrom!: string;
  @ApiProperty() dateTo!: string;
  @ApiProperty() previousDateFrom!: string;
  @ApiProperty() previousDateTo!: string;
  @ApiProperty({ type: AttendanceComparisonSeriesGroupDto })
  series!: AttendanceComparisonSeriesGroupDto;
  @ApiProperty({ type: [AttendanceComparisonPointDto] }) points!: AttendanceComparisonPointDto[];
}
