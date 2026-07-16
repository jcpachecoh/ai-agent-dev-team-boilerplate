import { describe, expect, it } from 'vitest';

import type { PilaPeriodExport, PilaValidationError } from '../types/pila.types';
import {
  canGeneratePila,
  canMarkPilaPaid,
  canVoidPila,
  derivePilaUiStatus,
  getActivePilaExport,
  groupPilaErrorsByEmployee,
  hasPaidPilaHistory,
} from './pila-display';

function buildExport(overrides: Partial<PilaPeriodExport> = {}): PilaPeriodExport {
  return {
    id: 'exp-1',
    tenantId: 't1',
    periodHealth: '2026-07',
    periodOther: '2026-06',
    format: 'TXT',
    status: 'GENERATED',
    version: 1,
    technicalVersion: 'anexo2-v29',
    fileName: 'pila.txt',
    fileChecksum: 'abc',
    employeeCount: 2,
    totalPayrollAmount: 3_000_000,
    totalContribution: 500_000,
    storageObjectId: 'sto-1',
    generatedAt: '2026-07-15T12:00:00.000Z',
    generatedBy: 'user-1',
    paidAt: null,
    paidConfirmedBy: null,
    planNumber: null,
    paymentReference: null,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    createdAt: '2026-07-15T12:00:00.000Z',
    updatedAt: '2026-07-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('pila-display', () => {
  it('estado pendiente sin exportación activa', () => {
    expect(derivePilaUiStatus({ active: null, validationOk: null })).toBe('PENDING');
    expect(derivePilaUiStatus({ active: null, validationOk: true })).toBe('PENDING');
  });

  it('estado con errores cuando validación falla y no hay export', () => {
    expect(derivePilaUiStatus({ active: null, validationOk: false })).toBe('VALIDATION_FAILED');
  });

  it('prioriza estado backend de la exportación activa', () => {
    expect(
      derivePilaUiStatus({ active: buildExport({ status: 'PAID' }), validationOk: false }),
    ).toBe('PAID');
  });

  it('getActivePilaExport ignora anuladas y filtra por formato', () => {
    const rows = [
      buildExport({ id: 'v1', version: 1, status: 'VOIDED', format: 'TXT' }),
      buildExport({ id: 'v2', version: 2, status: 'GENERATED', format: 'TXT' }),
      buildExport({ id: 'x1', version: 1, status: 'GENERATED', format: 'XLSX' }),
    ];
    expect(getActivePilaExport(rows)?.id).toBe('v2');
    expect(getActivePilaExport(rows, 'TXT')?.id).toBe('v2');
    expect(getActivePilaExport(rows, 'XLSX')?.id).toBe('x1');
  });

  it('agrupa errores por empleado mostrando mensaje, no código', () => {
    const errors: PilaValidationError[] = [
      {
        code: 'EMPLOYEE_EPS_PILA_CODE_MISSING',
        field: 'epsCode',
        message: 'Falta código EPS',
        employeeId: 'e1',
        employeeName: 'Ana Pérez',
      },
      {
        code: 'EMPLOYEE_AFP_PILA_CODE_MISSING',
        field: 'afpCode',
        message: 'Falta código AFP',
        employeeId: 'e1',
        employeeName: 'Ana Pérez',
      },
    ];
    const groups = groupPilaErrorsByEmployee(errors);
    expect(groups).toHaveLength(1);
    expect(groups[0].employeeName).toBe('Ana Pérez');
    expect(groups[0].errors.map((e) => e.message)).toEqual([
      'Falta código EPS',
      'Falta código AFP',
    ]);
  });

  it('permisos de generación / pago / anulación por formato', () => {
    const generated = buildExport({ status: 'GENERATED' });
    const paid = buildExport({ status: 'PAID', paidAt: '2026-07-16T00:00:00.000Z' });

    expect(
      canGeneratePila({
        canWrite: true,
        activeForFormat: null,
        validationOk: true,
        hasPaidHistory: false,
      }),
    ).toBe(true);
    expect(
      canGeneratePila({
        canWrite: false,
        activeForFormat: null,
        validationOk: true,
        hasPaidHistory: false,
      }),
    ).toBe(false);
    expect(
      canGeneratePila({
        canWrite: true,
        activeForFormat: null,
        validationOk: false,
        hasPaidHistory: false,
      }),
    ).toBe(false);
    expect(
      canGeneratePila({
        canWrite: true,
        activeForFormat: null,
        validationOk: true,
        hasPaidHistory: true,
      }),
    ).toBe(false);
    expect(
      canGeneratePila({
        canWrite: true,
        activeForFormat: paid,
        validationOk: true,
        hasPaidHistory: false,
      }),
    ).toBe(false);

    expect(canMarkPilaPaid(true, generated)).toBe(true);
    expect(canMarkPilaPaid(true, paid)).toBe(false);
    expect(canVoidPila(true, paid)).toBe(true);
    expect(canVoidPila(false, generated)).toBe(false);
  });

  it('detecta historial con evidencia de pago', () => {
    expect(hasPaidPilaHistory([buildExport({ paidAt: null })])).toBe(false);
    expect(
      hasPaidPilaHistory([
        buildExport({
          status: 'VOIDED',
          paidAt: '2026-07-16T00:00:00.000Z',
          planNumber: 'PL-1',
        }),
      ]),
    ).toBe(true);
  });
});
