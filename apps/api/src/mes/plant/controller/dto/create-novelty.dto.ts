import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlarmSeverity, IncidentType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';

export enum NoveltyType {
  INGREDIENT_SHORTAGE = 'INGREDIENT_SHORTAGE',
  EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE',
  RECIPE_DEVIATION = 'RECIPE_DEVIATION',
  UNPLANNED_STOP = 'UNPLANNED_STOP',
  SAFETY_INCIDENT = 'SAFETY_INCIDENT',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  OTHER = 'OTHER',
}

export enum NoveltySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export function mapNoveltyType(noveltyType: NoveltyType): IncidentType {
  switch (noveltyType) {
    case NoveltyType.EQUIPMENT_FAILURE:
      return IncidentType.EQUIPMENT;
    case NoveltyType.SAFETY_INCIDENT:
      return IncidentType.SAFETY;
    case NoveltyType.QUALITY_ISSUE:
    case NoveltyType.RECIPE_DEVIATION:
      return IncidentType.QUALITY;
    default:
      return IncidentType.OTHER;
  }
}

export function mapNoveltySeverity(severity: NoveltySeverity): AlarmSeverity {
  switch (severity) {
    case NoveltySeverity.LOW:
      return AlarmSeverity.INFO;
    case NoveltySeverity.MEDIUM:
      return AlarmSeverity.WARNING;
    case NoveltySeverity.HIGH:
      return AlarmSeverity.CRITICAL;
  }
}

export class CreateNoveltyDto {
  @ApiProperty({ example: 'work-station-uuid' })
  @IsString()
  @IsNotEmpty()
  workStationId!: string;

  @ApiProperty({ enum: NoveltyType, example: NoveltyType.EQUIPMENT_FAILURE })
  @IsEnum(NoveltyType)
  noveltyType!: NoveltyType;

  @ApiProperty({ enum: NoveltySeverity, example: NoveltySeverity.HIGH })
  @IsEnum(NoveltySeverity)
  severity!: NoveltySeverity;

  @ApiProperty({ example: 'Falla en mezcladora principal' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description!: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/incidents/photo.jpg',
  })
  @IsUrl()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    description:
      'Si true, pausa la orden aunque severity no sea HIGH. En MVP es trigger de comportamiento, no se persiste.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresPause?: boolean;

  @ApiPropertyOptional({
    description: 'ID del paso de ejecución de fase (stepId en ticket → executionId en modelo).',
    example: 'execution-uuid',
  })
  @IsString()
  @IsOptional()
  stepId?: string;
}
