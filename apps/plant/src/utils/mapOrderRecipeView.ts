import type { PlantRecipeDetail } from '@restopsiq/ui';

import type { OrderRecipeViewResponse } from '@/api/operator-order.api';

export function mapOrderStatusToWorkstationStatus(
  status: OrderRecipeViewResponse['status'],
): 'pending' | 'in_progress' | 'paused' | 'completed' {
  if (status === 'completed') return 'completed';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'paused') return 'paused';
  return 'pending';
}

export function mapOrderRecipeViewToPlantRecipe(view: OrderRecipeViewResponse): PlantRecipeDetail {
  return {
    recipeName: view.recipeName,
    batchSize: view.batchSize,
    stationId: view.stationId,
    stationName: view.stationName,
    phases: view.phases.map((phase) => ({
      id: phase.id,
      index: phase.index,
      name: phase.name,
      durationMinutes: phase.durationMinutes,
      instruction: phase.instruction,
      stockIssue: phase.ingredients.some((item) => item.stockWarning),
      ingredients: phase.ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
        supplier: ingredient.supplier,
        stockWarning: ingredient.stockWarning,
      })),
    })),
  };
}
