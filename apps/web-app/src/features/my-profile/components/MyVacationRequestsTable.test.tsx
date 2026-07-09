import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MyVacationRequestsTable } from './MyVacationRequestsTable';

vi.mock('../hooks/useVacationMutations', () => ({
  useVacationApprovalMutations: () => ({
    letterUrl: { mutateAsync: vi.fn() },
  }),
}));

describe('MyVacationRequestsTable', () => {
  it('muestra estados y acción de carta en solicitudes terminales', () => {
    render(
      <MyVacationRequestsTable
        requests={[
          {
            id: 'req-1',
            employeeId: 'emp-1',
            startDate: '2026-07-01T00:00:00.000Z',
            endDate: '2026-07-10T00:00:00.000Z',
            daysRequested: 10,
            type: 'DISFRUTE',
            status: 'APROBADA',
            level1ApprovedBy: null,
            level1ActedAt: null,
            level2ApprovedBy: null,
            level2ActedAt: null,
            rejectionReason: null,
            letterStorageObjectId: 'storage-1',
            createdAt: '2026-06-01T00:00:00.000Z',
            updatedAt: '2026-06-02T00:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getByText('Aprobada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descargar carta' })).toBeInTheDocument();
  });
});
