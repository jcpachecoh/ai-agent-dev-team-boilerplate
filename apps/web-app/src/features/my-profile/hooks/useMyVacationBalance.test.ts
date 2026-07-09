import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TestQueryProvider } from '@/test-utils/query-client';

import { useMyVacationBalance } from './useMyEmployee';

vi.mock('@/features/payroll/api/vacations.client', () => ({
  getMyVacationBalance: vi.fn().mockResolvedValue({
    id: 'bal-1',
    employeeId: 'emp-1',
    accruedDays: 15,
    takenDays: 5,
    compensatedDays: 0,
    availableDays: 10,
    lastAccrualDate: '2026-06-01T00:00:00.000Z',
  }),
}));

describe('useMyVacationBalance', () => {
  it('carga saldo cuando hay employeeId', async () => {
    const { result } = renderHook(() => useMyVacationBalance('emp-1'), {
      wrapper: TestQueryProvider,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.availableDays).toBe(10);
  });
});
