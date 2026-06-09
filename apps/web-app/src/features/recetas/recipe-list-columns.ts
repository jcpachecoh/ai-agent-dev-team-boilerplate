import type { RecetaTableColumn } from '@restopsiq/ui';

import { tableColumnsForVisible, type ResponsiveColumnDef } from '@/lib/responsive-columns';

export const RECIPE_LIST_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'id', label: 'ID', priority: 1, gridTrack: '120px', cardLabel: 'ID' },
  { id: 'nombre', label: 'Nombre', priority: 1, gridTrack: 'minmax(0, 2fr)' },
  { id: 'categoria', label: 'Categoría', priority: 2, gridTrack: 'minmax(140px, 1fr)' },
  { id: 'tiempo', label: 'Tiempo est.', priority: 3, gridTrack: '120px' },
  { id: 'fases', label: 'Fases', priority: 3, gridTrack: '90px' },
  { id: 'estado', label: 'Estado', priority: 2, gridTrack: '150px' },
  { id: 'acciones', label: 'Acciones', priority: 1, gridTrack: '130px' },
];

export function recetaTableColumnsForVisible(
  allColumns: RecetaTableColumn[],
  visibleColumns: ResponsiveColumnDef[],
): RecetaTableColumn[] {
  return tableColumnsForVisible(allColumns, visibleColumns);
}
