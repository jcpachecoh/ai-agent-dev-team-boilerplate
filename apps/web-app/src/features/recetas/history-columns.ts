import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

export const HISTORY_RESPONSIVE_COLUMNS: ResponsiveColumnDef[] = [
  { id: 'code', label: 'Código', priority: 1, gridTrack: '96px', cardLabel: 'Código' },
  { id: 'recipe', label: 'Receta', priority: 1, gridTrack: 'minmax(0, 1.4fr)' },
  { id: 'operator', label: 'Operador', priority: 2, gridTrack: 'minmax(120px, 1fr)' },
  { id: 'date', label: 'Fecha', priority: 2, gridTrack: 'minmax(140px, 1fr)' },
  { id: 'progress', label: 'Progreso', priority: 3, gridTrack: '80px' },
  { id: 'result', label: 'Resultado', priority: 2, gridTrack: '120px' },
  { id: 'validations', label: 'Validaciones', priority: 3, gridTrack: '100px' },
  { id: 'duration', label: 'Duración', priority: 3, gridTrack: '110px' },
];
