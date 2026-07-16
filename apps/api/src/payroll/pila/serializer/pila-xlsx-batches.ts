import type { PilaCotizanteDraft, PilaPeriodDraft } from '../pila-preparation.interfaces';
import { PILA_XLSX_MAX_EMPLOYEES } from './pila-xlsx-catalog.maps';

export type PilaXlsxBatchDraft = {
  batchIndex: number;
  batchTotal: number;
  draft: PilaPeriodDraft;
};

/**
 * Parte cotizantes en lotes de ≤20 (límite de filas de la plantilla Aportes en Línea).
 * Cada lote es un draft completo del mismo aportante con subset de cotizantes.
 */
export function splitDraftIntoXlsxBatches(
  draft: PilaPeriodDraft,
  maxPerBatch: number = PILA_XLSX_MAX_EMPLOYEES,
): PilaXlsxBatchDraft[] {
  if (maxPerBatch < 1) {
    throw new Error('maxPerBatch must be >= 1');
  }
  const cotizantes = draft.cotizantes;
  if (cotizantes.length === 0) {
    return [{ batchIndex: 1, batchTotal: 1, draft }];
  }

  const batchTotal = Math.ceil(cotizantes.length / maxPerBatch);
  const batches: PilaXlsxBatchDraft[] = [];

  for (let i = 0; i < batchTotal; i++) {
    const slice = cotizantes.slice(i * maxPerBatch, (i + 1) * maxPerBatch);
    batches.push({
      batchIndex: i + 1,
      batchTotal,
      draft: {
        ...draft,
        cotizantes: slice,
        totals: totalsForSlice(slice),
      },
    });
  }

  return batches;
}

function totalsForSlice(slice: PilaCotizanteDraft[]): PilaPeriodDraft['totals'] {
  let totalEmployeeContributions = 0;
  let totalEmployerContributions = 0;
  let totalPayrollCost = 0;
  for (const c of slice) {
    const employee = c.contributions.employeeHealth + c.contributions.employeePension;
    const employer =
      c.contributions.employerHealth +
      c.contributions.employerPension +
      c.contributions.employerArl +
      c.contributions.employerSena +
      c.contributions.employerIcbf +
      c.contributions.employerCaja;
    totalEmployeeContributions += employee;
    totalEmployerContributions += employer;
    // Proxy de costo nómina del lote (IBC + aportes empleador); el export persiste totales del período.
    totalPayrollCost += c.contributionBase + employer;
  }
  return {
    employeeCount: slice.length,
    totalPayrollCost,
    totalEmployeeContributions,
    totalEmployerContributions,
  };
}
