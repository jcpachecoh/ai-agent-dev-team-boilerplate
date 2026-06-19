import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useOrderRecipe } from './useOrderRecipe';

vi.mock('@/api/operator-order.api', () => ({
  fetchOrderRecipeView: vi.fn(),
}));

import { fetchOrderRecipeView } from '@/api/operator-order.api';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useOrderRecipe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and maps recipe view for an order', async () => {
    vi.mocked(fetchOrderRecipeView).mockResolvedValue({
      orderId: 'order-1',
      productName: 'Pollo',
      recipeName: 'Receta Pollo',
      batchSize: '10 unidades',
      stationId: 'ws-1',
      stationName: 'Parrilla',
      currentPhaseIndex: 1,
      currentStepId: 'exec-1',
      status: 'pending',
      phases: [
        {
          id: 'exec-1',
          index: 1,
          name: 'Mezclado',
          durationMinutes: 5,
          ingredients: [],
          status: 'current',
        },
      ],
    });

    const { result } = renderHook(() => useOrderRecipe('order-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.recipe?.recipeName).toBe('Receta Pollo');
    expect(result.current.status).toBe('pending');
    expect(result.current.currentStepId).toBe('exec-1');
  });
});
