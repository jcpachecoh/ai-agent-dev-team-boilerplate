export interface EmpleadoColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
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

function parseColumnMinWidthPx(width: string): number {
  const minmaxMatch = width.match(/minmax\((\d+)px/i);
  if (minmaxMatch) {
    return Number(minmaxMatch[1]);
  }

  const fixedMatch = width.match(/^(\d+)px$/i);
  if (fixedMatch) {
    return Number(fixedMatch[1]);
  }

  return 100;
}

/** Minimum table width (px) before horizontal scroll — sum of column mins + row padding. */
export function getEmpleadoTableMinWidthPx(showActions = true): number {
  const columnSum = getEmpleadoColumns(showActions).reduce(
    (total, column) => total + parseColumnMinWidthPx(column.width ?? '1fr'),
    0,
  );

  return columnSum + 24;
}

export const empleadoGridTemplate = getEmpleadoGridTemplate(true);
