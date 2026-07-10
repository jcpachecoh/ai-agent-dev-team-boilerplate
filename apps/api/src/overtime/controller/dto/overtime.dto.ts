import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OvertimeApprovalDecision, OvertimeApprovalLevel, OvertimeStatus } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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

  @ApiProperty()
  accumulatedMinutes!: number;

  @ApiProperty()
  shiftEndTime!: Date;

  @ApiProperty()
  actualEndTime!: Date;

  @ApiProperty({ enum: OvertimeStatus })
  status!: OvertimeStatus;

  @ApiPropertyOptional()
  payrollPeriod?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
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
