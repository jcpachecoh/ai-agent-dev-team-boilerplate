import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { ExportFormat } from './export-format.enum';

export enum AttendanceReportStatusFilter {
  ALL = 'ALL',
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
}

/** Filtros de exportación del reporte de asistencia. tenantId siempre del JWT. */
export class AttendanceExportQueryDto {
  @ApiProperty({ enum: ExportFormat })
  @IsEnum(ExportFormat, { message: 'format must be PDF or XLSX' })
  format!: ExportFormat;

  @ApiProperty({ example: '2025-06-01', description: 'Start date YYYY-MM-DD (inclusive)' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'from must be YYYY-MM-DD',
  })
  from!: string;

  @ApiProperty({ example: '2025-06-30', description: 'End date YYYY-MM-DD (inclusive)' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'to must be YYYY-MM-DD',
  })
  to!: string;

  @ApiPropertyOptional({ description: 'Filter by location (employeeDetails.locationId)' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Filter by employee details id' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({
    enum: AttendanceReportStatusFilter,
    default: AttendanceReportStatusFilter.ALL,
  })
  @IsOptional()
  @IsEnum(AttendanceReportStatusFilter)
  status?: AttendanceReportStatusFilter;
}
