export type WebLoginTheme = 'light' | 'dark';
export type WebLoginSize = 'sm' | 'md' | 'xl';

export type WebLoginTrendTone = 'success' | 'warning' | 'neutral' | 'danger';

export interface WebLoginStat {
  label: string;
  value: string;
  trendLabel?: string;
  trendTone?: WebLoginTrendTone;
}

export interface WebLoginDemoCredentials {
  cedula: string;
  pin: string;
  /** Optional label for the demo block title */
  label?: string;
}

export interface WebLoginSurfaceProps {
  theme?: WebLoginTheme;
  size?: WebLoginSize;
  className?: string;
}
