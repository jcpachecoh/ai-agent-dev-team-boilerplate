import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlarmSeverity, PlantAlarmType } from '@prisma/client';

/** WebSocket `alarm:triggered` payload (ticket contract — not legacy apps/plant shapes). */
export class AlarmTriggeredPayload {
  @ApiProperty({ enum: PlantAlarmType, example: PlantAlarmType.TIEMPO_EXCEDIDO })
  alarmType!: PlantAlarmType;

  @ApiProperty({ enum: AlarmSeverity, example: AlarmSeverity.WARNING })
  severity!: AlarmSeverity;

  @ApiProperty({ example: 'work-station-uuid' })
  stationId!: string;

  @ApiPropertyOptional({ example: 'order-uuid' })
  orderId?: string;

  @ApiPropertyOptional({ example: 'execution-uuid' })
  executionId?: string;

  @ApiProperty({ example: 'Fase excedió tiempo estándar' })
  message!: string;
}
