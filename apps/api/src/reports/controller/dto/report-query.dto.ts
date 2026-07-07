import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeContractType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { AttendanceReportStatusFilter } from './attendance-export-query.dto';

export class PeriodQueryDto {
  @ApiProperty({ example: '2025-06', description: 'Billing period in YYYY-MM format' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'period must be YYYY-MM' })
  period!: string;

  @ApiPropertyOptional({ description: 'Filter by location (employeeDetails.locationId)' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Filter by a single employee' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ enum: EmployeeContractType })
  @IsOptional()
  @IsEnum(EmployeeContractType)
  contractType?: EmployeeContractType;
}

export class AttendanceQueryDto {
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

  @ApiPropertyOptional({ enum: AttendanceReportStatusFilter })
  @IsOptional()
  @IsEnum(AttendanceReportStatusFilter)
  status?: AttendanceReportStatusFilter;
}
