import type {
  CreateProductionOrderInput,
  ListProductionOrdersFilters,
  ProductionOrderDetail,
  ProductionOrderListItem,
  ProductionRecipeSummary,
  UpdateExecutionRouteInput,
  UpdateProductionOrderDocumentInput,
  UpdateProductionOrderInput,
} from '../types';
import { triggerBrowserDownload } from '../utils/download';

import { plantFetch, plantFetchBlob } from '@/api/plant/client';

function normalizeOrderDetail(order: ProductionOrderDetail): ProductionOrderDetail {
  return {
    ...order,
    lotNumber: order.lotNumber ?? null,
    productionDate: order.productionDate ?? null,
    deliveryDate: order.deliveryDate ?? null,
    packageWeight: order.packageWeight ?? null,
    batchWeight: order.batchWeight ?? null,
    materials: order.materials ?? [],
    byproducts: order.byproducts ?? [],
    qualityChecks: order.qualityChecks ?? [],
    executions: (order.executions ?? []).map((execution) => ({
      ...execution,
      startedAt: execution.startedAt ?? null,
      operatorCount: execution.operatorCount ?? null,
      deliveredQuantity: execution.deliveredQuantity ?? null,
      responsibleUserId: execution.responsibleUserId ?? null,
      responsibleName: execution.responsibleName ?? null,
    })),
  };
}

function buildOrdersQuery(filters: ListProductionOrdersFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.shift) params.set('shift', filters.shift);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.plannedStartFrom) params.set('plannedStartFrom', filters.plannedStartFrom);
  if (filters.plannedStartTo) params.set('plannedStartTo', filters.plannedStartTo);
  const qs = params.toString();
  return qs ? `/plant/orders?${qs}` : '/plant/orders';
}

export function fetchProductionOrders(
  filters: ListProductionOrdersFilters = {},
): Promise<ProductionOrderListItem[]> {
  return plantFetch<ProductionOrderListItem[]>(buildOrdersQuery(filters));
}

export function fetchProductionOrderById(id: string): Promise<ProductionOrderDetail> {
  return plantFetch<ProductionOrderDetail>(`/plant/orders/${id}`).then(normalizeOrderDetail);
}

export function createProductionOrder(
  input: CreateProductionOrderInput,
): Promise<ProductionOrderDetail> {
  return plantFetch<ProductionOrderDetail>('/plant/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function planProductionOrder(id: string): Promise<ProductionOrderDetail> {
  return plantFetch<ProductionOrderDetail>(`/plant/orders/${id}/plan`, {
    method: 'PATCH',
  });
}

export function updateProductionOrder(
  id: string,
  input: UpdateProductionOrderInput,
): Promise<ProductionOrderDetail> {
  return plantFetch<ProductionOrderDetail>(`/plant/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateProductionOrderDocument(
  id: string,
  input: UpdateProductionOrderDocumentInput,
): Promise<ProductionOrderDetail> {
  return plantFetch<ProductionOrderDetail>(`/plant/orders/${id}/document`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateExecutionRoute(
  executionId: string,
  input: UpdateExecutionRouteInput,
): Promise<ProductionOrderDetail> {
  return plantFetch<ProductionOrderDetail>(`/plant/executions/${executionId}/route`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function downloadProductionOrderPdf(orderId: string): Promise<void> {
  const { blob, filename } = await plantFetchBlob(`/plant/orders/${orderId}/pdf`, {
    method: 'GET',
    headers: { Accept: 'application/pdf' },
  });

  triggerBrowserDownload(blob, filename ?? `OP-${orderId}.pdf`);
}

export function fetchProductionRecipes(): Promise<ProductionRecipeSummary[]> {
  return plantFetch<ProductionRecipeSummary[]>('/plant/recipes');
}
