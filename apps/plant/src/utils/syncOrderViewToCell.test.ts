import { describe, expect, it } from 'vitest';

import type { OrderRecipeViewResponse } from '@/api/operator-order.api';

import { resolveOrderStepId } from './syncOrderViewToCell';

function buildView(overrides: Partial<OrderRecipeViewResponse> = {}): OrderRecipeViewResponse {
  return {
    orderId: 'order-1',
    productName: 'Product',
    recipeName: 'Recipe',
    batchSize: '10 unidades',
    stationId: 'ws-1',
    stationName: 'Parrilla',
    currentPhaseIndex: 2,
    status: 'in_progress',
    phases: [
      {
        id: 'recipe-phase-1',
        executionId: 'exec-1',
        index: 1,
        name: 'Fase 1',
        durationMinutes: 5,
        ingredients: [],
        status: 'completed',
      },
      {
        id: 'recipe-phase-2',
        executionId: 'exec-2',
        index: 2,
        name: 'Fase 2',
        durationMinutes: 10,
        ingredients: [],
        status: 'current',
      },
    ],
    ...overrides,
  };
}

describe('resolveOrderStepId', () => {
  it('prefers currentStepId from the recipe view', () => {
    expect(resolveOrderStepId(buildView({ currentStepId: 'exec-active' }))).toBe('exec-active');
  });

  it('uses executionId from the current phase, not recipe phase id', () => {
    const view = buildView({
      currentStepId: undefined,
      phases: [
        {
          id: 'cmr0wrek4000qnve56xoc4vz3',
          index: 1,
          name: 'Fase sin ejecución',
          durationMinutes: 5,
          ingredients: [],
          status: 'current',
        },
      ],
    });

    expect(resolveOrderStepId(view)).toBeUndefined();
  });

  it('falls back to executionId on the phase at currentPhaseIndex', () => {
    const view = buildView({
      currentStepId: undefined,
      currentPhaseIndex: 2,
      phases: [
        {
          id: 'recipe-phase-1',
          executionId: 'exec-1',
          index: 1,
          name: 'Fase 1',
          durationMinutes: 5,
          ingredients: [],
          status: 'completed',
        },
        {
          id: 'recipe-phase-2',
          executionId: 'exec-2',
          index: 2,
          name: 'Fase 2',
          durationMinutes: 10,
          ingredients: [],
          status: 'pending',
        },
      ],
    });

    expect(resolveOrderStepId(view)).toBe('exec-2');
  });
});
