export type UiTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'restopsiq.web-app.theme';

export function resolveUiTheme(saved: string | null): UiTheme | null {
  if (saved === 'light' || saved === 'dark') return saved;
  return null;
}

export function getInitialTheme(): UiTheme {
  try {
    const saved = resolveUiTheme(localStorage.getItem(THEME_STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // localStorage may be unavailable
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

export function applyDocumentTheme(theme: UiTheme): void {
  document.documentElement.dataset.theme = theme;
}
