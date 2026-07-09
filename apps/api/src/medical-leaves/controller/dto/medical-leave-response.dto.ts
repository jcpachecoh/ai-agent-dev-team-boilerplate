import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveOrigin, LeaveStatus } from '@prisma/client';

export class MedicalLeaveResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty({ enum: LeaveOrigin }) origin!: LeaveOrigin;
  @ApiProperty() startDate!: Date;
  @ApiProperty() endDate!: Date;
  @ApiProperty() totalDays!: number;
  @ApiProperty() employerPaidDays!: number;
  @ApiProperty() epsArlPaidDays!: number;
  @ApiPropertyOptional() epsArlAmount!: number | null;
  @ApiProperty() employerAmount!: number;
  @ApiPropertyOptional() supportStorageObjectId!: string | null;
  @ApiProperty({ enum: LeaveStatus }) status!: LeaveStatus;
  @ApiPropertyOptional() radicatedAt!: Date | null;
  @ApiPropertyOptional() recoveredAt!: Date | null;
  @ApiPropertyOptional() rejectedAt!: Date | null;
  @ApiPropertyOptional() rejectionReason!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class MedicalLeaveDetailResponseDto extends MedicalLeaveResponseDto {
  @ApiProperty() annualAccumulatedDays!: number;
  @ApiProperty() exceeds180DayThreshold!: boolean;
}

export class MedicalLeaveSummaryResponseDto extends MedicalLeaveResponseDto {
  @ApiProperty() employeeName!: string;
  @ApiPropertyOptional() locationId!: string | null;
  @ApiPropertyOptional() locationName!: string | null;
}

export class MedicalLeaveSupportDocumentUrlResponseDto {
  @ApiProperty() url!: string;
}
