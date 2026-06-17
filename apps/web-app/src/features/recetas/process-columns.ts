import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export const PROCESS_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'id', label: 'ID Receta', priority: 1, gridTrack: '96px', cardLabel: 'ID' },
  { id: 'nombre', label: 'Nombre', priority: 1, gridTrack: 'minmax(0, 1.15fr)' },
  { id: 'categoria', label: 'Categoría', priority: 2, gridTrack: 'minmax(96px, 0.85fr)' },
  { id: 'fases', label: 'Fases', priority: 3, gridTrack: '64px' },
  { id: 'duracion', label: 'Duración', priority: 3, gridTrack: '88px' },
  { id: 'estado', label: 'Estado Proceso', priority: 2, gridTrack: '136px' },
  { id: 'ultima', label: 'Última validación', priority: 4, gridTrack: 'minmax(112px, 1fr)' },
  { id: 'salud', label: 'Salud ejecución', priority: 4, gridTrack: 'minmax(120px, 1fr)' },
  { id: 'acciones', label: 'Acciones', priority: 1, gridTrack: '128px' },
];
