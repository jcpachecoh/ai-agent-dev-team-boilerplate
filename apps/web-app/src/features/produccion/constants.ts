import type { ProductionOrderStatus, ProductionPriority, ProductionShift } from './types';

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PLANNED', label: 'Planificada' },
  { value: 'IN_PROCESS', label: 'En proceso' },
  { value: 'PAUSED', label: 'Pausada' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
] as const;

export const SHIFT_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los turnos' },
  { value: 'MORNING', label: 'Mañana (6am–2pm)' },
  { value: 'AFTERNOON', label: 'Tarde (2pm–10pm)' },
  { value: 'NIGHT', label: 'Noche (10pm–6am)' },
] as const;

export const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas las prioridades' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
] as const;

export const SHIFT_FORM_OPTIONS = SHIFT_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export const PRIORITY_FORM_OPTIONS = PRIORITY_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export const ORDER_STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  DRAFT: 'Borrador',
  PLANNED: 'Planificada',
  IN_PROCESS: 'En proceso',
  PAUSED: 'Pausada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

export const PRIORITY_LABELS: Record<ProductionPriority, string> = {
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const SHIFT_LABELS: Record<ProductionShift, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noche',
};

/** Grid columns for OP list table — keep in sync with RecetaTableHeader. */
export const OP_TABLE_COLUMNS =
  'minmax(7rem, 0.9fr) minmax(10rem, 1.4fr) minmax(6rem, 0.8fr) minmax(5rem, 0.7fr) minmax(5rem, 0.7fr) minmax(8rem, 1fr) minmax(6rem, 0.8fr)';

export const RECETA_TABLE_SIZE = 'md' as const;
