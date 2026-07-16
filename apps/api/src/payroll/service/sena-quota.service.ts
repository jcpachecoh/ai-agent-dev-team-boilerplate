import { BadRequestException, Injectable } from '@nestjs/common';

import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import type {
  ISenaQuotaService,
  SenaQuotaPeriod,
  SenaQuotaResult,
} from '../interfaces/sena-quota.interfaces';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';
import {
  computeSenaQuotaFromCounts,
  isSenaApprenticeContractType,
  isSenaQuotaEligibleContractType,
  usesPostReformSenaMonetization,
} from '../utils/sena-quota.calculation';

/**
 * OS-599 Fase 1 — estimación de cuota SENA por tenant/período.
 *
 * Fuente histórica de contratos: `EmploymentContract` (bulk `findContractsAsOfForTenant`).
 * Base computable: únicamente `SENA_QUOTA_ELIGIBLE_CONTRACT_TYPES` (payroll.constants).
 *
 * Monetización:
 * - < 2025-06-25: art. 34 Ley 789 (5% × trabajadores × SMLMV, parcial proporcional).
 * - ≥ 2025-06-25: Ley 2466 art. 23 vía NOM-06 `SENA_CUOTA_MONETIZACION_FACTOR` (1.5).
 *
 * SMLV siempre vía `LaborLegalParametersService.getValueAt('SMLV', ...)`.
 */
@Injectable()
export class SenaQuotaService implements ISenaQuotaService {
  constructor(
    private readonly contractRepository: EmployeeContractRepository,
    private readonly legalParametersService: LaborLegalParametersService,
  ) {}

  async calculateForTenant(tenantId: string, period: SenaQuotaPeriod): Promise<SenaQuotaResult> {
    const { year, month } = this.parsePeriod(period);
    const asOfDate = this.lastDayOfMonth(year, month);

    const contractsPromise = this.contractRepository.findContractsAsOfForTenant(tenantId, asOfDate);
    const smlvPromise = this.legalParametersService.getValueAt('SMLV', asOfDate, tenantId);
    const postReformFactorPromise = usesPostReformSenaMonetization(asOfDate)
      ? this.legalParametersService.getValueAt('SENA_CUOTA_MONETIZACION_FACTOR', asOfDate, tenantId)
      : Promise.resolve(undefined);

    const [contracts, smlv, postReformFactor] = await Promise.all([
      contractsPromise,
      smlvPromise,
      postReformFactorPromise,
    ]);

    let eligibleWorkers = 0;
    let activeApprentices = 0;
    for (const contract of contracts) {
      if (isSenaQuotaEligibleContractType(contract.contractType)) {
        eligibleWorkers += 1;
      } else if (isSenaApprenticeContractType(contract.contractType)) {
        activeApprentices += 1;
      }
    }

    const computed = computeSenaQuotaFromCounts({
      eligibleWorkers,
      activeApprentices,
      smlv,
      asOfDate,
      postReformFactor,
    });

    return {
      period,
      ...computed,
    };
  }

  private parsePeriod(period: string): { year: number; month: number } {
    const match = /^(\d{4})-(\d{2})$/.exec(period);
    if (!match) {
      throw new BadRequestException(`Invalid period "${period}". Expected YYYY-MM.`);
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month < 1 || month > 12) {
      throw new BadRequestException(`Invalid period "${period}". Month must be 01–12.`);
    }
    return { year, month };
  }

  /** Cierre del mes en UTC (mismo convenio que reports.service `lastDayOfMonth`). */
  private lastDayOfMonth(year: number, month: number): Date {
    return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  }
}
