import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeContractType } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class AttendanceComparisonQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  anchorDate?: string;

  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'day' })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  period?: 'day' | 'week' | 'month';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ enum: EmployeeContractType })
  @IsOptional()
  @IsEnum(EmployeeContractType)
  contractType?: EmployeeContractType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
