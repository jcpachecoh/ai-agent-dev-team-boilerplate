import { ApiProperty } from '@nestjs/swagger';
import { AttendanceObservationResponseDto } from './attendance-observation.response';

export class AttendanceCardDaySummaryDto {
  @ApiProperty()
  workDate!: string;

  @ApiProperty()
  targetMinutes!: number;

  @ApiProperty()
  targetHours!: string;

  @ApiProperty()
  ordinaryMinutes!: number;

  @ApiProperty()
  unworkedMinutes!: number;

  @ApiProperty()
  overtimeMinutes!: number;

  @ApiProperty({ enum: ['ASSIGNED', 'REST', 'NONE', 'VACACIONES'] })
  resolvedKind!: 'ASSIGNED' | 'REST' | 'NONE' | 'VACACIONES';

  @ApiProperty({ nullable: true })
  shiftName!: string | null;

  @ApiProperty({ nullable: true })
  shiftRange!: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Etiqueta para ENTRADA/SALIDA (vacaciones, novedad, incapacidad)',
  })
  absenceLabel!: string | null;
}

export class AttendanceCardResponseDto {
  @ApiProperty({ description: 'Marcaciones (AttendanceLog) del rango, DEVICE + MANUAL' })
  logs!: unknown[];

  @ApiProperty({ type: [AttendanceObservationResponseDto] })
  observations!: AttendanceObservationResponseDto[];

  @ApiProperty({ type: [AttendanceCardDaySummaryDto] })
  daySummaries!: AttendanceCardDaySummaryDto[];
}
