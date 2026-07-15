import { describe, expect, it } from 'vitest';

import {
  finalSettlementTerminationSchema,
  legalFormulaValidationSchema,
  manualSettlementFormSchema,
  markFinalSettlementPaidSchema,
  pendingSalaryReconciliationSchema,
  voidFinalSettlementSchema,
} from './final-settlement.schema';

describe('finalSettlementTerminationSchema', () => {
  it('acepta una terminación sin días restantes estimados', () => {
    const result = finalSettlementTerminationSchema.safeParse({
      effectiveTerminationDate: '2026-07-14',
      terminationReason: 'RENUNCIA',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza una causal fuera del enum de ContractTerminationReason', () => {
    const result = finalSettlementTerminationSchema.safeParse({
      effectiveTerminationDate: '2026-07-14',
      terminationReason: 'NO_EXISTE',
    });
    expect(result.success).toBe(false);
  });

  it('exige justificación cuando se estiman días restantes (OBRA/LABOR)', () => {
    const result = finalSettlementTerminationSchema.safeParse({
      effectiveTerminationDate: '2026-07-14',
      terminationReason: 'VENCIMIENTO_TERMINO',
      estimatedRemainingDays: '10',
      estimatedRemainingDaysJustification: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['estimatedRemainingDaysJustification']);
    }
  });

  it('acepta días restantes estimados con justificación', () => {
    const result = finalSettlementTerminationSchema.safeParse({
      effectiveTerminationDate: '2026-07-14',
      terminationReason: 'VENCIMIENTO_TERMINO',
      estimatedRemainingDays: '10',
      estimatedRemainingDaysJustification: 'Obra pendiente de entrega según cronograma',
    });
    expect(result.success).toBe(true);
  });
});

describe('manualSettlementFormSchema', () => {
  const validLine = {
    code: 'AJUSTE_MANUAL',
    name: 'Ajuste manual',
    type: 'DEVENGO' as const,
    amount: '1000000',
    manualJustification: 'Acuerdo documentado',
  };

  it('acepta una liquidación manual válida', () => {
    const result = manualSettlementFormSchema.safeParse({
      lines: [validLine],
      manualJustification: 'Liquidación por acuerdo',
      manualReference: 'DOC-001',
      manualResponsible: 'Juan Pérez',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza cuando no hay líneas', () => {
    const result = manualSettlementFormSchema.safeParse({
      lines: [],
      manualJustification: 'Liquidación por acuerdo',
      manualReference: 'DOC-001',
      manualResponsible: 'Juan Pérez',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una línea sin justificación (todas las líneas manuales son auditables)', () => {
    const result = manualSettlementFormSchema.safeParse({
      lines: [{ ...validLine, manualJustification: '' }],
      manualJustification: 'Liquidación por acuerdo',
      manualReference: 'DOC-001',
      manualResponsible: 'Juan Pérez',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza un monto no numérico', () => {
    const result = manualSettlementFormSchema.safeParse({
      lines: [{ ...validLine, amount: 'no-es-un-numero' }],
      manualJustification: 'Liquidación por acuerdo',
      manualReference: 'DOC-001',
      manualResponsible: 'Juan Pérez',
    });
    expect(result.success).toBe(false);
  });
});

describe('pendingSalaryReconciliationSchema', () => {
  it('acepta una reconciliación válida sin referencia/fecha de pago (opcionales)', () => {
    const result = pendingSalaryReconciliationSchema.safeParse({
      previouslyPaidAmount: '500000',
      recognizedBalance: '200000',
      responsible: 'Ana Gómez',
      observation: 'Revisión de pagos previos vs SAL_PENDIENTE',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza montos negativos', () => {
    const result = pendingSalaryReconciliationSchema.safeParse({
      previouslyPaidAmount: '-1',
      recognizedBalance: '200000',
      responsible: 'Ana Gómez',
      observation: 'Revisión de pagos previos',
    });
    expect(result.success).toBe(false);
  });
});

describe('legalFormulaValidationSchema', () => {
  it('exige referencia legal', () => {
    const result = legalFormulaValidationSchema.safeParse({ legalReference: '' });
    expect(result.success).toBe(false);
  });

  it('acepta observaciones opcionales', () => {
    const result = legalFormulaValidationSchema.safeParse({
      legalReference: 'Concepto jurídico 2026-014',
    });
    expect(result.success).toBe(true);
  });
});

describe('markFinalSettlementPaidSchema', () => {
  it('exige referencia y fecha de pago', () => {
    const result = markFinalSettlementPaidSchema.safeParse({
      paymentReference: '',
      paymentDate: '',
    });
    expect(result.success).toBe(false);
  });

  it('acepta referencia y fecha válidas', () => {
    const result = markFinalSettlementPaidSchema.safeParse({
      paymentReference: 'TRF-001',
      paymentDate: '2026-07-14',
    });
    expect(result.success).toBe(true);
  });
});

describe('voidFinalSettlementSchema', () => {
  it('exige un motivo de al menos 3 caracteres', () => {
    expect(voidFinalSettlementSchema.safeParse({ voidReason: 'ok' }).success).toBe(false);
    expect(voidFinalSettlementSchema.safeParse({ voidReason: 'Error en el cálculo' }).success).toBe(
      true,
    );
  });
});
