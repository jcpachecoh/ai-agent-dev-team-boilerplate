import { ApiPropertyOptional } from '@nestjs/swagger';
import { AlarmSeverity, IncidentType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value as boolean;
}

export class ListIncidentsQueryDto {
  @ApiPropertyOptional({ example: 'order-uuid' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ example: 'work-station-uuid' })
  @IsString()
  @IsOptional()
  workStationId?: string;

  @ApiPropertyOptional({ enum: IncidentType })
  @IsEnum(IncidentType)
  @IsOptional()
  type?: IncidentType;

  @ApiPropertyOptional({ enum: AlarmSeverity })
  @IsEnum(AlarmSeverity)
  @IsOptional()
  severity?: AlarmSeverity;

  @ApiPropertyOptional({
    description: 'When true, only resolved incidents; when false, only open incidents',
    example: false,
  })
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  resolved?: boolean;
}
