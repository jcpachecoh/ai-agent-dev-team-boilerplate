export interface EmpleadoColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
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

export const EMPLEADO_TABLE_COLUMN_GAP_PX = 20;

export const defaultEmpleadoColumns: EmpleadoColumnDef[] = [
  { key: 'employee', label: 'Empleado', sortable: true, width: 'minmax(220px, 1.5fr)' },
  { key: 'cedula', label: 'Cédula', width: 'minmax(112px, 0.7fr)', align: 'center' },
  { key: 'role', label: 'Cargo / Área', sortable: true, width: 'minmax(160px, 1.1fr)' },
  { key: 'contract', label: 'Contrato', width: 'minmax(124px, 0.85fr)', align: 'center' },
  { key: 'location', label: 'Sede', width: 'minmax(168px, 1.05fr)' },
  {
    key: 'hireDate',
    label: 'Ingreso',
    sortable: true,
    width: 'minmax(100px, 0.65fr)',
    align: 'center',
  },
  { key: 'status', label: 'Estado', width: 'minmax(108px, max-content)', align: 'center' },
  { key: 'actions', label: 'Acciones', width: '72px', align: 'right' },
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

function getColumnMinWidthPx(width?: string): number {
  if (!width) return 80;

  const minmaxMatch = width.match(/minmax\((\d+)px/i);
  if (minmaxMatch) return Number(minmaxMatch[1]);

  const pxMatch = width.match(/^(\d+)px$/i);
  if (pxMatch) return Number(pxMatch[1]);

  if (width === 'max-content') return 96;

  const minmaxMaxContentMatch = width.match(/minmax\((\d+)px,\s*max-content\)/i);
  if (minmaxMaxContentMatch) return Number(minmaxMaxContentMatch[1]);

  return 80;
}

export function getEmpleadoTableMinWidthPx(showActions = true): number {
  const columns = getEmpleadoColumns(showActions);
  const columnsWidth = columns.reduce((sum, column) => sum + getColumnMinWidthPx(column.width), 0);
  const gaps = Math.max(columns.length - 1, 0) * EMPLEADO_TABLE_COLUMN_GAP_PX;

  return columnsWidth + gaps + 24;
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
