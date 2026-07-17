export type EmployeeCatalogType =
  | 'EPS'
  | 'ARL'
  | 'PENSION_FUND'
  | 'CESANTIAS_FUND'
  | 'CAJA_COMPENSACION'
  | 'AREA'
  | 'DEPARTMENT'
  | 'OVERTIME_REASON';

export interface EmployeeCatalogOption {
  id: string;
  type: EmployeeCatalogType;
  name: string;
  pilaCode?: string | null;
  isActive?: boolean;
}

export const EMPLOYEE_CATALOG_TYPES = {
  EPS: 'EPS',
  ARL: 'ARL',
  PENSION_FUND: 'PENSION_FUND',
  CESANTIAS_FUND: 'CESANTIAS_FUND',
  CAJA_COMPENSACION: 'CAJA_COMPENSACION',
  AREA: 'AREA',
  DEPARTMENT: 'DEPARTMENT',
  OVERTIME_REASON: 'OVERTIME_REASON',
} as const satisfies Record<string, EmployeeCatalogType>;

export const EMPLOYEE_CATALOG_TYPE_LABELS: Record<EmployeeCatalogType, string> = {
  EPS: 'EPS',
  ARL: 'ARL',
  PENSION_FUND: 'Fondo de pensión',
  CESANTIAS_FUND: 'Fondo de cesantías',
  CAJA_COMPENSACION: 'Caja de compensación',
  AREA: 'Área',
  DEPARTMENT: 'Departamento',
  OVERTIME_REASON: 'Motivos de extensión de jornada',
};

export interface ListEmployeeCatalogFilters {
  type?: EmployeeCatalogType;
  includeInactive?: boolean;
}

export interface CreateEmployeeCatalogOptionInput {
  type: EmployeeCatalogType;
  name: string;
  pilaCode?: string | null;
}

export interface UpdateEmployeeCatalogOptionInput {
  name?: string;
  isActive?: boolean;
  pilaCode?: string | null;
}
