import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export const RECIPE_CATEGORY_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'id', label: 'Código', priority: 1, gridTrack: '120px', cardLabel: 'Código' },
  { id: 'nombre', label: 'Nombre', priority: 1, gridTrack: 'minmax(0, 2fr)' },
  { id: 'descripcion', label: 'Descripción', priority: 2, gridTrack: 'minmax(140px, 1.5fr)' },
  { id: 'estado', label: 'Estado', priority: 2, gridTrack: '150px' },
  { id: 'acciones', label: 'Acciones', priority: 1, gridTrack: '180px' },
];
