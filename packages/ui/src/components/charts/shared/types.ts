export type ChartTheme = 'light' | 'dark';
export type ChartSize = 'sm' | 'md' | 'xl';
export type ChartValueType = 'number' | 'currency';

export interface ChartBaseProps {
  theme?: ChartTheme;
  size?: ChartSize;
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  ariaLabel?: string;
  className?: string;
}
