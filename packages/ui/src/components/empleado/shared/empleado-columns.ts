export interface EmpleadoColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  sortDirection?: EmpleadoSortDirection | null;
  active?: boolean;
  onSort?: () => void;
}

export type EmpleadoSortColumnKey = 'employee' | 'role' | 'hireDate';
export type EmpleadoSortDirection = 'asc' | 'desc';

export const EMPLEADO_SORTABLE_COLUMN_KEYS: EmpleadoSortColumnKey[] = [
  'employee',
  'role',
  'hireDate',
];

export function isEmpleadoSortColumnKey(key: string): key is EmpleadoSortColumnKey {
  return EMPLEADO_SORTABLE_COLUMN_KEYS.includes(key as EmpleadoSortColumnKey);
}

export const defaultEmpleadoColumns: EmpleadoColumnDef[] = [
  { key: 'employee', label: 'Empleado', sortable: true, width: 'minmax(220px, 1.5fr)' },
  { key: 'cedula', label: 'Cédula', width: 'minmax(120px, 0.9fr)' },
  { key: 'role', label: 'Cargo / Área', sortable: true, width: 'minmax(160px, 1.1fr)' },
  { key: 'contract', label: 'Contrato', width: 'minmax(110px, 0.8fr)' },
  { key: 'location', label: 'Sede', width: 'minmax(130px, 0.9fr)' },
  { key: 'hireDate', label: 'Ingreso', sortable: true, width: 'minmax(100px, 0.7fr)' },
  { key: 'status', label: 'Estado', width: '110px' },
  { key: 'actions', label: 'Acciones', width: '72px' },
];

export function getEmpleadoColumns(showActions = true): EmpleadoColumnDef[] {
  if (showActions) return defaultEmpleadoColumns;
  return defaultEmpleadoColumns.filter((column) => column.key !== 'actions');
}

export function getEmpleadoGridTemplate(showActions = true): string {
  return getEmpleadoColumns(showActions)
    .map((column) => column.width ?? '1fr')
    .join(' ');
}

export function buildEmpleadoHeaderColumns(
  showActions: boolean,
  sortColumn: EmpleadoSortColumnKey | null,
  sortDirection: EmpleadoSortDirection,
  onSortColumn?: (column: EmpleadoSortColumnKey) => void,
): EmpleadoColumnDef[] {
  return getEmpleadoColumns(showActions).map((column) => {
    const sortKey = column.key;

    if (!column.sortable || !onSortColumn || !isEmpleadoSortColumnKey(sortKey)) {
      return column;
    }

    const isActive = sortColumn === sortKey;

    return {
      ...column,
      active: isActive,
      sortDirection: isActive ? sortDirection : null,
      onSort: () => onSortColumn(sortKey),
    };
  });
}

export const empleadoGridTemplate = getEmpleadoGridTemplate(true);
