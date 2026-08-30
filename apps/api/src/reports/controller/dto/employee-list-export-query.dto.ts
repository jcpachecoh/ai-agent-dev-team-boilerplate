import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeContractType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ExportFormat } from './export-format.enum';

export enum EmployeeListReportType {
  EMPLOYEES = 'EMPLOYEES',
  CONTRACTS = 'CONTRACTS',
}

/** Filtros de exportación del listado de empleados. tenantId siempre del JWT, nunca en body. */
export class EmployeeListExportQueryDto {
  @ApiProperty({ enum: ExportFormat, description: 'Export format: PDF or XLSX' })
  @IsEnum(ExportFormat, { message: 'format must be PDF or XLSX' })
  format!: ExportFormat;

  @ApiPropertyOptional({ enum: EmployeeListReportType, default: EmployeeListReportType.EMPLOYEES })
  @IsOptional()
  @IsEnum(EmployeeListReportType)
  reportType?: EmployeeListReportType;

  @ApiPropertyOptional({ description: 'Filter by location (employeeDetails.locationId)' })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Filter by employee details id' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned position id' })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional({ description: 'Filter by operational area (partial match)' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Filter by HR department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ enum: EmployeeContractType })
  @IsOptional()
  @IsEnum(EmployeeContractType)
  contractType?: EmployeeContractType;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name, cédula or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
