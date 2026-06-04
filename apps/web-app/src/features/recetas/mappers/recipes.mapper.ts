import type { PlantProductionOrder, PlantProductionRecipe, PlantRecipeCategory } from '@/api/plant';
import type { ProcessRow, ProcessViewData, RecipeListItem, RecetaResult } from '../types';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatRecipeCode(recipe: PlantProductionRecipe): string {
  return `RC-${String(recipe.version).padStart(3, '0')}`;
}

export function formatCategoryCode(category: PlantRecipeCategory, index: number): string {
  const suffix = category.id.replace(/-/g, '').slice(-6).toUpperCase();
  if (suffix.length >= 4) {
    return `CAT-${suffix}`;
  }
  return `CAT-${String(index + 1).padStart(3, '0')}`;
}

export function mapPlantRecipeToListItem(
  recipe: PlantProductionRecipe,
  phaseCount = 0,
): RecipeListItem {
  return {
    id: recipe.id,
    code: formatRecipeCode(recipe),
    name: recipe.name,
    category: recipe.category?.nombre ?? 'Sin categoría',
    durationMin: recipe.estimatedMinutes,
    phases: phaseCount,
    status: recipe.isActive ? 'active' : 'inactive',
  };
}

function orderToProcessResult(order?: PlantProductionOrder): RecetaResult {
  if (!order) {
    return 'warning';
  }
  if (order.status === 'CANCELLED') {
    return 'failed';
  }
  if (order.status === 'COMPLETED') {
    return 'ok';
  }
  return 'warning';
}

function processStatusLabel(result: RecetaResult, order?: PlantProductionOrder): string {
  if (result === 'failed') {
    return 'Falla';
  }
  if (result === 'ok') {
    return 'Validado';
  }
  if (order?.status === 'IN_PROCESS') {
    return 'En proceso';
  }
  return 'Pendiente';
}

export function buildProcessViewData(
  recipes: PlantProductionRecipe[],
  orders: PlantProductionOrder[],
  phaseCounts: Map<string, number>,
): ProcessViewData {
  const latestByRecipe = new Map<string, PlantProductionOrder>();
  for (const order of orders) {
    if (!latestByRecipe.has(order.recipeId)) {
      latestByRecipe.set(order.recipeId, order);
    }
  }

  const rows: ProcessRow[] = recipes.map((recipe) => {
    const order = latestByRecipe.get(recipe.id);
    const result = orderToProcessResult(order);
    const health = result === 'ok' ? 95 : result === 'failed' ? 60 : 80;
    return {
      recipeId: recipe.id,
      code: formatRecipeCode(recipe),
      name: recipe.name,
      category: recipe.category?.nombre ?? 'Sin categoría',
      phases: phaseCounts.get(recipe.id) ?? 0,
      duration: `${recipe.estimatedMinutes} min`,
      status: processStatusLabel(result, order),
      result,
      health,
      lastValidation: order ? DATE_FORMATTER.format(new Date(order.plannedStartAt)) : '—',
    };
  });

  return {
    rows,
    stats: {
      total: rows.length,
      validated: rows.filter((row) => row.result === 'ok').length,
      inProgress: rows.filter((row) => row.result === 'warning').length,
      failed: rows.filter((row) => row.result === 'failed').length,
      health: rows.length
        ? Math.round(rows.reduce((sum, row) => sum + row.health, 0) / rows.length)
        : 0,
    },
  };
}
