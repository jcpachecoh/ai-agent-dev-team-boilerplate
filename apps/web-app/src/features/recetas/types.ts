export type RecetaStatus = 'active' | 'inactive';
export type RecetaResult = 'ok' | 'warning' | 'failed';

export interface RecipeListItem {
  id: string;
  code: string;
  name: string;
  category: string;
  durationMin: number;
  phases: number;
  status: RecetaStatus;
}

export interface ProcessRow {
  recipeId: string;
  code: string;
  name: string;
  category: string;
  phases: number;
  duration: string;
  status: string;
  result: RecetaResult;
  health: number;
  lastValidation: string;
}

export interface RecipeCategoryFormValues {
  nombre: string;
  descripcion: string;
  isActive: boolean;
}

export interface ProcessViewData {
  rows: ProcessRow[];
  stats: {
    total: number;
    validated: number;
    inProgress: number;
    failed: number;
    health: number;
  };
}
