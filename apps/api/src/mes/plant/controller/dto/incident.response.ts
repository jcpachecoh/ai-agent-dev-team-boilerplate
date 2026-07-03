import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlarmSeverity, IncidentType, NoveltyType } from '@prisma/client';

export class IncidentResponseDto {
  @ApiProperty({ example: 'incident-uuid' })
  id!: string;

  @ApiProperty({ example: 'palos-de-lena' })
  tenantId!: string;

  @ApiPropertyOptional({ example: 'order-uuid', nullable: true })
  orderId!: string | null;

  @ApiPropertyOptional({ example: 'execution-uuid', nullable: true })
  executionId!: string | null;

  @ApiProperty({ example: 'work-station-uuid' })
  workStationId!: string;

  @ApiPropertyOptional({ example: 'location-uuid', nullable: true })
  locationId!: string | null;

  @ApiProperty({ example: 'operator-uuid', description: 'Reporter operational user id' })
  operatorUserId!: string;

  @ApiProperty({ enum: IncidentType })
  type!: IncidentType;

  @ApiPropertyOptional({ enum: NoveltyType, nullable: true })
  noveltyType!: NoveltyType | null;

  @ApiProperty({ enum: AlarmSeverity })
  severity!: AlarmSeverity;

  @ApiProperty({ example: 'Producto fuera de especificación en línea 2' })
  description!: string;

  @ApiProperty({ example: false })
  requiresPause!: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/incidents/photo.jpg',
    nullable: true,
  })
  photoUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ example: 'supervisor-uuid', nullable: true })
  resolvedBy!: string | null;

  @ApiPropertyOptional({ nullable: true })
  resolution!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

/** WebSocket `incident:created` payload (ticket contract). */
export class IncidentCreatedPayload {
  @ApiProperty({ example: 'incident-uuid' })
  incidentId!: string;

  @ApiProperty({ example: 'work-station-uuid' })
  stationId!: string;

  @ApiPropertyOptional({ example: 'order-uuid' })
  orderId?: string;

  @ApiPropertyOptional({ example: 'execution-uuid' })
  executionId?: string;

  @ApiProperty({ enum: IncidentType, example: IncidentType.QUALITY })
  type!: IncidentType;

  @ApiProperty({ enum: AlarmSeverity, example: AlarmSeverity.WARNING })
  severity!: AlarmSeverity;
}
