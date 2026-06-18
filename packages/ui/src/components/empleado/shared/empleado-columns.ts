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

export const empleadoGridTemplate = getEmpleadoGridTemplate(true);
