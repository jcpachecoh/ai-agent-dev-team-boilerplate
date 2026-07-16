import { ApiProperty } from '@nestjs/swagger';

import type {
  SenaMonetizationRegime,
  SenaQuotaStatus,
} from '../../../payroll/interfaces/sena-quota.interfaces';

/**
 * Respuesta de `GET /api/reports/sena-quota`.
 * Estimación interna — no sustituye la cuota oficial fijada por la regional SENA.
 */
export class SenaQuotaResponseDto {
  @ApiProperty({ example: '2026-07', description: 'Período YYYY-MM solicitado' })
  period!: string;

  @ApiProperty({
    example: 22,
    description: 'Trabajadores computables (FIJO|INDEFINIDO|OBRA) al cierre del período',
  })
  eligibleWorkers!: number;

  @ApiProperty({
    example: 2,
    description: 'Aprendices requeridos estimados (art. 33 Ley 789/2002)',
  })
  requiredApprentices!: number;

  @ApiProperty({ example: 1, description: 'Contratos APRENDIZAJE activos al cierre del período' })
  activeApprentices!: number;

  @ApiProperty({ example: 1, description: 'max(0, required − active)' })
  missingApprentices!: number;

  @ApiProperty({ example: 1_750_905, description: 'SMLV vigente al cierre del período (NOM-06)' })
  smlv!: number;

  @ApiProperty({
    enum: ['LEY_789_2002', 'LEY_2466_2025'],
    example: 'LEY_2466_2025',
    description:
      'Régimen de monetización: LEY_789_2002 si as-of < 2025-06-25; LEY_2466_2025 desde esa fecha inclusive',
  })
  monetizationRegime!: SenaMonetizationRegime;

  @ApiProperty({
    example: 2_626_358,
    description: 'Monto estimado de monetización en COP enteros (fórmula según régimen)',
  })
  estimatedMonetizationAmount!: number;

  @ApiProperty({
    enum: ['EXEMPT', 'COMPLIANT', 'PENDING'],
    example: 'PENDING',
  })
  status!: SenaQuotaStatus;

  @ApiProperty({
    example: true,
    description:
      'Siempre true: el resultado es estimativo y no sustituye la cuota oficial del SENA',
  })
  estimated!: true;
}
