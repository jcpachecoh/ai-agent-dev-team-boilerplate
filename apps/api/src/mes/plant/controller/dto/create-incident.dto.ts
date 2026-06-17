import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlarmSeverity, IncidentType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty({ example: 'work-station-uuid' })
  @IsString()
  @IsNotEmpty()
  workStationId!: string;

  @ApiPropertyOptional({ example: 'execution-uuid' })
  @IsString()
  @IsOptional()
  executionId?: string;

  @ApiPropertyOptional({ example: 'order-uuid' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ enum: IncidentType, example: IncidentType.QUALITY })
  @IsEnum(IncidentType)
  type!: IncidentType;

  @ApiProperty({ enum: AlarmSeverity, example: AlarmSeverity.WARNING })
  @IsEnum(AlarmSeverity)
  severity!: AlarmSeverity;

  @ApiProperty({ example: 'Producto fuera de especificación en línea 2' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  description!: string;

  @ApiPropertyOptional({ example: 'location-uuid' })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/incidents/photo.jpg',
    description: 'Optional URL string only — no upload in MES-08',
  })
  @IsUrl()
  @IsOptional()
  photoUrl?: string;
}
