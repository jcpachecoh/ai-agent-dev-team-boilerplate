export type EmployeeCatalogType =
  | 'EPS'
  | 'ARL'
  | 'PENSION_FUND'
  | 'CESANTIAS_FUND'
  | 'CAJA_COMPENSACION'
  | 'AREA'
  | 'DEPARTMENT';

export interface EmployeeCatalogOption {
  id: string;
  type: EmployeeCatalogType;
  name: string;
}

export const EMPLOYEE_CATALOG_TYPES = {
  EPS: 'EPS',
  ARL: 'ARL',
  PENSION_FUND: 'PENSION_FUND',
  CESANTIAS_FUND: 'CESANTIAS_FUND',
  CAJA_COMPENSACION: 'CAJA_COMPENSACION',
  AREA: 'AREA',
  DEPARTMENT: 'DEPARTMENT',
} as const satisfies Record<string, EmployeeCatalogType>;
