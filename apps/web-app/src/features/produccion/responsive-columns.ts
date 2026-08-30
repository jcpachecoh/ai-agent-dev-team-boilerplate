import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export const PRODUCTION_ORDER_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  {
    id: 'number',
    label: 'Número OP',
    priority: 1,
    gridTrack: 'minmax(7rem, 0.9fr)',
    cardLabel: 'Número OP',
  },
  { id: 'recipe', label: 'Receta', priority: 1, gridTrack: 'minmax(10rem, 1.4fr)' },
  { id: 'status', label: 'Estado', priority: 2, gridTrack: 'minmax(6rem, 0.8fr)' },
  { id: 'priority', label: 'Prioridad', priority: 3, gridTrack: 'minmax(5rem, 0.7fr)' },
  { id: 'shift', label: 'Turno', priority: 3, gridTrack: 'minmax(5rem, 0.7fr)' },
  { id: 'planned', label: 'Inicio planificado', priority: 4, gridTrack: 'minmax(8rem, 1fr)' },
  { id: 'actions', label: 'Acciones', priority: 1, gridTrack: 'minmax(6rem, 0.8fr)' },
];

export const PRODUCTION_COMMITTEE_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  {
    id: 'number',
    label: 'Número',
    priority: 1,
    gridTrack: 'minmax(7rem, 0.9fr)',
    cardLabel: 'Número',
  },
  { id: 'status', label: 'Estado', priority: 2, gridTrack: 'minmax(6rem, 0.8fr)' },
  { id: 'members', label: 'Miembros', priority: 3, gridTrack: 'minmax(5rem, 0.7fr)' },
  { id: 'orders', label: 'OPs creadas', priority: 3, gridTrack: 'minmax(5rem, 0.7fr)' },
  { id: 'created', label: 'Creado', priority: 4, gridTrack: 'minmax(8rem, 1fr)' },
];
