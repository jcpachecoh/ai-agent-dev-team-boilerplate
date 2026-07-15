import { describe, expect, it } from 'vitest';

import {
  FINAL_SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_BLOCK_CODES,
  settlementMessageIncludesCode,
} from './final-settlement-display';

describe('final-settlement-display', () => {
  it('tiene una etiqueta para cada estado de FinalSettlementStatus', () => {
    expect(Object.keys(FINAL_SETTLEMENT_STATUS_LABELS)).toEqual([
      'DRAFT',
      'CALCULATED',
      'APPROVED',
      'PAID',
      'VOIDED',
    ]);
  });

  describe('settlementMessageIncludesCode', () => {
    it('detecta el código de bloqueo al inicio del mensaje del backend', () => {
      const message =
        'No se puede aprobar la liquidación: legal_formula_not_validated — la versión de fórmula 3 usada en la indemnización no tiene una validación legal activa';

      expect(
        settlementMessageIncludesCode(message, SETTLEMENT_BLOCK_CODES.legalFormulaNotValidated),
      ).toBe(true);
      expect(
        settlementMessageIncludesCode(message, SETTLEMENT_BLOCK_CODES.pendingSalaryNotReconciled),
      ).toBe(false);
    });

    it('detecta múltiples códigos combinados con " | " (approve() los concatena así)', () => {
      const message =
        'No se puede aprobar la liquidación: legal_formula_not_validated — ... | pending_salary_not_reconciled — existe un tramo de salario pendiente sin reconciliación auditable registrada';

      expect(
        settlementMessageIncludesCode(message, SETTLEMENT_BLOCK_CODES.legalFormulaNotValidated),
      ).toBe(true);
      expect(
        settlementMessageIncludesCode(message, SETTLEMENT_BLOCK_CODES.pendingSalaryNotReconciled),
      ).toBe(true);
      expect(settlementMessageIncludesCode(message, SETTLEMENT_BLOCK_CODES.emptySettlement)).toBe(
        false,
      );
    });

    it('retorna false cuando el mensaje no contiene el código', () => {
      expect(settlementMessageIncludesCode('otro mensaje cualquiera', 'net_negative')).toBe(false);
    });
  });
});
