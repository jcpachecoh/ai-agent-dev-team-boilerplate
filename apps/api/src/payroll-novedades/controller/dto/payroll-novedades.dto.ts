import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NovedadRequestSource, NovedadType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class SubmitNovedadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ enum: NovedadType })
  @IsEnum(NovedadType)
  type!: NovedadType;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-07-05' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supportStorageObjectId?: string;

  @ApiProperty({ enum: NovedadRequestSource })
  @IsEnum(NovedadRequestSource)
  requestedBy!: NovedadRequestSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  overlapWarningAck?: boolean;

  @ApiPropertyOptional({ description: 'Solo RRHH — aprueba en un paso' })
  @IsOptional()
  @IsBoolean()
  autoApprove?: boolean;
}

export class RejectNovedadDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  rejectionReason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class ListPayrollNovedadesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ enum: NovedadType })
  @IsOptional()
  @IsEnum(NovedadType)
  type?: NovedadType;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  supervisorInbox?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  rrhhInbox?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  take?: number;
}

export class UpdateNovedadTypeConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresSupervisorApproval?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresSupportDocument?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPaidDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSolicitable?: boolean;
}

export class EditNovedadDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-05' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  overlapWarningAck?: boolean;
}

export class PayrollNovedadResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty({ enum: NovedadType }) type!: NovedadType;
  @ApiProperty() startDate!: Date;
  @ApiProperty() endDate!: Date;
  @ApiProperty() isPaid!: boolean;
  @ApiPropertyOptional() linkedLeaveId?: string | null;
  @ApiPropertyOptional() supportStorageObjectId?: string | null;
  @ApiPropertyOptional() notes?: string | null;
  @ApiProperty({ enum: NovedadRequestSource }) requestedBy!: NovedadRequestSource;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() supervisorApproverId?: string | null;
  @ApiPropertyOptional() supervisorDecisionAt?: Date | null;
  @ApiPropertyOptional() supervisorComment?: string | null;
  @ApiPropertyOptional() rrhhApproverId?: string | null;
  @ApiPropertyOptional() rrhhDecisionAt?: Date | null;
  @ApiPropertyOptional() rejectionReason?: string | null;
  @ApiProperty() overlapWarningAck!: boolean;
  @ApiProperty() isEditable!: boolean;
  @ApiPropertyOptional() editBlockedReason?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class PayrollNovedadSummaryResponseDto extends PayrollNovedadResponseDto {
  @ApiProperty() employeeName!: string;
  @ApiPropertyOptional() locationId?: string | null;
  @ApiPropertyOptional() locationName?: string | null;
}

export class SubmitNovedadResponseDto {
  @ApiProperty({ type: PayrollNovedadResponseDto }) novedad!: PayrollNovedadResponseDto;
  @ApiPropertyOptional({ type: [String] }) warnings?: string[];
}

export class NovedadTypeConfigResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: NovedadType }) type!: NovedadType;
  @ApiProperty() requiresSupervisorApproval!: boolean;
  @ApiProperty() requiresSupportDocument!: boolean;
  @ApiProperty() isPaidDefault!: boolean;
  @ApiProperty() autoSolicitable!: boolean;
}

export class NovedadAuditLogResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() novedadId!: string;
  @ApiProperty() changedBy!: string;
  @ApiPropertyOptional() changedByName?: string | null;
  @ApiProperty() changedAt!: Date;
  @ApiProperty() previousValue!: Record<string, unknown>;
  @ApiProperty() newValue!: Record<string, unknown>;
}

export class EditNovedadResponseDto {
  @ApiProperty({ type: PayrollNovedadResponseDto }) novedad!: PayrollNovedadResponseDto;
  @ApiProperty({ type: NovedadAuditLogResponseDto }) auditLog!: NovedadAuditLogResponseDto;
}

export class SupportDocumentUrlResponseDto {
  @ApiProperty() url!: string;
}
