import type { RecetaTableColumn } from '@restopsiq/ui';

import { tableColumnsForVisible, type ResponsiveColumnDef } from '@/lib/responsive-columns';

export const RECIPE_LIST_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'id', label: 'ID', priority: 1, gridTrack: '88px', cardLabel: 'ID' },
  { id: 'nombre', label: 'Nombre', priority: 1, gridTrack: 'minmax(180px, 1.35fr)' },
  { id: 'categoria', label: 'Categoría', priority: 2, gridTrack: 'minmax(120px, 0.9fr)' },
  { id: 'tiempo', label: 'Tiempo est.', priority: 3, gridTrack: '112px' },
  { id: 'fases', label: 'Fases', priority: 3, gridTrack: '72px' },
  { id: 'version', label: 'Versión', priority: 3, gridTrack: '72px' },
  { id: 'estado', label: 'Estado', priority: 2, gridTrack: '108px' },
  { id: 'acciones', label: 'Acciones', priority: 1, gridTrack: '88px' },
];

export function recetaTableColumnsForVisible(
  allColumns: RecetaTableColumn[],
  visibleColumns: ResponsiveColumnDef[],
): RecetaTableColumn[] {
  return tableColumnsForVisible(allColumns, visibleColumns);
}
