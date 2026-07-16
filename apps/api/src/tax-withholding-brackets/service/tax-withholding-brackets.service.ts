import { Injectable } from '@nestjs/common';

import { TaxWithholdingBracketSnapshot } from './tax-withholding-bracket-snapshot';
import { GLOBAL_TENANT_SCOPE } from '../../labor-legal-parameters/labor-legal-parameters.constants';
import type { ITaxWithholdingBracketsService } from '../interfaces/tax-withholding-brackets.interfaces';
import { TaxWithholdingBracketsRepository } from '../repository/tax-withholding-brackets.repository';

@Injectable()
export class TaxWithholdingBracketsService implements ITaxWithholdingBracketsService {
  constructor(private readonly repository: TaxWithholdingBracketsRepository) {}

  /**
   * Precarga filas que solapan [from, to] para tenant + global en una sola consulta.
   * El motor de nómina consume TaxWithholdingBracketSnapshot.bracketsAt(date) — sin Prisma.
   */
  async preload(
    from: Date,
    to: Date | null,
    tenantId?: string | null,
  ): Promise<TaxWithholdingBracketSnapshot> {
    const scopes = tenantId ? [tenantId, GLOBAL_TENANT_SCOPE] : [GLOBAL_TENANT_SCOPE];
    const rows = await this.repository.findRowsForRange(scopes, from, to);
    return new TaxWithholdingBracketSnapshot(rows, tenantId ?? null);
  }
}
