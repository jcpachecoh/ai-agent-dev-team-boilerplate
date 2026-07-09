import type { EmpleadoColumnDef } from '@restopsiq/ui';

export const DOTACION_HISTORY_COLUMNS: EmpleadoColumnDef[] = [
  { key: 'period', label: 'Periodo', width: 'minmax(100px, 0.75fr)' },
  { key: 'item', label: 'Ítem', width: 'minmax(180px, 1.25fr)' },
  { key: 'quantity', label: 'Cant.', width: 'minmax(72px, 0.5fr)', align: 'center' },
  { key: 'deliveredAt', label: 'Entrega', width: 'minmax(130px, 0.9fr)' },
  { key: 'status', label: 'Estado', width: 'minmax(120px, max-content)', align: 'center' },
  { key: 'receipt', label: 'Comprobante', width: 'minmax(120px, 0.85fr)', align: 'right' },
];

export function getDotacionGridTemplate(columns: EmpleadoColumnDef[]): string {
  return columns.map((column) => column.width ?? '1fr').join(' ');
}

export function getDotacionTableMinWidthPx(columns: EmpleadoColumnDef[]): number {
  return columns.reduce((total, column) => {
    const match = column.width?.match(/minmax\((\d+)px/);
    return total + (match ? Number(match[1]) : 120);
  }, 80);
}
