import type { EmpleadoColumnDef } from '@restopsiq/ui';

export const CESANTIAS_TABLE_COLUMNS: EmpleadoColumnDef[] = [
  { key: 'employee', label: 'Empleado', width: 'minmax(180px, 1.3fr)' },
  { key: 'fund', label: 'Fondo', width: 'minmax(140px, 1fr)' },
  { key: 'channel', label: 'Canal', width: 'minmax(120px, 0.85fr)' },
  { key: 'base', label: 'Base', width: 'minmax(108px, 0.75fr)', align: 'center' },
  { key: 'days', label: 'Días', width: 'minmax(64px, 0.45fr)', align: 'center' },
  { key: 'cesantias', label: 'Cesantías', width: 'minmax(108px, 0.8fr)', align: 'center' },
  { key: 'interest', label: 'Intereses', width: 'minmax(108px, 0.8fr)', align: 'center' },
  {
    key: 'cesantiasStatus',
    label: 'Estado cesantías',
    width: 'minmax(150px, 0.95fr)',
    align: 'center',
  },
  {
    key: 'interestStatus',
    label: 'Estado intereses',
    width: 'minmax(150px, 0.95fr)',
    align: 'center',
  },
];

export function getCesantiasGridTemplate(): string {
  return CESANTIAS_TABLE_COLUMNS.map((column) => column.width ?? '1fr').join(' ');
}

export function getCesantiasTableMinWidthPx(): number {
  const widths = CESANTIAS_TABLE_COLUMNS.reduce((sum, column) => {
    const match = column.width?.match(/minmax\((\d+)px/i);
    return sum + (match ? Number(match[1]) : 96);
  }, 0);

  return widths + Math.max(CESANTIAS_TABLE_COLUMNS.length - 1, 0) * 20 + 24;
}
