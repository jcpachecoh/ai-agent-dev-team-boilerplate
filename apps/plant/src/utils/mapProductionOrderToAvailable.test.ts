import { describe, expect, it } from 'vitest';

import type { ProductionOrderListItem } from '@/api/production-orders.api';
import {
  mapProductionOrderDetailToAvailable,
  mapProductionOrderListItemToAvailable,
} from '@/utils/mapProductionOrderToAvailable';

const listItem: ProductionOrderListItem = {
  id: 'order-uuid-1',
  tenantId: 'tenant-1',
  number: 'OP0001-01',
  status: 'PLANNED',
  priority: 'URGENT',
  shift: 'MORNING',
  plannedStartAt: '2026-06-17T08:00:00.000Z',
  recipeId: 'recipe-1',
};

const detail = {
  id: 'order-uuid-1',
  number: 'OP0001-01',
  recipeName: 'Pollo asado porcionado',
  status: 'PLANNED' as const,
  priority: 'URGENT' as const,
  executions: [
    {
      id: 'exec-1',
      phaseId: 'phase-1',
      phaseOrder: 1,
      phaseName: 'Preparación',
      workStationId: 'ws-uuid-2',
      status: 'READY',
      plannedMinutes: 10,
    },
    {
      id: 'exec-2',
      phaseId: 'phase-2',
      phaseOrder: 2,
      phaseName: 'Corte y porcionado',
      workStationId: 'ws-uuid-2',
      status: 'PENDING',
      plannedMinutes: 15,
    },
  ],
  materials: [
    {
      id: 'mat-1',
      materialName: 'Sal',
      requiredQuantity: '1',
      unit: 'kg',
    },
  ],
};

describe('mapProductionOrderToAvailable', () => {
  it('maps order detail into PlantAvailableOrder', () => {
    const mapped = mapProductionOrderDetailToAvailable(
      listItem,
      detail,
      new Map([['ws-uuid-2', 'EST-02']]),
    );

    expect(mapped.orderId).toBe('order-uuid-1');
    expect(mapped.orderNumber).toBe('OP0001-01');
    expect(mapped.productName).toBe('Pollo asado porcionado');
    expect(mapped.phaseName).toBe('Preparación');
    expect(mapped.phaseIndex).toBe(1);
    expect(mapped.phaseTotal).toBe(2);
    expect(mapped.stationId).toBe('EST-02');
    expect(mapped.workStationId).toBe('ws-uuid-2');
    expect(mapped.currentStepId).toBe('exec-1');
    expect(mapped.priority).toBe('urgent');
    expect(mapped.status).toBe('pending');
    expect(mapped.ingredients).toHaveLength(1);
  });

  it('maps COMPLETED order detail status to completed', () => {
    const mapped = mapProductionOrderDetailToAvailable(
      listItem,
      {
        ...detail,
        status: 'COMPLETED',
      },
      new Map([['ws-uuid-2', 'EST-02']]),
    );

    expect(mapped.status).toBe('completed');
  });

  it('falls back to list item when detail is unavailable', () => {
    const mapped = mapProductionOrderListItemToAvailable({
      ...listItem,
      recipeName: 'Receta Base Pollo',
    });

    expect(mapped.orderId).toBe('order-uuid-1');
    expect(mapped.productName).toBe('Receta Base Pollo');
    expect(mapped.status).toBe('pending');
  });
});
