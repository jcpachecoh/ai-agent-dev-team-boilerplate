import type { EmpleadoColumnDef } from '@restopsiq/ui';

export const OVERTIME_TABLE_COLUMNS: EmpleadoColumnDef[] = [
  { key: 'employee', label: 'Empleado', width: 'minmax(200px, 1.4fr)' },
  { key: 'location', label: 'Sede', width: 'minmax(140px, 0.9fr)' },
  { key: 'minutes', label: 'Minutos', width: 'minmax(88px, max-content)', align: 'center' },
  { key: 'shiftEnd', label: 'Fin turno', width: 'minmax(160px, 1fr)' },
  { key: 'actualEnd', label: 'Última salida', width: 'minmax(160px, 1fr)' },
  { key: 'status', label: 'Estado', width: 'minmax(180px, max-content)', align: 'center' },
  { key: 'actions', label: 'Acciones', width: 'minmax(120px, 0.8fr)', align: 'center' },
];

export function getOvertimeGridTemplate(): string {
  return OVERTIME_TABLE_COLUMNS.map((column) => column.width ?? '1fr').join(' ');
}

export function getOvertimeTableMinWidthPx(): number {
  const widths = OVERTIME_TABLE_COLUMNS.reduce((sum, column) => {
    const match = column.width?.match(/minmax\((\d+)px/i);
    return sum + (match ? Number(match[1]) : 96);
  }, 0);

  return widths + Math.max(OVERTIME_TABLE_COLUMNS.length - 1, 0) * 20 + 24;
}
