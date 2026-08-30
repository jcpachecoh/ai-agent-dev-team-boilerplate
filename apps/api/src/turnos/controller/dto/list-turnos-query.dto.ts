import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoJornada, TurnoTipo } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
  return undefined;
}

export class ListTurnosQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  estado?: boolean;

  @ApiPropertyOptional({ description: 'Búsqueda OR sobre nombre, sigla y tipo' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sigla?: string;

  @ApiPropertyOptional({ enum: TurnoTipo })
  @IsOptional()
  @IsEnum(TurnoTipo)
  tipo?: TurnoTipo;

  @ApiPropertyOptional({ enum: TurnoJornada })
  @IsOptional()
  @IsEnum(TurnoJornada)
  jornada?: TurnoJornada;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class ExportTurnosQueryDto extends ListTurnosQueryDto {
  @ApiProperty({ enum: ['excel'] })
  @IsString()
  formato!: string;
}
