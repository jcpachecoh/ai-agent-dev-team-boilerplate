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

/**
 * Columnas exclusivas de OS-550 (Colaboradores de Asistencia) — solo se insertan cuando
 * showAttendanceColumns=true. Nunca afectan a defaultEmpleadoColumns ni a consumidores
 * existentes (Payroll) que no pasan ese flag. El orden aquí debe coincidir exactamente
 * con el orden de las celdas en EmpleadoTableRow/EmpleadoTableCard — apellidos se
 * insertan justo después de 'cedula'; supervisor/turno/portalTrabajador justo antes de
 * 'actions' (después de 'status').
 */
export const attendanceApellidoColumns: EmpleadoColumnDef[] = [
  { key: 'primerApellido', label: 'Primer apellido', width: 'minmax(120px, 0.9fr)' },
  { key: 'segundoApellido', label: 'Segundo apellido', width: 'minmax(120px, 0.9fr)' },
];

export const attendanceTrailingColumns: EmpleadoColumnDef[] = [
  { key: 'supervisor', label: 'Supervisor', width: 'minmax(140px, 1fr)' },
  { key: 'turno', label: 'Turno', width: 'minmax(140px, 0.9fr)', align: 'center' },
  {
    key: 'portalTrabajador',
    label: 'Portal trabajador',
    width: 'minmax(130px, 0.85fr)',
    align: 'center',
  },
];

export function getEmpleadoColumns(
  showActions = true,
  showAttendanceColumns = false,
): EmpleadoColumnDef[] {
  if (!showAttendanceColumns) {
    return showActions
      ? defaultEmpleadoColumns
      : defaultEmpleadoColumns.filter((column) => column.key !== 'actions');
  }

  const cedulaIndex = defaultEmpleadoColumns.findIndex((column) => column.key === 'cedula');
  const actionsIndex = defaultEmpleadoColumns.findIndex((column) => column.key === 'actions');

  const base = [
    ...defaultEmpleadoColumns.slice(0, cedulaIndex + 1),
    ...attendanceApellidoColumns,
    ...defaultEmpleadoColumns.slice(cedulaIndex + 1, actionsIndex),
    ...attendanceTrailingColumns,
    defaultEmpleadoColumns[actionsIndex],
  ];

  if (showActions) return base;
  return base.filter((column) => column.key !== 'actions');
}

export function getEmpleadoGridTemplate(showActions = true, showAttendanceColumns = false): string {
  return getEmpleadoColumns(showActions, showAttendanceColumns)
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

export function getEmpleadoTableMinWidthPx(
  showActions = true,
  showAttendanceColumns = false,
): number {
  const columns = getEmpleadoColumns(showActions, showAttendanceColumns);
  const columnsWidth = columns.reduce((sum, column) => sum + getColumnMinWidthPx(column.width), 0);
  const gaps = Math.max(columns.length - 1, 0) * EMPLEADO_TABLE_COLUMN_GAP_PX;

  return columnsWidth + gaps + 24;
}

export function buildEmpleadoHeaderColumns(
  showActions: boolean,
  sortColumn: EmpleadoSortColumnKey | null,
  sortDirection: EmpleadoSortDirection,
  onSortColumn?: (column: EmpleadoSortColumnKey) => void,
  showAttendanceColumns = false,
): EmpleadoColumnDef[] {
  return getEmpleadoColumns(showActions, showAttendanceColumns).map((column) => {
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
