import { ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveOrigin, LeaveStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class ListMedicalLeavesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ enum: LeaveStatus })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiPropertyOptional({ enum: LeaveOrigin })
  @IsOptional()
  @IsEnum(LeaveOrigin)
  origin?: LeaveOrigin;

  @ApiPropertyOptional({ example: '2026-03', description: 'Filtro por mes calendario (YYYY-MM)' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
