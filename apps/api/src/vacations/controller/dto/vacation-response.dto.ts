import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VacationStatus, VacationType } from '@prisma/client';

export class VacationBalanceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  accruedDays!: number;

  @ApiProperty()
  takenDays!: number;

  @ApiProperty()
  compensatedDays!: number;

  @ApiProperty()
  availableDays!: number;

  @ApiProperty()
  lastAccrualDate!: Date;
}

export class VacationRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  @ApiProperty()
  daysRequested!: number;

  @ApiProperty({ enum: VacationType })
  type!: VacationType;

  @ApiProperty({ enum: VacationStatus })
  status!: VacationStatus;

  @ApiPropertyOptional({ nullable: true })
  level1ApprovedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  level1ActedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  level2ApprovedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  level2ActedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  letterStorageObjectId!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class VacationRequestSummaryResponseDto extends VacationRequestResponseDto {
  @ApiProperty()
  employeeName!: string;

  @ApiPropertyOptional({ nullable: true })
  locationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  locationName!: string | null;
}

export class VacationLetterUrlResponseDto {
  @ApiProperty()
  url!: string;
}
