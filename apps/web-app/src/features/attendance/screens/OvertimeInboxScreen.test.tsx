import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OvertimeInboxScreen } from './OvertimeInboxScreen';

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/features/auth/hooks/useMe', () => ({
  useMe: () => ({ data: { id: 'user-1', roleCode: 'NOMINA' } }),
}));

vi.mock('../hooks/useOvertimeRequests', () => ({
  useOvertimeRequestsQuery: () => ({
    isLoading: false,
    isError: false,
    data: { items: [], pageInfo: { hasNextPage: false, endCursor: null } },
  }),
  useOvertimePeriodSummaryQuery: () => ({
    data: { payrollPeriod: '2026-07', pendingCount: 0, approvedCount: 0, objectedCount: 0 },
  }),
  useApproveOvertimeMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useObjectOvertimeMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../hooks/usePayrollEmployeeQuery', () => ({
  usePayrollEmployeeQuery: () => ({ data: { positionId: null } }),
}));

describe('OvertimeInboxScreen', () => {
  it('renderiza estado vacío', () => {
    const client = new QueryClient();

    render(
      <QueryClientProvider client={client}>
        <OvertimeInboxScreen />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Tiempo extra')).toBeInTheDocument();
    expect(screen.getByText('No hay solicitudes para este período.')).toBeInTheDocument();
    expect(screen.getByText('Período de nómina')).toBeInTheDocument();
  });
});
