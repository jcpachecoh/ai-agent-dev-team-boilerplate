import { ApiProperty } from '@nestjs/swagger';
import { AttendanceObservationResponseDto } from './attendance-observation.response';

export class AttendanceCardResponseDto {
  @ApiProperty({ description: 'Marcaciones (AttendanceLog) del rango, DEVICE + MANUAL' })
  logs!: unknown[];

  @ApiProperty({ type: [AttendanceObservationResponseDto] })
  observations!: AttendanceObservationResponseDto[];
}
