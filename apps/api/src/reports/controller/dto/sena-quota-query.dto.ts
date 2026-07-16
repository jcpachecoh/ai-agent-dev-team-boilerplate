import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

/** Query de `GET /api/reports/sena-quota` — solo período (sin filtros de sede/empleado). */
export class SenaQuotaQueryDto {
  @ApiProperty({
    example: '2026-07',
    description: 'Período de nómina YYYY-MM (cierre de mes UTC, mismo convenio que payroll)',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'period must be YYYY-MM' })
  period!: string;
}
