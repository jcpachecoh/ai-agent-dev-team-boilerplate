import { plantFetch } from '@/services/plant-api.service';

export type ProductionOrderStatusApi =
  | 'DRAFT'
  | 'PLANNED'
  | 'IN_PROCESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProductionPriorityApi = 'NORMAL' | 'HIGH' | 'URGENT';

export interface ProductionOrderListItem {
  id: string;
  tenantId: string;
  number: string;
  status: ProductionOrderStatusApi;
  priority: ProductionPriorityApi;
  shift: string;
  plannedStartAt: string;
  recipeId: string;
  recipeName?: string;
  committeeId?: string | null;
  committeeNumber?: string | null;
}

export interface ProductionOrderExecutionItem {
  id: string;
  phaseId: string;
  phaseOrder: number;
  phaseName: string;
  workStationId: string;
  status: string;
  plannedMinutes: number;
}

export interface ProductionOrderMaterialItem {
  id: string;
  materialName: string;
  requiredQuantity: string;
  unit: string;
}

export interface ProductionOrderDetailResponse {
  id: string;
  number: string;
  recipeName: string;
  status: ProductionOrderStatusApi;
  priority: ProductionPriorityApi;
  executions: ProductionOrderExecutionItem[];
  materials: ProductionOrderMaterialItem[];
}

export interface WorkStationListItem {
  id: string;
  code: string;
  name: string;
}

export const ASSIGNABLE_ORDER_STATUSES: ProductionOrderStatusApi[] = [
  'PLANNED',
  'IN_PROCESS',
  'PAUSED',
];

export function fetchProductionOrdersList(
  params: { status?: ProductionOrderStatusApi } = {},
): Promise<ProductionOrderListItem[]> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);

  const query = search.toString();
  return plantFetch<ProductionOrderListItem[]>(`/api/plant/orders${query ? `?${query}` : ''}`);
}

export function fetchProductionOrderDetail(
  orderId: string,
): Promise<ProductionOrderDetailResponse> {
  return plantFetch<ProductionOrderDetailResponse>(`/api/plant/orders/${orderId}`);
}

export function fetchWorkStationsList(): Promise<WorkStationListItem[]> {
  return plantFetch<WorkStationListItem[]>('/api/plant/workstations');
}

export type AssignableOrderRow =
  | {
      listItem: ProductionOrderListItem;
      detail: ProductionOrderDetailResponse;
      workstationCodeById: Map<string, string>;
    }
  | {
      listItem: ProductionOrderListItem;
      detail: null;
      workstationCodeById: Map<string, string>;
    };

export async function fetchAssignableOrdersWithDetail(): Promise<AssignableOrderRow[]> {
  const [listItems, workstations] = await Promise.all([
    fetchProductionOrdersList(),
    fetchWorkStationsList().catch(() => [] as WorkStationListItem[]),
  ]);

  const workstationCodeById = new Map(workstations.map((station) => [station.id, station.code]));

  const assignable = listItems.filter((item) => ASSIGNABLE_ORDER_STATUSES.includes(item.status));

  const enriched = await Promise.all(
    assignable.map(async (item): Promise<AssignableOrderRow> => {
      try {
        const detail = await fetchProductionOrderDetail(item.id);
        return { listItem: item, detail, workstationCodeById };
      } catch {
        return { listItem: item, detail: null, workstationCodeById };
      }
    }),
  );

  return enriched;
}
