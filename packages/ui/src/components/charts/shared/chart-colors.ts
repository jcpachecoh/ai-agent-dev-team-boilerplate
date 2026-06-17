/**
 * Series palette aligned with styles/abstracts/_variables.scss tokens.
 * Single source for Recharts (TS cannot import SCSS variables at runtime).
 */
export const CHART_COLOR_TOKENS = {
  primary: '#0057ff',
  secondary: '#6c63ff',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
  gold: '#d4a017',
} as const;

export const CHART_SERIES_PALETTE: string[] = [
  CHART_COLOR_TOKENS.gold,
  CHART_COLOR_TOKENS.primary,
  CHART_COLOR_TOKENS.info,
  CHART_COLOR_TOKENS.success,
  CHART_COLOR_TOKENS.secondary,
  CHART_COLOR_TOKENS.warning,
  CHART_COLOR_TOKENS.danger,
];

export function getSeriesColor(index: number): string {
  return CHART_SERIES_PALETTE[index % CHART_SERIES_PALETTE.length];
}
