import { describe, expect, it } from 'vitest';

import type { OrderRecipeViewResponse } from '@/api/operator-order.api';
import {
  mapOrderRecipeViewToPlantRecipe,
  mapOrderStatusToWorkstationStatus,
} from '@/utils/mapOrderRecipeView';

const sampleView: OrderRecipeViewResponse = {
  orderId: 'order-1',
  productName: 'Pollo',
  recipeName: 'Receta Pollo',
  batchSize: '10 unidades',
  stationId: 'ws-1',
  stationName: 'Parrilla',
  currentPhaseIndex: 2,
  status: 'in_progress',
  elapsedSeconds: 120,
  phases: [
    {
      id: 'exec-1',
      index: 1,
      name: 'Mezclado',
      durationMinutes: 5,
      ingredients: [
        {
          id: 'ing-1',
          name: 'Sal',
          quantity: '20 g',
          unit: 'GRAMS',
          stockWarning: false,
        },
      ],
      status: 'completed',
    },
    {
      id: 'exec-2',
      index: 2,
      name: 'Cocción',
      durationMinutes: 10,
      ingredients: [
        {
          id: 'ing-2',
          name: 'Aceite',
          quantity: '1 L',
          unit: 'LITERS',
          supplier: 'Proveedor A',
          stockWarning: true,
        },
      ],
      status: 'current',
    },
  ],
};

describe('mapOrderRecipeView', () => {
  it('maps API status to workstation status', () => {
    expect(mapOrderStatusToWorkstationStatus('pending')).toBe('pending');
    expect(mapOrderStatusToWorkstationStatus('in_progress')).toBe('in_progress');
    expect(mapOrderStatusToWorkstationStatus('paused')).toBe('paused');
    expect(mapOrderStatusToWorkstationStatus('completed')).toBe('completed');
  });

  it('maps recipe view into PlantRecipeDetail shape', () => {
    const recipe = mapOrderRecipeViewToPlantRecipe(sampleView);

    expect(recipe.recipeName).toBe('Receta Pollo');
    expect(recipe.stationName).toBe('Parrilla');
    expect(recipe.phases).toHaveLength(2);
    expect(recipe.phases[1]?.stockIssue).toBe(true);
    expect(recipe.phases[1]?.ingredients[0]?.supplier).toBe('Proveedor A');
  });
});
