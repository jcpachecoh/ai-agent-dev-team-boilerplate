import { EmployeeContractType } from '@prisma/client';

import type { SenaMonetizationRegime, SenaQuotaStatus } from '../interfaces/sena-quota.interfaces';
import {
  SENA_CUOTA_HISTORICAL_WORKFORCE_PCT,
  SENA_CUOTA_LEY_2466_EFFECTIVE_FROM,
  SENA_CUOTA_POST_REFORM_PER_MISSING_SMLV,
  SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES,
  SENA_QUOTA_OBLIGATION_THRESHOLD,
} from '../payroll.constants';

export {
  SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES,
  SENA_QUOTA_EXCLUDED_FROM_ELIGIBLE_BASE,
  SENA_QUOTA_OBLIGATION_THRESHOLD,
  SENA_CUOTA_LEY_2466_EFFECTIVE_FROM,
  SENA_CUOTA_HISTORICAL_WORKFORCE_PCT,
  SENA_CUOTA_POST_REFORM_PER_MISSING_SMLV,
} from '../payroll.constants';

export function isSenaQuotaEligibleContractType(type: EmployeeContractType): boolean {
  return SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES.has(type);
}

export function isSenaApprenticeContractType(type: EmployeeContractType): boolean {
  return type === EmployeeContractType.APRENDIZAJE;
}

export function usesPostReformSenaMonetization(asOfDate: Date): boolean {
  return asOfDate.getTime() >= SENA_CUOTA_LEY_2466_EFFECTIVE_FROM.getTime();
}

export function resolveMonetizationRegime(asOfDate: Date): SenaMonetizationRegime {
  return usesPostReformSenaMonetization(asOfDate) ? 'LEY_2466_2025' : 'LEY_789_2002';
}

/**
 * Cuota estimada de aprendices (Ley 789/2002 art. 33):
 * - < 15 → 0 (exento)
 * - 15–20 → 1
 * - > 20 → floor(n/20) + 1 si el remanente ≥ 10
 */
export function estimateRequiredApprentices(eligibleWorkers: number): number {
  if (eligibleWorkers < SENA_QUOTA_OBLIGATION_THRESHOLD) {
    return 0;
  }
  if (eligibleWorkers <= 20) {
    return 1;
  }
  const fullBlocks = Math.floor(eligibleWorkers / 20);
  const remainder = eligibleWorkers % 20;
  return fullBlocks + (remainder >= 10 ? 1 : 0);
}

export function resolveSenaQuotaStatus(
  eligibleWorkers: number,
  missingApprentices: number,
): SenaQuotaStatus {
  if (eligibleWorkers < SENA_QUOTA_OBLIGATION_THRESHOLD) {
    return 'EXEMPT';
  }
  return missingApprentices === 0 ? 'COMPLIANT' : 'PENDING';
}

export function computeMissingApprentices(
  requiredApprentices: number,
  activeApprentices: number,
): number {
  return Math.max(0, requiredApprentices - activeApprentices);
}

/**
 * Monetización estimada por período.
 *
 * Histórico (< 2025-06-25) — Ley 789/2002 art. 34:
 *   total = 5% × eligibleWorkers × SMLMV
 *   parcial = (missing / required) × total
 *
 * Vigente (≥ 2025-06-25) — Ley 2466/2025 art. 23:
 *   missing × SMLMV × factor interno (NOM-06 `SENA_CUOTA_MONETIZACION_FACTOR`, tip. 1.5)
 * El factor 1.5 no se expone en el resultado público.
 */
export function estimateMonetizationAmount(input: {
  asOfDate: Date;
  eligibleWorkers: number;
  requiredApprentices: number;
  missingApprentices: number;
  smlv: number;
  postReformFactor: number;
}): number {
  if (input.missingApprentices <= 0 || input.requiredApprentices <= 0) {
    return 0;
  }

  if (!usesPostReformSenaMonetization(input.asOfDate)) {
    const fullAmount = SENA_CUOTA_HISTORICAL_WORKFORCE_PCT * input.eligibleWorkers * input.smlv;
    return Math.round((input.missingApprentices / input.requiredApprentices) * fullAmount);
  }

  return Math.round(input.missingApprentices * input.smlv * input.postReformFactor);
}

export type SenaQuotaCountsInput = {
  eligibleWorkers: number;
  activeApprentices: number;
  smlv: number;
  asOfDate: Date;
  /** Factor NOM-06 post-reforma (interno); se ignora en régimen histórico art. 34. */
  postReformFactor?: number;
};

export type SenaQuotaCountsResult = {
  eligibleWorkers: number;
  requiredApprentices: number;
  activeApprentices: number;
  missingApprentices: number;
  smlv: number;
  monetizationRegime: SenaMonetizationRegime;
  estimatedMonetizationAmount: number;
  status: SenaQuotaStatus;
  estimated: true;
};

/** Motor puro — sin I/O. */
export function computeSenaQuotaFromCounts(input: SenaQuotaCountsInput): SenaQuotaCountsResult {
  const requiredApprentices = estimateRequiredApprentices(input.eligibleWorkers);
  const missingApprentices = computeMissingApprentices(
    requiredApprentices,
    input.activeApprentices,
  );
  const status = resolveSenaQuotaStatus(input.eligibleWorkers, missingApprentices);
  const postReformFactor = input.postReformFactor ?? SENA_CUOTA_POST_REFORM_PER_MISSING_SMLV;
  const monetizationRegime = resolveMonetizationRegime(input.asOfDate);
  const estimatedMonetizationAmount = estimateMonetizationAmount({
    asOfDate: input.asOfDate,
    eligibleWorkers: input.eligibleWorkers,
    requiredApprentices,
    missingApprentices,
    smlv: input.smlv,
    postReformFactor,
  });

  return {
    eligibleWorkers: input.eligibleWorkers,
    requiredApprentices,
    activeApprentices: input.activeApprentices,
    missingApprentices,
    smlv: input.smlv,
    monetizationRegime,
    estimatedMonetizationAmount,
    status,
    estimated: true,
  };
}
