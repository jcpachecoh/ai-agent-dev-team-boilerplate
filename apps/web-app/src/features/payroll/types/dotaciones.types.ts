export type DotacionStatus = 'PENDIENTE' | 'ENTREGADA' | 'NO_APLICA';

export interface DotacionSupplyItem {
  id: string;
  nombre: string;
  talla: string | null;
}

export interface DotacionDelivery {
  id: string;
  tenantId: string;
  employeeId: string;
  period: string;
  supplyItemId: string | null;
  quantity: number;
  deliveredAt: string | null;
  status: DotacionStatus;
  signedReceiptUrl: string | null;
  stockMovementId: string | null;
  noAplicaReason: string | null;
  createdAt: string;
  updatedAt: string;
  supplyItem: DotacionSupplyItem | null;
}

export interface DotacionPage {
  edges: DotacionDelivery[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface AvailableSupplyItem {
  id: string;
  nombre: string;
  talla: string | null;
  genero: string | null;
  subcategoria: string | null;
  stockActualBodega: string;
  unidadBase: string;
}

export interface GenerateEntitlementsResult {
  processed: number;
  created: number;
  skipped: number;
}

export interface RegisterDotacionInput {
  dotacionDeliveryId: string;
  supplyItemId: string;
  quantity: number;
  deliveredAt: string;
  signedReceiptUrl?: string;
}

export interface BulkAssignByPositionInput {
  period: string;
  positionId: string;
  supplyItemId: string;
  quantity: number;
  deliveredAt: string;
  locationId?: string;
  signedReceiptUrl?: string;
}

export interface BulkAssignResult {
  assigned: number;
  skipped: number;
  total: number;
}

export const DOTACION_STATUS_LABELS: Record<DotacionStatus, string> = {
  PENDIENTE: 'Pendiente',
  ENTREGADA: 'Entregada',
  NO_APLICA: 'No aplica',
};

export const DOTACION_PERIODS = [
  { value: 'YYYY-04', label: 'Abril (30-abr)', month: '04' },
  { value: 'YYYY-08', label: 'Agosto (31-ago)', month: '08' },
  { value: 'YYYY-12', label: 'Diciembre (20-dic)', month: '12' },
] as const;

export function buildDotacionPeriod(year: number, month: '04' | '08' | '12'): string {
  return `${year}-${month}`;
}

export function getCurrentDotacionPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  if (month <= 4) return buildDotacionPeriod(year, '04');
  if (month <= 8) return buildDotacionPeriod(year, '08');
  return buildDotacionPeriod(year, '12');
}
