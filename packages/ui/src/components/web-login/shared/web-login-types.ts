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
  email: string;
  password: string;
  /** Optional label for the demo block title */
  label?: string;
}

export interface WebLoginSurfaceProps {
  theme?: WebLoginTheme;
  size?: WebLoginSize;
  className?: string;
}

export type WebSignupDocumentType = 'CC' | 'CE' | 'PASAPORTE' | 'TI' | 'PEP';

export const WEB_SIGNUP_DOCUMENT_TYPES: readonly {
  value: WebSignupDocumentType;
  label: string;
}[] = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PEP', label: 'Permiso especial de permanencia' },
] as const;
