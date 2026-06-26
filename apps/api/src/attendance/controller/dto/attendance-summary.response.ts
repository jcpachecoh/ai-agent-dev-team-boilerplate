import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceShift } from '@prisma/client';
import type {
  KioskAuthResult,
  EntryResult,
  ExitResult,
  OvertimeSummary,
  WorkPair,
  ActiveAttendanceEntry,
} from '../../interfaces/attendance.interfaces';

export class KioskAuthResponseDto implements KioskAuthResult {
  @ApiProperty() userId!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
}

export class EntryResponseDto implements EntryResult {
  @ApiProperty() logId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() workDate!: Date;
  @ApiProperty() timestamp!: Date;
  @ApiPropertyOptional({ enum: AttendanceShift, nullable: true }) shift!: AttendanceShift | null;
}

export class WorkPairDto implements WorkPair {
  @ApiProperty() entryId!: string;
  @ApiPropertyOptional() exitId?: string;
  @ApiProperty() entryTimestamp!: Date;
  @ApiPropertyOptional() exitTimestamp?: Date;
  @ApiProperty() durationMinutes!: number;
}

export class ExitResponseDto implements ExitResult {
  @ApiProperty() logId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() workDate!: Date;
  @ApiProperty() timestamp!: Date;
  @ApiProperty() totalMinutes!: number;
  @ApiProperty() overtimeMinutes!: number;
  @ApiProperty() isNocturno!: boolean;
}

export class OvertimeSummaryDto implements OvertimeSummary {
  @ApiProperty() employeeId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() workDate!: string;
  @ApiProperty() totalMinutes!: number;
  @ApiProperty() overtimeMinutes!: number;
  @ApiProperty() isNocturno!: boolean;
  @ApiProperty({ type: [WorkPairDto] }) pairs!: WorkPair[];
}

export class ActiveAttendanceEntryDto implements ActiveAttendanceEntry {
  @ApiProperty() logId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() locationId!: string;
  @ApiProperty() entryTimestamp!: Date;
  @ApiProperty() workDate!: Date;
  @ApiPropertyOptional({ enum: AttendanceShift, nullable: true }) shift!: AttendanceShift | null;
}
