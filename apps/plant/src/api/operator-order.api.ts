import { plantFetch } from '@/services/plant-api.service';

export type OrderRecipeUiStatus = 'pending' | 'in_progress' | 'paused' | 'completed';

export type OrderRecipePhaseUiStatus = 'completed' | 'current' | 'pending';

export interface OrderRecipePhaseIngredientView {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  supplier?: string;
  stockWarning: boolean;
}

export interface OrderRecipePhaseView {
  id: string;
  index: number;
  name: string;
  durationMinutes: number;
  instruction?: string;
  ingredients: OrderRecipePhaseIngredientView[];
  status: OrderRecipePhaseUiStatus;
}

export interface OrderRecipeViewResponse {
  orderId: string;
  productName: string;
  recipeName: string;
  batchSize: string;
  stationId: string;
  stationName: string;
  currentPhaseIndex: number;
  currentStepId?: string;
  status: OrderRecipeUiStatus;
  phases: OrderRecipePhaseView[];
  elapsedSeconds?: number;
}

export interface OrderDetailApiResponse {
  id: string;
  status: string;
}

function buildIdempotencyHeaders(idempotencyKey?: string): HeadersInit | undefined {
  return idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
}

export function fetchOrderRecipeView(orderId: string): Promise<OrderRecipeViewResponse> {
  return plantFetch<OrderRecipeViewResponse>(`/api/plant/orders/${orderId}/recipe`);
}

export function startProductionOrder(
  orderId: string,
  workStationId: string,
  idempotencyKey?: string,
): Promise<OrderDetailApiResponse> {
  return plantFetch<OrderDetailApiResponse>(`/api/plant/orders/${orderId}/start`, {
    method: 'POST',
    headers: buildIdempotencyHeaders(idempotencyKey),
    body: JSON.stringify({ workStationId }),
  });
}

export function pauseProductionOrder(
  orderId: string,
  notes?: string,
  idempotencyKey?: string,
): Promise<OrderDetailApiResponse> {
  return plantFetch<OrderDetailApiResponse>(`/api/plant/orders/${orderId}/operator/pause`, {
    method: 'POST',
    headers: buildIdempotencyHeaders(idempotencyKey),
    body: JSON.stringify({ notes }),
  });
}

export function resumeProductionOrder(
  orderId: string,
  idempotencyKey?: string,
): Promise<OrderDetailApiResponse> {
  return plantFetch<OrderDetailApiResponse>(`/api/plant/orders/${orderId}/operator/resume`, {
    method: 'POST',
    headers: buildIdempotencyHeaders(idempotencyKey),
  });
}

export function completeProductionStep(
  orderId: string,
  stepId: string,
  payload: { actualMinutes?: number; producedQuantity?: string; notes?: string } = {},
  idempotencyKey?: string,
): Promise<OrderDetailApiResponse> {
  return plantFetch<OrderDetailApiResponse>(`/api/plant/orders/${orderId}/complete-step`, {
    method: 'POST',
    headers: buildIdempotencyHeaders(idempotencyKey),
    body: JSON.stringify({ stepId, ...payload }),
  });
}

export function finishProductionOrder(
  orderId: string,
  notes?: string,
  idempotencyKey?: string,
): Promise<OrderDetailApiResponse> {
  return plantFetch<OrderDetailApiResponse>(`/api/plant/orders/${orderId}/finish`, {
    method: 'POST',
    headers: buildIdempotencyHeaders(idempotencyKey),
    body: JSON.stringify({ notes }),
  });
}
