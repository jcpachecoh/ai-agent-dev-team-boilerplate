import { plantFetch } from './client';
import type {
  CreatePlantRecipeInput,
  CreatePlantRecipePhaseInput,
  PlantProductionOrder,
  PlantProductionPhase,
  PlantProductionRecipe,
  PlantRecipeCategory,
  PlantRecipeDetail,
  PlantRecipeStatusHistoryEntry,
  PlantWorkStation,
  UpdatePlantRecipePhaseInput,
} from './types';

export async function getRecipeCategories(isActive?: boolean): Promise<PlantRecipeCategory[]> {
  const query = isActive === undefined ? '' : `?isActive=${isActive}`;
  return plantFetch<PlantRecipeCategory[]>(`/recipe-categories${query}`);
}

export type CreateRecipeCategoryInput = {
  nombre: string;
  descripcion?: string;
};

export type UpdateRecipeCategoryInput = {
  nombre?: string;
  descripcion?: string;
  isActive?: boolean;
};

export async function createRecipeCategory(
  input: CreateRecipeCategoryInput,
): Promise<PlantRecipeCategory> {
  return plantFetch<PlantRecipeCategory>('/recipe-categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateRecipeCategory(
  id: string,
  input: UpdateRecipeCategoryInput,
): Promise<PlantRecipeCategory> {
  return plantFetch<PlantRecipeCategory>(`/recipe-categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteRecipeCategory(id: string): Promise<void> {
  return plantFetch<void>(`/recipe-categories/${id}`, { method: 'DELETE' });
}

export async function getPlantRecipes(): Promise<PlantProductionRecipe[]> {
  return plantFetch<PlantProductionRecipe[]>('/plant/recipes');
}

export async function getPlantRecipeDetail(id: string): Promise<PlantRecipeDetail> {
  return plantFetch<PlantRecipeDetail>(`/plant/recipes/${id}`);
}

export async function getPlantOrders(): Promise<PlantProductionOrder[]> {
  return plantFetch<PlantProductionOrder[]>('/plant/orders');
}

export async function getPlantWorkstations(): Promise<PlantWorkStation[]> {
  return plantFetch<PlantWorkStation[]>('/plant/workstations');
}

export type CreatePlantWorkstationInput = {
  name: string;
  code: string;
  description?: string;
  location?: string;
};

export async function createPlantWorkstation(
  input: CreatePlantWorkstationInput,
): Promise<PlantWorkStation> {
  return plantFetch<PlantWorkStation>('/plant/workstations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type UpdatePlantWorkstationInput = {
  name?: string;
  code?: string;
  description?: string;
  location?: string;
  isActive?: boolean;
};

export async function updatePlantWorkstation(
  id: string,
  input: UpdatePlantWorkstationInput,
): Promise<PlantWorkStation> {
  return plantFetch<PlantWorkStation>(`/plant/workstations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function previewNextRecipeCode(categoryId: string): Promise<{ code: string }> {
  const query = new URLSearchParams({ categoryId });
  return plantFetch<{ code: string }>(`/plant/recipes/next-code?${query.toString()}`);
}

export async function approvePlantRecipe(id: string): Promise<PlantProductionRecipe> {
  return plantFetch<PlantProductionRecipe>(`/plant/recipes/${id}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectPlantRecipe(
  id: string,
  reason: string,
): Promise<PlantProductionRecipe> {
  return plantFetch<PlantProductionRecipe>(`/plant/recipes/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function getRecipeStatusHistory(
  recipeId: string,
): Promise<PlantRecipeStatusHistoryEntry[]> {
  return plantFetch<PlantRecipeStatusHistoryEntry[]>(`/plant/recipes/${recipeId}/status-history`);
}

export async function createPlantRecipe(
  input: CreatePlantRecipeInput,
): Promise<PlantProductionRecipe> {
  return plantFetch<PlantProductionRecipe>('/plant/recipes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updatePlantRecipe(
  id: string,
  input: Partial<
    Pick<
      CreatePlantRecipeInput,
      | 'name'
      | 'categoryId'
      | 'recipeType'
      | 'finishedProductId'
      | 'batchSize'
      | 'batchUnit'
      | 'batchDisplayUnit'
      | 'packageWeight'
      | 'packageWeightGrams'
      | 'expectedYield'
      | 'expectedYieldUnit'
      | 'estimatedMinutes'
      | 'operationCenter'
      | 'locationIds'
      | 'technicalResponsible'
      | 'allergens'
      | 'notes'
      | 'isActive'
      | 'isDraft'
      | 'composition'
    >
  >,
): Promise<PlantProductionRecipe> {
  return plantFetch<PlantProductionRecipe>(`/plant/recipes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function createPlantRecipePhase(
  recipeId: string,
  input: CreatePlantRecipePhaseInput,
): Promise<PlantProductionPhase> {
  return plantFetch<PlantProductionPhase>(`/plant/recipes/${recipeId}/phases`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updatePlantRecipePhase(
  phaseId: string,
  input: UpdatePlantRecipePhaseInput,
): Promise<PlantProductionPhase> {
  return plantFetch<PlantProductionPhase>(`/plant/phases/${phaseId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deletePlantRecipePhase(phaseId: string): Promise<void> {
  return plantFetch<void>(`/plant/phases/${phaseId}`, {
    method: 'DELETE',
  });
}

export async function reorderPlantRecipePhases(
  recipeId: string,
  items: Array<{ phaseId: string; newOrder: number }>,
): Promise<void> {
  return plantFetch<void>(`/plant/recipes/${recipeId}/phases/reorder`, {
    method: 'PATCH',
    body: JSON.stringify(items),
  });
}

export async function loadRecipePhaseCounts(
  recipes: PlantProductionRecipe[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await Promise.all(
    recipes.map(async (recipe) => {
      try {
        const detail = await getPlantRecipeDetail(recipe.id);
        counts.set(recipe.id, detail.phases.length);
      } catch {
        counts.set(recipe.id, 0);
      }
    }),
  );
  return counts;
}

function isDraftPhaseId(id: string): boolean {
  return /^p\d+$/.test(id);
}

export type SyncPlantRecipePhaseInput = {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  workStationId: string;
  validations: Array<{ label: string }>;
  ingredients: Array<{
    supplyItemId: string;
    quantityPerBatch: string;
    unit: string;
  }>;
};

export async function syncPlantRecipePhases(
  recipeId: string,
  phases: SyncPlantRecipePhaseInput[],
  originalPhaseIds: string[],
): Promise<void> {
  const persistedIds = new Set(
    phases.filter((phase) => !isDraftPhaseId(phase.id)).map((phase) => phase.id),
  );

  for (const phaseId of originalPhaseIds) {
    if (!persistedIds.has(phaseId)) {
      await deletePlantRecipePhase(phaseId);
    }
  }

  const phaseIdByOrder: string[] = [];

  for (let index = 0; index < phases.length; index++) {
    const phase = phases[index];
    const order = index + 1;
    const payload = {
      order,
      name: phase.title.trim() || `Fase ${order}`,
      description: phase.description.trim() || undefined,
      workStationId: phase.workStationId,
      standardMinutes: Math.max(1, phase.durationMin),
      requiresQA: phase.validations.length > 0,
      inputs: phase.ingredients
        .filter((ingredient) => ingredient.supplyItemId)
        .map((ingredient) => ({
          supplyItemId: ingredient.supplyItemId,
          quantityPerBatch: ingredient.quantityPerBatch.replace(',', '.'),
          unit: ingredient.unit,
        })),
    };

    if (isDraftPhaseId(phase.id)) {
      const created = await createPlantRecipePhase(recipeId, payload);
      phaseIdByOrder.push(created.id);
    } else {
      await updatePlantRecipePhase(phase.id, payload);
      phaseIdByOrder.push(phase.id);
    }
  }

  if (phaseIdByOrder.length > 0) {
    await reorderPlantRecipePhases(
      recipeId,
      phaseIdByOrder.map((phaseId, index) => ({ phaseId, newOrder: index + 1 })),
    );
  }
}
