import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PilaExportFormat, PilaPeriodExportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PilaListQueryDto {
  @ApiPropertyOptional({ example: '2026-07', description: 'Período salud YYYY-MM' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'period must be YYYY-MM' })
  period?: string;

  @ApiPropertyOptional({ enum: PilaPeriodExportStatus })
  @IsOptional()
  @IsEnum(PilaPeriodExportStatus)
  status?: PilaPeriodExportStatus;

  @ApiPropertyOptional({ enum: PilaExportFormat, description: 'Filtrar por formato TXT | XLSX' })
  @IsOptional()
  @IsEnum(PilaExportFormat)
  format?: PilaExportFormat;
}

export class GeneratePilaExportDto {
  @ApiPropertyOptional({
    enum: PilaExportFormat,
    default: PilaExportFormat.TXT,
    description: 'Formato de salida. Solo TXT | XLSX (no MIME arbitrario).',
  })
  @IsOptional()
  @IsEnum(PilaExportFormat)
  format?: PilaExportFormat;
}

export class MarkPilaExportPaidDto {
  @ApiProperty({ example: 'PL-2026-000123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  planNumber!: string;

  @ApiPropertyOptional({ example: 'REF-BANCO-999' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  paymentReference?: string;

  @ApiProperty({ example: '2026-07-15T15:00:00.000Z' })
  @IsDateString()
  paidAt!: string;
}

export class VoidPilaExportDto {
  @ApiProperty({ example: 'Corrección de datos del aportante' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class PilaExportResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  periodHealth!: string;

  @ApiProperty()
  periodOther!: string;

  @ApiProperty({ enum: PilaExportFormat })
  format!: PilaExportFormat;

  @ApiProperty({ enum: PilaPeriodExportStatus })
  status!: PilaPeriodExportStatus;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  technicalVersion!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty()
  fileChecksum!: string;

  @ApiProperty()
  employeeCount!: number;

  @ApiProperty()
  totalPayrollAmount!: number;

  @ApiProperty()
  totalContribution!: number;

  @ApiProperty()
  storageObjectId!: string;

  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty()
  generatedBy!: string;

  @ApiPropertyOptional()
  paidAt?: Date | null;

  @ApiPropertyOptional()
  paidConfirmedBy?: string | null;

  @ApiPropertyOptional()
  planNumber?: string | null;

  @ApiPropertyOptional()
  paymentReference?: string | null;

  @ApiPropertyOptional()
  voidedAt?: Date | null;

  @ApiPropertyOptional()
  voidedBy?: string | null;

  @ApiPropertyOptional()
  voidReason?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PilaValidationErrorDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  field!: string;

  @ApiProperty()
  message!: string;

  @ApiPropertyOptional()
  employeeId?: string;

  @ApiPropertyOptional()
  employeeName?: string;
}

export class PilaValidationResponseDto {
  @ApiProperty()
  ok!: boolean;

  @ApiProperty({ type: [PilaValidationErrorDto] })
  @Type(() => PilaValidationErrorDto)
  errors!: PilaValidationErrorDto[];

  @ApiPropertyOptional()
  summary?: Record<string, unknown> | null;
}

export class PilaDeadlineResponseDto {
  @ApiProperty()
  period!: string;

  @ApiProperty()
  paymentMonth!: string;

  @ApiPropertyOptional({ nullable: true })
  dueDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  businessDayNumber!: number | null;

  @ApiPropertyOptional({ nullable: true })
  lastTwoNitDigits!: string | null;

  @ApiPropertyOptional({ nullable: true })
  daysRemaining!: number | null;

  @ApiProperty({
    enum: ['NOT_DUE', 'UPCOMING', 'DUE_TODAY', 'OVERDUE', 'PAID', 'CONFIG_INCOMPLETE'],
  })
  status!: string;

  @ApiProperty()
  shouldAlert!: boolean;

  @ApiProperty({ example: 'America/Bogota' })
  timezone!: string;

  @ApiPropertyOptional()
  message?: string;
}
