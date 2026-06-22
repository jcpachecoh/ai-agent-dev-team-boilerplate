import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceMonitorEmployeeDto {
  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty({ enum: ['on-shift', 'absent', 'late', 'overtime'] })
  status!: 'on-shift' | 'absent' | 'late' | 'overtime';

  @ApiPropertyOptional()
  entryLabel?: string;

  @ApiPropertyOptional()
  workedMinutes?: number;

  @ApiPropertyOptional()
  overtimeMinutes?: number;

  @ApiPropertyOptional()
  lateMinutes?: number;

  @ApiPropertyOptional()
  daysPresent?: number;

  @ApiPropertyOptional()
  lastEntryAt?: string;
}

class AttendanceMonitorEmployeesDto {
  @ApiProperty({ type: [AttendanceMonitorEmployeeDto] })
  onShift!: AttendanceMonitorEmployeeDto[];

  @ApiProperty({ type: [AttendanceMonitorEmployeeDto] })
  absent!: AttendanceMonitorEmployeeDto[];

  @ApiProperty({ type: [AttendanceMonitorEmployeeDto] })
  late!: AttendanceMonitorEmployeeDto[];

  @ApiProperty({ type: [AttendanceMonitorEmployeeDto] })
  overtime!: AttendanceMonitorEmployeeDto[];
}

class AttendanceMonitorMetricsDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  onShift!: number;

  @ApiProperty()
  absent!: number;

  @ApiProperty()
  lateArrivals!: number;

  @ApiProperty()
  overtime!: number;

  @ApiProperty()
  offSchedule!: number;

  @ApiProperty()
  legalAlerts!: number;
}

export class AttendanceMonitorSummaryDto {
  @ApiProperty()
  locationId!: string;

  @ApiProperty({ enum: ['day', 'week', 'month', 'year'] })
  period!: 'day' | 'week' | 'month' | 'year';

  @ApiProperty()
  anchorDate!: string;

  @ApiProperty()
  dateFrom!: string;

  @ApiProperty()
  dateTo!: string;

  @ApiProperty()
  isLive!: boolean;

  @ApiProperty({ type: AttendanceMonitorMetricsDto })
  metrics!: AttendanceMonitorMetricsDto;

  @ApiProperty({ type: AttendanceMonitorEmployeesDto })
  employees!: AttendanceMonitorEmployeesDto;
}
