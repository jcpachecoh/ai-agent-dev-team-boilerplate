import type { ChartTheme } from './types';

export interface ChartThemeConfig {
  axis: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  legendText: string;
  referenceLine: string;
}

const lightTheme: ChartThemeConfig = {
  axis: '#6c757d',
  grid: 'rgba(0, 0, 0, 0.08)',
  tooltipBg: '#ffffff',
  tooltipBorder: 'rgba(0, 0, 0, 0.12)',
  tooltipText: '#212529',
  legendText: '#495057',
  referenceLine: '#d4a017',
};

const darkTheme: ChartThemeConfig = {
  axis: 'rgba(255, 255, 255, 0.55)',
  grid: 'rgba(255, 255, 255, 0.1)',
  tooltipBg: '#343a40',
  tooltipBorder: 'rgba(255, 255, 255, 0.14)',
  tooltipText: '#ffffff',
  legendText: 'rgba(255, 255, 255, 0.85)',
  referenceLine: '#d4a017',
};

export function getChartTheme(theme: ChartTheme = 'light'): ChartThemeConfig {
  return theme === 'dark' ? darkTheme : lightTheme;
}
