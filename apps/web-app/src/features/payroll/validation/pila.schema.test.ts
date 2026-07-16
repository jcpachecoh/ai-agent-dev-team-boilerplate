import { describe, expect, it } from 'vitest';

import { markPilaExportPaidSchema, voidPilaExportSchema } from './pila.schema';

describe('pila.schema', () => {
  it('exige planNumber y paidAt para marcar pagado', () => {
    expect(markPilaExportPaidSchema.safeParse({ planNumber: '', paidAt: '' }).success).toBe(false);
    expect(
      markPilaExportPaidSchema.safeParse({
        planNumber: 'PL-1',
        paidAt: '2026-07-15',
        paymentReference: '',
      }).success,
    ).toBe(true);
  });

  it('exige motivo de anulación', () => {
    expect(voidPilaExportSchema.safeParse({ reason: 'ab' }).success).toBe(false);
    expect(voidPilaExportSchema.safeParse({ reason: 'Corrección de datos' }).success).toBe(true);
  });
});
