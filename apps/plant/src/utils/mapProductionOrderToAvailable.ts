import type { PlantAvailableOrder, PlantWorkstationStatus } from '@restopsiq/ui';

import type {
  ProductionOrderDetailResponse,
  ProductionOrderListItem,
  ProductionOrderStatusApi,
  ProductionPriorityApi,
} from '@/api/production-orders.api';

function mapPriority(priority: ProductionPriorityApi): 'urgent' | 'normal' | undefined {
  if (priority === 'URGENT' || priority === 'HIGH') return 'urgent';
  return 'normal';
}

function mapOrderStatus(
  status: ProductionOrderStatusApi,
): Exclude<PlantWorkstationStatus, 'empty'> {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'IN_PROCESS') return 'in_progress';
  if (status === 'PAUSED') return 'paused';
  return 'pending';
}

export { mapOrderStatus as mapProductionOrderStatusToWorkstation };

const ACTIVE_EXECUTION_STATUSES = new Set(['IN_PROCESS', 'PAUSED', 'READY', 'QA_PENDING']);

function resolveCurrentExecution(detail: ProductionOrderDetailResponse) {
  const sorted = [...detail.executions].sort((a, b) => a.phaseOrder - b.phaseOrder);

  const active = sorted.find((execution) => ACTIVE_EXECUTION_STATUSES.has(execution.status));
  if (active) return active;

  return sorted.find((execution) => execution.status !== 'COMPLETED');
}

export function mapProductionOrderDetailToAvailable(
  listItem: ProductionOrderListItem,
  detail: ProductionOrderDetailResponse,
  workstationCodeById: Map<string, string>,
): PlantAvailableOrder {
  const currentExecution = resolveCurrentExecution(detail);
  const stationUuid = currentExecution?.workStationId ?? '';
  const stationCode = workstationCodeById.get(stationUuid) ?? stationUuid;

  return {
    orderId: listItem.id,
    orderNumber: listItem.number,
    productName: detail.recipeName,
    recipeName: detail.recipeName,
    phaseName: currentExecution?.phaseName ?? 'Fase actual',
    phaseIndex: currentExecution?.phaseOrder ?? 1,
    phaseTotal: detail.executions.length || 1,
    stationId: stationCode || '—',
    workStationId: stationUuid || undefined,
    currentStepId:
      currentExecution && currentExecution.status !== 'COMPLETED' ? currentExecution.id : undefined,
    priority: mapPriority(listItem.priority),
    status: mapOrderStatus(detail.status),
    standardDurationMs: (currentExecution?.plannedMinutes ?? 0) * 60_000,
    ingredients: detail.materials.slice(0, 6).map((material) => ({
      id: material.id,
      name: material.materialName,
      quantity: `${material.requiredQuantity} ${material.unit}`,
    })),
  };
}

export function mapProductionOrderListItemToAvailable(
  listItem: ProductionOrderListItem,
): PlantAvailableOrder {
  return {
    orderId: listItem.id,
    orderNumber: listItem.number,
    productName: listItem.recipeName ?? listItem.number,
    recipeName: listItem.recipeName ?? 'Orden de producción',
    phaseName: 'Fase actual',
    phaseIndex: 1,
    phaseTotal: 1,
    stationId: '—',
    priority: mapPriority(listItem.priority),
    status: mapOrderStatus(listItem.status),
    standardDurationMs: 0,
    ingredients: [],
  };
}
