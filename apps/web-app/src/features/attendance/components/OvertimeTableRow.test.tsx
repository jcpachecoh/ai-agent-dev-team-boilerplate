import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OvertimeRequestItem } from '../types/overtime.types';
import { OvertimeTableRow } from './OvertimeTableRow';

const detectionItem: OvertimeRequestItem = {
  id: 'req-auto',
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

const adminItem: OvertimeRequestItem = {
  id: 'req-admin',
  employeeId: 'emp-2',
  employeeName: 'Luis',
  locationId: 'loc-1',
  locationName: 'PL-01',
  type: 'SOLICITUD_ADMINISTRATIVA',
  accumulatedMinutes: null,
  shiftEndTime: null,
  actualEndTime: null,
  proposedMinutes: 90,
  workDate: '2026-07-16',
  proposedStartTime: '2026-07-16T22:00:00.000-05:00',
  proposedEndTime: '2026-07-16T23:30:00.000-05:00',
  status: 'PENDIENTE_GERENCIA_OPERACIONES',
  payrollPeriod: '2026-07',
  createdAt: '2026-07-16T10:00:00.000Z',
  updatedAt: '2026-07-16T10:00:00.000Z',
};

describe('OvertimeTableRow', () => {
  it('muestra origen y ventana administrativa', () => {
    render(
      <OvertimeTableRow
        item={adminItem}
        theme="light"
        showActions={false}
        onApprove={vi.fn()}
        onObject={vi.fn()}
      />,
    );

    expect(screen.getByText('Solicitud administrativa')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText(/16\/07\/2026/)).toBeInTheDocument();
  });

  it('conserva presentación de detección automática', () => {
    render(
      <OvertimeTableRow
        item={detectionItem}
        theme="light"
        showActions={false}
        onApprove={vi.fn()}
        onObject={vi.fn()}
      />,
    );

    expect(screen.getByText('Detección automática')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });
});
