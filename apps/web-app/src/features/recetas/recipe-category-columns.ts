import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export const RECIPE_CATEGORY_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'id', label: 'Código', priority: 1, gridTrack: '112px', cardLabel: 'Código' },
  { id: 'nombre', label: 'Nombre', priority: 1, gridTrack: 'minmax(160px, 1.2fr)' },
  { id: 'descripcion', label: 'Descripción', priority: 2, gridTrack: 'minmax(120px, 1fr)' },
  { id: 'estado', label: 'Estado', priority: 2, gridTrack: '108px' },
  { id: 'acciones', label: 'Acciones', priority: 1, gridTrack: '88px' },
];
