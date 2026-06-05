import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PhaseExecutionStatus,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
  StockUnit,
} from '@prisma/client';
import { ProductionOrderPdfService } from '../service/production-order-pdf.service';
import { PlantService } from '../service/plant.service';
import type { OrderDetailResponse } from '../interfaces/plant.interfaces';

const tenantId = 'palos-de-lena';

const orderDetail: OrderDetailResponse = {
  id: 'order-1',
  tenantId,
  number: '2026-0134',
  recipeId: 'recipe-1',
  recipeName: 'AJIACO BASE',
  recipeVersion: 1,
  status: ProductionOrderStatus.PLANNED,
  priority: ProductionPriority.NORMAL,
  shift: ProductionShift.MORNING,
  batchCount: 2,
  plannedQuantity: '237930.000',
  producedQuantity: null,
  unit: StockUnit.GRAMS,
  plannedStartAt: new Date('2026-06-04T08:00:00Z'),
  plannedEndAt: new Date('2026-06-04T16:00:00Z'),
  actualStartAt: null,
  actualEndAt: null,
  supervisorId: null,
  notes: 'Observación de prueba',
  lotNumber: 'LOTE-0134',
  productionDate: null,
  deliveryDate: null,
  packageWeight: '440.000',
  batchWeight: '249.200',
  committeeId: null,
  committeeNumber: null,
  createdAt: new Date('2026-06-04T08:00:00Z'),
  updatedAt: new Date('2026-06-04T08:00:00Z'),
  materials: [
    {
      id: 'mat-1',
      supplyItemId: 'supply-1',
      materialName: 'PAPA PASTUSA',
      lotNumber: null,
      requiredQuantity: '24.000',
      consumedQuantity: null,
      unit: StockUnit.GRAMS,
      sortOrder: 0,
    },
  ],
  byproducts: [],
  qualityChecks: [],
  executions: [
    {
      id: 'exec-1',
      phaseId: 'phase-1',
      phaseOrder: 1,
      phaseName: 'Cocción',
      requiresQA: false,
      workStationId: 'ws-1',
      status: PhaseExecutionStatus.READY,
      plannedMinutes: 60,
      actualMinutes: null,
      producedQuantity: null,
      qaApprovedAt: null,
      qaApprovedBy: null,
      startedAt: null,
      completedAt: null,
      operatorCount: null,
      deliveredQuantity: null,
      responsibleUserId: null,
      responsibleName: null,
      notes: null,
    },
  ],
  activeOperators: [],
};

const plantServiceMock = {
  findOrderById: jest.fn(),
};

describe('ProductionOrderPdfService', () => {
  let service: ProductionOrderPdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionOrderPdfService, { provide: PlantService, useValue: plantServiceMock }],
    }).compile();

    service = module.get(ProductionOrderPdfService);
    jest.clearAllMocks();
  });

  it('buildPdf returns a non-empty buffer containing order metadata', async () => {
    plantServiceMock.findOrderById.mockResolvedValue(orderDetail);

    const { buffer, number } = await service.buildPdf(tenantId, 'order-1');

    expect(number).toBe('2026-0134');
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('buildPdf propagates NotFoundException from plant service', async () => {
    plantServiceMock.findOrderById.mockRejectedValue(
      new NotFoundException('Production order with ID "missing" not found'),
    );

    await expect(service.buildPdf(tenantId, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('buildPdf renders optional sections when byproducts and quality checks are present', async () => {
    plantServiceMock.findOrderById.mockResolvedValue({
      ...orderDetail,
      notes: null,
      materials: [],
      byproducts: [
        {
          id: 'by-1',
          itemName: 'Cascara',
          unit: StockUnit.KILOGRAMS,
          actualQuantity: '1.500',
          lotNumber: 'LOTE-BY-1',
          expirationDate: new Date('2026-07-01T00:00:00Z'),
          sortOrder: 0,
        },
      ],
      qualityChecks: [
        {
          id: 'qc-1',
          checkName: 'Color',
          expectedValue: 'Verde',
          actualValue: 'Verde',
          texture: 'Firme',
          sortOrder: 0,
        },
      ],
    });

    const { buffer } = await service.buildPdf(tenantId, 'order-1');

    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
