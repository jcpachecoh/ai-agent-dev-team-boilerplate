import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VacationApprovalTable } from './VacationApprovalTable';

vi.mock('@/features/my-profile/hooks/useVacationMutations', () => ({
  useVacationApprovalMutations: () => ({
    approveL1: { mutateAsync: vi.fn() },
    approveL2: { mutateAsync: vi.fn() },
    reject: { mutateAsync: vi.fn() },
    letterUrl: { mutateAsync: vi.fn() },
  }),
}));

describe('VacationApprovalTable', () => {
  it('muestra aprobación de supervisor solo en SOLICITADA', () => {
    render(
      <VacationApprovalTable
        roleCode="SUPERVISOR"
        onReject={vi.fn()}
        requests={[
          {
            id: 'req-1',
            employeeId: 'emp-1',
            employeeName: 'Ana López',
            locationId: 'loc-1',
            locationName: 'Sede Centro',
            startDate: '2026-07-01T00:00:00.000Z',
            endDate: '2026-07-10T00:00:00.000Z',
            daysRequested: 10,
            type: 'DISFRUTE',
            status: 'SOLICITADA',
            level1ApprovedBy: null,
            level1ActedAt: null,
            level2ApprovedBy: null,
            level2ActedAt: null,
            rejectionReason: null,
            letterStorageObjectId: null,
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-01T00:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Aprobar (Supervisor)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprobar (RRHH)' })).not.toBeInTheDocument();
  });
});
