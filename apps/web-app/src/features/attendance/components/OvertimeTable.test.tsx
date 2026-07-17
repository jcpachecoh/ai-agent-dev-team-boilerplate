import { describe, expect, it } from 'vitest';

import { canApproveOvertimeRequest } from '../components/OvertimeTable';
import type { OvertimeRequestItem } from '../types/overtime.types';

const baseItem: OvertimeRequestItem = {
  id: 'req-1',
  employeeId: 'emp-1',
  employeeName: 'Ana',
  locationId: 'loc-1',
  locationName: 'PL-01',
  type: 'DETECCION_AUTOMATICA',
  accumulatedMinutes: 45,
  shiftEndTime: '2026-07-10T22:00:00.000Z',
  actualEndTime: '2026-07-10T22:45:00.000Z',
  status: 'PENDIENTE_ADMIN',
  payrollPeriod: '2026-07',
  createdAt: '2026-07-10T22:45:00.000Z',
  updatedAt: '2026-07-10T22:45:00.000Z',
};

describe('canApproveOvertimeRequest', () => {
  it('permite acciones a NOMINA en solicitudes pendientes', () => {
    expect(canApproveOvertimeRequest(baseItem, 'NOMINA', null)).toBe(true);
  });

  it('permite acciones al cargo administrador en PENDIENTE_ADMIN', () => {
    expect(canApproveOvertimeRequest(baseItem, 'MANAGER', 'pos-pdl-001')).toBe(true);
  });

  it('no permite acciones en solicitudes terminales', () => {
    expect(canApproveOvertimeRequest({ ...baseItem, status: 'APROBADA' }, 'NOMINA', null)).toBe(
      false,
    );
  });
});
