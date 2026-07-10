import type { EmpleadoColumnDef } from '@restopsiq/ui';

export const MY_NOVEDADES_TABLE_COLUMNS: EmpleadoColumnDef[] = [
  { key: 'type', label: 'Tipo', width: 'minmax(180px, 1.2fr)' },
  { key: 'dates', label: 'Fechas', width: 'minmax(180px, 1.1fr)' },
  { key: 'status', label: 'Estado', width: 'minmax(140px, max-content)', align: 'center' },
  { key: 'actions', label: 'Soporte', width: 'minmax(100px, 0.6fr)', align: 'center' },
];

export function getMyNovedadesGridTemplate(): string {
  return MY_NOVEDADES_TABLE_COLUMNS.map((column) => column.width ?? '1fr').join(' ');
}

export function getMyNovedadesTableMinWidthPx(): number {
  const widths = MY_NOVEDADES_TABLE_COLUMNS.reduce((sum, column) => {
    const match = column.width?.match(/minmax\((\d+)px/i);
    return sum + (match ? Number(match[1]) : 96);
  }, 0);

  return widths + Math.max(MY_NOVEDADES_TABLE_COLUMNS.length - 1, 0) * 20 + 24;
}
