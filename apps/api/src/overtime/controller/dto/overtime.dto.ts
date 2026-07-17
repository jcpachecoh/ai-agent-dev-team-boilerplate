import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  OvertimeApprovalDecision,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
} from '@prisma/client';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ListOvertimeRequestsQueryDto {
  @ApiPropertyOptional({ enum: OvertimeStatus, isArray: true })
  @IsOptional()
  @IsString({ each: true })
  status?: OvertimeStatus[];

  @ApiPropertyOptional({ example: '2026-07' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  payrollPeriod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  take?: number;
}

export class OvertimePeriodSummaryQueryDto {
  @ApiProperty({ example: '2026-07' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  payrollPeriod!: string;
}

export class ApproveOvertimeRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class ObjectOvertimeRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comment!: string;
}

export class OvertimeApprovalResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: OvertimeApprovalLevel })
  level!: OvertimeApprovalLevel;

  @ApiPropertyOptional()
  approverId?: string | null;

  @ApiPropertyOptional({ enum: OvertimeApprovalDecision })
  decision?: OvertimeApprovalDecision | null;

  @ApiPropertyOptional()
  decidedAt?: Date | null;

  @ApiPropertyOptional()
  comment?: string | null;
}

export class CreateAdministrativeOvertimeRequestDto {
  @ApiProperty({ type: [String], example: ['emp_1', 'emp_2'] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  employeeIds!: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  /** Día laboral YYYY-MM-DD (America/Bogota intent; stored as UTC midnight DATE). */
  @ApiProperty({ example: '2026-07-20' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
  workDate!: string;

  @ApiProperty({ example: '2026-07-20T22:00:00.000-05:00' })
  @IsISO8601()
  proposedStartTime!: string;

  @ApiProperty({ example: '2026-07-21T01:00:00.000-05:00' })
  @IsISO8601()
  proposedEndTime!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reasonOptionId!: string;
}

export class OvertimeRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  employeeName!: string;

  @ApiProperty()
  locationId!: string;

  @ApiProperty()
  locationName!: string;

  @ApiProperty({ enum: OvertimeRequestType })
  type!: OvertimeRequestType;

  /** Null on SOLICITUD_ADMINISTRATIVA (OS-606); populated for DETECCION_AUTOMATICA. */
  @ApiPropertyOptional({ nullable: true, type: Number })
  accumulatedMinutes!: number | null;

  /** Null on SOLICITUD_ADMINISTRATIVA (OS-606); populated for DETECCION_AUTOMATICA. */
  @ApiPropertyOptional({ nullable: true, type: Date })
  shiftEndTime!: Date | null;

  /** Null on SOLICITUD_ADMINISTRATIVA (OS-606); populated for DETECCION_AUTOMATICA. */
  @ApiPropertyOptional({ nullable: true, type: Date })
  actualEndTime!: Date | null;

  @ApiProperty({ enum: OvertimeStatus })
  status!: OvertimeStatus;

  @ApiPropertyOptional()
  payrollPeriod?: string | null;

  /** OS-606 admin; null on DETECCION_AUTOMATICA. */
  @ApiPropertyOptional({ nullable: true, type: Date })
  workDate?: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  proposedStartTime?: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  proposedEndTime?: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  proposedMinutes?: number | null;

  @ApiPropertyOptional({ nullable: true })
  reasonOptionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  requestedByUserId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  batchId?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

/** Item shape for POST administrative create (no employeeName/locationName required). */
export class AdministrativeOvertimeCreatedItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  locationId!: string;

  @ApiProperty({ enum: OvertimeRequestType })
  type!: OvertimeRequestType;

  @ApiProperty({ enum: OvertimeStatus })
  status!: OvertimeStatus;

  @ApiPropertyOptional({ nullable: true, type: Date })
  workDate!: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  proposedStartTime!: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  proposedEndTime!: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Number })
  proposedMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true })
  reasonOptionId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  requestedByUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  batchId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  payrollPeriod!: string | null;

  /** Detection-only; always null on admin create. */
  @ApiPropertyOptional({ nullable: true, type: Number })
  accumulatedMinutes!: number | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  shiftEndTime!: Date | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  actualEndTime!: Date | null;
}

export class CreateAdministrativeOvertimeBatchResponseDto {
  @ApiProperty()
  batchId!: string;

  @ApiProperty()
  createdCount!: number;

  @ApiProperty({ type: [AdministrativeOvertimeCreatedItemDto] })
  items!: AdministrativeOvertimeCreatedItemDto[];
}

export class OvertimeRequestDetailResponseDto extends OvertimeRequestResponseDto {
  @ApiProperty({ type: [OvertimeApprovalResponseDto] })
  approvals!: OvertimeApprovalResponseDto[];
}

export class OvertimeInboxResponseDto {
  @ApiProperty({ type: [OvertimeRequestResponseDto] })
  items!: OvertimeRequestResponseDto[];

  @ApiProperty()
  pageInfo!: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export class OvertimePeriodSummaryResponseDto {
  @ApiProperty()
  payrollPeriod!: string;

  @ApiProperty()
  pendingCount!: number;

  @ApiProperty()
  approvedCount!: number;

  @ApiProperty()
  objectedCount!: number;
}
