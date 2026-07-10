import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManualMarkingReasonOptionDto {
  @ApiProperty({ example: 'PERMISO_REMUNERADO' })
  code!: string;

  @ApiProperty({ example: 'Permiso remunerado' })
  label!: string;

  @ApiProperty({ enum: ['ATTENDANCE_ONLY', 'PAYROLL_NOVEDAD', 'MEDICAL_LEAVE'] })
  target!: string;

  @ApiPropertyOptional({ example: 'PERMISO_REMUNERADO' })
  novedadType?: string;

  @ApiPropertyOptional({ enum: ['COMUN', 'LABORAL'] })
  leaveOrigin?: string;
}
