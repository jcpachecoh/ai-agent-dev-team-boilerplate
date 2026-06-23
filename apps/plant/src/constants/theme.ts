export type PlantUiTheme = 'light' | 'dark';

export const PLANT_THEME_STORAGE_KEY = 'restopsiq.plant.theme';

export function resolvePlantUiTheme(saved: string | null): PlantUiTheme | null {
  if (saved === 'light' || saved === 'dark') return saved;
  return null;
}

export function getInitialPlantTheme(): PlantUiTheme {
  try {
    const saved = resolvePlantUiTheme(localStorage.getItem(PLANT_THEME_STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // localStorage may be unavailable
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

export function applyPlantDocumentTheme(theme: PlantUiTheme): void {
  document.documentElement.dataset.theme = theme;
}

export function toFieldOpsTheme(theme: PlantUiTheme): 'light' | 'dark' {
  return theme;
}
