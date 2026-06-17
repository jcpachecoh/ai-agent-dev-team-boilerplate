import { ApiProperty } from '@nestjs/swagger';

export class AttendanceEmployeeRowDto {
  @ApiProperty() employeeId!: string;
  @ApiProperty() employeeName!: string;
  @ApiProperty() cedula!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() locationName!: string;
  @ApiProperty() totalWorkedMinutes!: number;
  @ApiProperty() regularMinutes!: number;
  @ApiProperty() overtimeMinutes!: number;
  @ApiProperty() activeDays!: number;
  @ApiProperty() absentDays!: number;
  /**
   * true when any day's overtime > 120 min OR any ISO week's overtime > 720 min.
   * GAP(Task04): does not account for festive-day overtime reclassification.
   */
  @ApiProperty() exceededLegalOvertimeLimit!: boolean;
}

export class AttendanceReportResponseDto {
  @ApiProperty() tenantId!: string;
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
  @ApiProperty({ type: [AttendanceEmployeeRowDto] }) employees!: AttendanceEmployeeRowDto[];
}
