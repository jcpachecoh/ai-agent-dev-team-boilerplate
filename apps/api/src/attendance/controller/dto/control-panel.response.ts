import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceEventType } from '@prisma/client';

export class ControlPanelMetricsDto {
  @ApiProperty() workingNow!: number;
  @ApiProperty() attendanceToday!: number;
  @ApiProperty() tenantAttendanceToday!: number;
  @ApiProperty() overtimeHoursMonth!: number;
}

export class ControlPanelTimelineRowDto {
  @ApiProperty() employeeId!: string;
  @ApiProperty() userId!: string;
  @ApiPropertyOptional() photoUrl!: string | null;
  @ApiProperty() documentNumber!: string;
  @ApiPropertyOptional() primerApellido!: string | null;
  @ApiPropertyOptional() nombres!: string | null;
  @ApiProperty() especialidad!: string;
  @ApiProperty() area!: string;
  @ApiProperty() contrato!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() locationName!: string;
  @ApiProperty() lastRecordAt!: string;
  @ApiProperty({ enum: AttendanceEventType }) lastEventType!: AttendanceEventType;
  @ApiPropertyOptional() latitude!: number | null;
  @ApiPropertyOptional() longitude!: number | null;
  @ApiProperty() hasGeo!: boolean;
  @ApiProperty() isOutOfGeofence!: boolean;
}

export class ControlPanelTimelinePageDto {
  @ApiProperty({ type: [ControlPanelTimelineRowDto] }) items!: ControlPanelTimelineRowDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}

export class ControlPanelAlertDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() subtitle?: string;
  @ApiProperty() generatedAt!: string;
  @ApiPropertyOptional() employeeId?: string;
  @ApiPropertyOptional() employeeName?: string;
}

export class ControlPanelFiltersDto {
  @ApiProperty({ type: [String] }) areas!: string[];
  @ApiProperty({ type: [String] }) contractTypes!: string[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  locations!: Array<{ id: string; name: string }>;
}

export class ControlPanelSummaryDto {
  @ApiProperty() anchorDate!: string;
  @ApiProperty({ enum: ['day', 'week', 'month'] }) period!: 'day' | 'week' | 'month';
  @ApiProperty() dateFrom!: string;
  @ApiProperty() dateTo!: string;
  @ApiProperty() tenantName!: string;
  @ApiProperty() isLive!: boolean;
  @ApiProperty({ type: ControlPanelMetricsDto }) metrics!: ControlPanelMetricsDto;
  @ApiProperty({ type: ControlPanelTimelinePageDto }) timeline!: ControlPanelTimelinePageDto;
  @ApiProperty({ type: [ControlPanelAlertDto] }) alerts!: ControlPanelAlertDto[];
  @ApiProperty({ type: ControlPanelFiltersDto }) filters!: ControlPanelFiltersDto;
}
