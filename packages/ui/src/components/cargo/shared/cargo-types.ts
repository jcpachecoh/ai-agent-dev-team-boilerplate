export type CargoTheme = 'light' | 'dark';
export type CargoSize = 'sm' | 'md';

export type CargoStatusFilterValue = 'all' | 'active' | 'inactive';

export interface CargoTableRowData {
  id: string;
  title: string;
  area: string;
  baseSalaryRange?: number | string;
  isActive?: boolean;
}
