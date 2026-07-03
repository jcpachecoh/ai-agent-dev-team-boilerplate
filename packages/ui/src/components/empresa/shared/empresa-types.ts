export type EmpresaTheme = 'light' | 'dark';
export type EmpresaSize = 'sm' | 'md' | 'xl';

export type EmpresaBadgeVariant = 'success' | 'primary';

export type EmpresaWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const EMPRESA_WEEKDAY_LABELS: Record<EmpresaWeekday, string> = {
  mon: 'LUN',
  tue: 'MAR',
  wed: 'MIÉ',
  thu: 'JUE',
  fri: 'VIE',
  sat: 'SÁB',
  sun: 'DOM',
};

export const EMPRESA_WEEKDAYS: EmpresaWeekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export interface EmpresaMetadataItem {
  label: string;
  value: string;
}

export interface EmpresaInformacionValues {
  restaurantName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  openTime?: string;
  closeTime?: string;
  operatingDays?: EmpresaWeekday[];
}
