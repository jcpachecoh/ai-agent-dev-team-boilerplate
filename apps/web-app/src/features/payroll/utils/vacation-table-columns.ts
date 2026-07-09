import type { EmpleadoColumnDef } from '@restopsiq/ui';

export const VACATION_REQUEST_COLUMNS: EmpleadoColumnDef[] = [
  { key: 'dates', label: 'Fechas', width: 'minmax(220px, 1.5fr)' },
  { key: 'type', label: 'Tipo', width: 'minmax(120px, 0.85fr)' },
  { key: 'days', label: 'Días', width: 'minmax(72px, 0.5fr)', align: 'center' },
  { key: 'status', label: 'Estado', width: 'minmax(130px, max-content)', align: 'center' },
  { key: 'actions', label: 'Acciones', width: 'minmax(140px, 0.9fr)', align: 'right' },
];

export const VACATION_APPROVAL_COLUMNS: EmpleadoColumnDef[] = [
  { key: 'employee', label: 'Empleado', width: 'minmax(180px, 1.15fr)' },
  { key: 'location', label: 'Sede', width: 'minmax(140px, 0.95fr)' },
  { key: 'dates', label: 'Fechas', width: 'minmax(220px, 1.35fr)' },
  { key: 'type', label: 'Tipo', width: 'minmax(110px, 0.8fr)' },
  { key: 'days', label: 'Días', width: 'minmax(72px, 0.5fr)', align: 'center' },
  { key: 'status', label: 'Estado', width: 'minmax(130px, max-content)', align: 'center' },
  { key: 'actions', label: 'Acciones', width: 'minmax(120px, 0.75fr)', align: 'right' },
];

export function getVacationGridTemplate(columns: EmpleadoColumnDef[]): string {
  return columns.map((column) => column.width ?? '1fr').join(' ');
}

export function getVacationTableMinWidthPx(columns: EmpleadoColumnDef[]): number {
  return columns.reduce((total, column) => {
    const match = column.width?.match(/minmax\((\d+)px/);
    return total + (match ? Number(match[1]) : 120);
  }, 80);
}
