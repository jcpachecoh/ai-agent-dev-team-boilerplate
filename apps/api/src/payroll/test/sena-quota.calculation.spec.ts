import { EmployeeContractType } from '@prisma/client';

import {
  SENA_CUOTA_HISTORICAL_WORKFORCE_PCT,
  SENA_CUOTA_LEY_2466_EFFECTIVE_FROM,
  SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES,
  SENA_QUOTA_EXCLUDED_FROM_ELIGIBLE_BASE,
} from '../payroll.constants';
import {
  computeMissingApprentices,
  computeSenaQuotaFromCounts,
  estimateMonetizationAmount,
  estimateRequiredApprentices,
  isSenaApprenticeContractType,
  isSenaQuotaEligibleContractType,
  resolveMonetizationRegime,
  resolveSenaQuotaStatus,
  SENA_QUOTA_OBLIGATION_THRESHOLD,
  usesPostReformSenaMonetization,
} from '../utils/sena-quota.calculation';

const PRE_REFORM = new Date('2025-06-24T23:59:59.999Z');
const POST_REFORM = new Date('2025-06-25T00:00:00.000Z');
const SMLV = 1_423_500;

describe('sena-quota.calculation (OS-599 contrato de salida)', (): void => {
  describe('SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES', (): void => {
    it('incluye FIJO, INDEFINIDO y OBRA como única fuente de verdad', (): void => {
      expect(SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES.has(EmployeeContractType.FIJO)).toBe(true);
      expect(SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES.has(EmployeeContractType.INDEFINIDO)).toBe(true);
      expect(SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES.has(EmployeeContractType.OBRA)).toBe(true);
      expect(isSenaQuotaEligibleContractType(EmployeeContractType.FIJO)).toBe(true);
      expect(isSenaQuotaEligibleContractType(EmployeeContractType.INDEFINIDO)).toBe(true);
      expect(isSenaQuotaEligibleContractType(EmployeeContractType.OBRA)).toBe(true);
    });

    it('excluye APRENDIZAJE y PRESTACION (prestación de servicios) del denominador', (): void => {
      expect(SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES.has(EmployeeContractType.APRENDIZAJE)).toBe(false);
      expect(SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES.has(EmployeeContractType.PRESTACION)).toBe(false);
      expect(SENA_QUOTA_EXCLUDED_FROM_ELIGIBLE_BASE.has(EmployeeContractType.APRENDIZAJE)).toBe(
        true,
      );
      expect(SENA_QUOTA_EXCLUDED_FROM_ELIGIBLE_BASE.has(EmployeeContractType.PRESTACION)).toBe(
        true,
      );
      expect(isSenaQuotaEligibleContractType(EmployeeContractType.APRENDIZAJE)).toBe(false);
      expect(isSenaQuotaEligibleContractType(EmployeeContractType.PRESTACION)).toBe(false);
      expect(isSenaApprenticeContractType(EmployeeContractType.APRENDIZAJE)).toBe(true);
    });
  });

  describe('estimateRequiredApprentices — umbrales art. 33', (): void => {
    it('menos de 15 trabajadores → 0 (exento)', (): void => {
      expect(estimateRequiredApprentices(0)).toBe(0);
      expect(estimateRequiredApprentices(14)).toBe(0);
      expect(SENA_QUOTA_OBLIGATION_THRESHOLD).toBe(15);
    });

    it('exactamente 15 / 20 / 21 / 29 / 30', (): void => {
      expect(estimateRequiredApprentices(15)).toBe(1);
      expect(estimateRequiredApprentices(20)).toBe(1);
      expect(estimateRequiredApprentices(21)).toBe(1);
      expect(estimateRequiredApprentices(29)).toBe(1);
      expect(estimateRequiredApprentices(30)).toBe(2);
    });
  });

  describe('monetizationRegime', (): void => {
    it('LEY_789_2002 el 2025-06-24; LEY_2466_2025 el 2025-06-25', (): void => {
      expect(resolveMonetizationRegime(PRE_REFORM)).toBe('LEY_789_2002');
      expect(resolveMonetizationRegime(POST_REFORM)).toBe('LEY_2466_2025');
      expect(usesPostReformSenaMonetization(PRE_REFORM)).toBe(false);
      expect(usesPostReformSenaMonetization(POST_REFORM)).toBe(true);
      expect(SENA_CUOTA_LEY_2466_EFFECTIVE_FROM.toISOString()).toBe('2025-06-25T00:00:00.000Z');
      expect(SENA_CUOTA_HISTORICAL_WORKFORCE_PCT).toBe(0.05);
    });
  });

  describe('monetización histórica art. 34 (5% × trabajadores × SMLMV)', (): void => {
    it('15 trabajadores sin aprendices → 5% × 15 × SMLV', (): void => {
      const amount = estimateMonetizationAmount({
        asOfDate: PRE_REFORM,
        eligibleWorkers: 15,
        requiredApprentices: 1,
        missingApprentices: 1,
        smlv: SMLV,
        postReformFactor: 1.5,
      });
      expect(amount).toBe(Math.round(0.05 * 15 * SMLV));
    });

    it('30 trabajadores, 1 faltante → mitad de (5% × 30 × SMLV)', (): void => {
      const full = 0.05 * 30 * SMLV;
      const amount = estimateMonetizationAmount({
        asOfDate: PRE_REFORM,
        eligibleWorkers: 30,
        requiredApprentices: 2,
        missingApprentices: 1,
        smlv: SMLV,
        postReformFactor: 1.5,
      });
      expect(amount).toBe(Math.round((1 / 2) * full));
    });

    it('cuota completa histórica → monetización 0; sin monetizationFactor', (): void => {
      const result = computeSenaQuotaFromCounts({
        eligibleWorkers: 20,
        activeApprentices: 1,
        smlv: SMLV,
        asOfDate: PRE_REFORM,
      });
      expect(result.status).toBe('COMPLIANT');
      expect(result.monetizationRegime).toBe('LEY_789_2002');
      expect(result.estimatedMonetizationAmount).toBe(0);
      expect(result).not.toHaveProperty('monetizationFactor');
    });
  });

  describe('monetización post Ley 2466 (1.5 SMLMV por faltante)', (): void => {
    it('frontera exacta: 2025-06-25 usa régimen nuevo', (): void => {
      const amount = estimateMonetizationAmount({
        asOfDate: POST_REFORM,
        eligibleWorkers: 15,
        requiredApprentices: 1,
        missingApprentices: 1,
        smlv: SMLV,
        postReformFactor: 1.5,
      });
      expect(amount).toBe(Math.round(SMLV * 1.5));
    });

    it('frontera exacta: 2025-06-24 usa régimen histórico (no 1.5)', (): void => {
      const historical = estimateMonetizationAmount({
        asOfDate: PRE_REFORM,
        eligibleWorkers: 15,
        requiredApprentices: 1,
        missingApprentices: 1,
        smlv: SMLV,
        postReformFactor: 1.5,
      });
      const post = estimateMonetizationAmount({
        asOfDate: POST_REFORM,
        eligibleWorkers: 15,
        requiredApprentices: 1,
        missingApprentices: 1,
        smlv: SMLV,
        postReformFactor: 1.5,
      });
      expect(historical).toBe(Math.round(0.05 * 15 * SMLV));
      expect(post).toBe(Math.round(SMLV * 1.5));
      expect(historical).not.toBe(post);
    });

    it('cuota parcial post-reforma → missing × SMLV × 1.5; sin monetizationFactor', (): void => {
      const result = computeSenaQuotaFromCounts({
        eligibleWorkers: 30,
        activeApprentices: 1,
        smlv: SMLV,
        asOfDate: POST_REFORM,
        postReformFactor: 1.5,
      });
      expect(result.missingApprentices).toBe(1);
      expect(result.status).toBe('PENDING');
      expect(result.monetizationRegime).toBe('LEY_2466_2025');
      expect(result.estimatedMonetizationAmount).toBe(Math.round(SMLV * 1.5));
      expect(result).not.toHaveProperty('monetizationFactor');
    });

    it('cuota completa post-reforma → monetización 0', (): void => {
      const result = computeSenaQuotaFromCounts({
        eligibleWorkers: 20,
        activeApprentices: 1,
        smlv: SMLV,
        asOfDate: POST_REFORM,
        postReformFactor: 1.5,
      });
      expect(result.status).toBe('COMPLIANT');
      expect(result.monetizationRegime).toBe('LEY_2466_2025');
      expect(result.estimatedMonetizationAmount).toBe(0);
      expect(result).not.toHaveProperty('monetizationFactor');
    });
  });

  describe('estados', (): void => {
    it('EXEMPT bajo umbral; aprendices de más no generan crédito', (): void => {
      const exempt = computeSenaQuotaFromCounts({
        eligibleWorkers: 10,
        activeApprentices: 0,
        smlv: SMLV,
        asOfDate: POST_REFORM,
      });
      expect(exempt.status).toBe('EXEMPT');
      expect(exempt.estimatedMonetizationAmount).toBe(0);
      expect(computeMissingApprentices(1, 3)).toBe(0);
      expect(resolveSenaQuotaStatus(20, 0)).toBe('COMPLIANT');
    });
  });
});
