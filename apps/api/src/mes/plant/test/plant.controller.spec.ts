import { OperationalRole, ProductionOrderStatus, ProductionShift, StockUnit } from '@prisma/client';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { MES_ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { PlantAuthGuard } from '../guards/plant-auth.guard';
import { PlantRolesGuard } from '../guards/plant-roles.guard';
import type { MesJwtPayload } from '../../auth/interfaces/mes-auth.interfaces';
import { NotFoundException } from '@nestjs/common';
import { PlantController } from '../controller/plant.controller';
import { CommitteeService } from '../service/committee.service';
import { IncidentService } from '../service/incident.service';
import { PhaseChainService } from '../service/phase-chain.service';
import { PlantService } from '../service/plant.service';
import { ProductionOrderPdfService } from '../service/production-order-pdf.service';
import { SupervisorService } from '../service/supervisor.service';
import { OperatorOrderRuntimeService } from '../service/operator-order-runtime.service';

const tenantId = 'palos-de-lena';

const mesUser: MesJwtPayload = {
  sub: 'op-user-1',
  cedulaHash: 'cedula-hash',
  role: OperationalRole.OWNER,
  tenantId,
  locationId: null,
};

const buildReq = (user: MesJwtPayload = mesUser) => ({ user }) as never;

const serviceMock = {
  createWorkStation: jest.fn(),
  findAllWorkStations: jest.fn(),
  updateWorkStation: jest.fn(),
  softDeleteWorkStation: jest.fn(),
  createRecipe: jest.fn(),
  findAllRecipes: jest.fn(),
  findRecipeById: jest.fn(),
  updateRecipe: jest.fn(),
  cloneRecipe: jest.fn(),
  softDeleteRecipe: jest.fn(),
  reorderPhases: jest.fn(),
  addPhaseInput: jest.fn(),
  removePhaseInput: jest.fn(),
  createOrder: jest.fn(),
  findOrders: jest.fn(),
  findOrderById: jest.fn(),
  planOrder: jest.fn(),
  pauseOrder: jest.fn(),
  resumeOrder: jest.fn(),
  cancelOrder: jest.fn(),
};

const phaseChainServiceMock = {
  qaApproveExecution: jest.fn(),
};

const incidentServiceMock = {
  createIncident: jest.fn(),
  listIncidents: jest.fn(),
  resolveIncident: jest.fn(),
};

const productionOrderPdfServiceMock = {
  buildPdf: jest.fn(),
};

const committeeServiceMock = {
  createCommittee: jest.fn(),
  listCommittees: jest.fn(),
  listEligibleMembers: jest.fn(),
  getCommitteeDetail: jest.fn(),
  updateCommittee: jest.fn(),
  closeCommittee: jest.fn(),
};

const supervisorServiceMock = {
  getOverview: jest.fn(),
  getStations: jest.fn(),
  getStationLiveDetail: jest.fn(),
};

const operatorOrderRuntimeServiceMock = {
  getOrderRecipeView: jest.fn(),
  startOrder: jest.fn(),
  pauseOrderByOperator: jest.fn(),
  resumeOrderByOperator: jest.fn(),
  completeStep: jest.fn(),
  finishOrder: jest.fn(),
};

describe('PlantController', () => {
  let controller: PlantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantController],
      providers: [
        { provide: PlantService, useValue: serviceMock },
        { provide: CommitteeService, useValue: committeeServiceMock },
        { provide: PhaseChainService, useValue: phaseChainServiceMock },
        { provide: IncidentService, useValue: incidentServiceMock },
        { provide: ProductionOrderPdfService, useValue: productionOrderPdfServiceMock },
        { provide: SupervisorService, useValue: supervisorServiceMock },
        { provide: OperatorOrderRuntimeService, useValue: operatorOrderRuntimeServiceMock },
      ],
    })
      .overrideGuard(PlantAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(PlantRolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PlantController>(PlantController);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires PlantAuthGuard at controller level (MES or platform JWT)', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, PlantController) as unknown[];
    expect(guards).toContain(PlantAuthGuard);
  });

  describe('workstations', () => {
    it('createWorkStation passes tenantId from JWT user', async () => {
      const dto = { name: 'Línea 1', code: 'LINE-01' };
      serviceMock.createWorkStation.mockResolvedValue({ id: 'ws-1', ...dto, tenantId });

      await controller.createWorkStation(buildReq(), dto);

      expect(serviceMock.createWorkStation).toHaveBeenCalledWith(tenantId, dto);
    });

    it('findAllWorkStations passes tenantId from JWT user', async () => {
      serviceMock.findAllWorkStations.mockResolvedValue([]);

      await controller.findAllWorkStations(buildReq());

      expect(serviceMock.findAllWorkStations).toHaveBeenCalledWith(tenantId);
    });

    it('updateWorkStation passes tenantId, id, and dto', async () => {
      const dto = { name: 'Updated' };
      serviceMock.updateWorkStation.mockResolvedValue({ id: 'ws-1' });

      await controller.updateWorkStation(buildReq(), 'ws-1', dto);

      expect(serviceMock.updateWorkStation).toHaveBeenCalledWith(tenantId, 'ws-1', dto);
    });

    it('softDeleteWorkStation passes tenantId and id', async () => {
      serviceMock.softDeleteWorkStation.mockResolvedValue({ id: 'ws-1', isActive: false });

      await controller.softDeleteWorkStation(buildReq(), 'ws-1');

      expect(serviceMock.softDeleteWorkStation).toHaveBeenCalledWith(tenantId, 'ws-1');
    });
  });

  describe('recipes', () => {
    const createRecipeDto = {
      name: 'Pan integral',
      categoryId: 'cat-1',
      recipeType: 'FINAL_PRODUCT' as const,
      finishedProductId: 'prod-1',
      batchSize: '10.000',
      batchUnit: StockUnit.UNIT,
      batchDisplayUnit: 'UNIT' as const,
      packageWeightGrams: 500,
      expectedYield: '10',
      expectedYieldUnit: 'porciones',
      estimatedMinutes: 60,
      operationCenter: 'PLANT' as const,
      technicalResponsible: 'CHEF' as const,
      phases: [
        {
          order: 1,
          name: 'Mezclado',
          workStationId: 'ws-1',
          standardMinutes: 15,
        },
      ],
    };

    it('createRecipe maps decimals and passes tenantId', async () => {
      serviceMock.createRecipe.mockResolvedValue({ id: 'recipe-1' });

      await controller.createRecipe(buildReq(), createRecipeDto);

      expect(serviceMock.createRecipe).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          name: createRecipeDto.name,
          batchSize: expect.any(Decimal),
          phases: [
            expect.objectContaining({
              workStationId: 'ws-1',
              standardMinutes: 15,
            }),
          ],
        }),
      );
    });

    it('findAllRecipes passes tenantId', async () => {
      serviceMock.findAllRecipes.mockResolvedValue([]);

      await controller.findAllRecipes(buildReq());

      expect(serviceMock.findAllRecipes).toHaveBeenCalledWith(tenantId);
    });

    it('reorderPhases passes tenantId, recipe id, and items', async () => {
      const items = [{ phaseId: 'phase-1', newOrder: 1 }];
      serviceMock.reorderPhases.mockResolvedValue(undefined);

      await controller.reorderPhases(buildReq(), 'recipe-1', items);

      expect(serviceMock.reorderPhases).toHaveBeenCalledWith(tenantId, 'recipe-1', items);
    });

    it('cloneRecipe passes tenantId and id', async () => {
      serviceMock.cloneRecipe.mockResolvedValue({ id: 'recipe-2' });

      await controller.cloneRecipe(buildReq(), 'recipe-1');

      expect(serviceMock.cloneRecipe).toHaveBeenCalledWith(tenantId, 'recipe-1');
    });

    it('findRecipeById passes tenantId and id', async () => {
      serviceMock.findRecipeById.mockResolvedValue({
        id: 'recipe-1',
        totalStandardMinutes: 30,
      });

      await controller.findRecipeById(buildReq(), 'recipe-1');

      expect(serviceMock.findRecipeById).toHaveBeenCalledWith(tenantId, 'recipe-1');
    });

    it('updateRecipe maps optional batchSize and passes tenantId', async () => {
      const dto = { batchSize: '12.500' };
      serviceMock.updateRecipe.mockResolvedValue({ id: 'recipe-1' });

      await controller.updateRecipe(buildReq(), 'recipe-1', dto);

      expect(serviceMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({ batchSize: expect.any(Decimal) }),
      );
    });

    it('updateRecipe maps extended recipe metadata fields', async () => {
      const dto = {
        recipeType: 'FINAL_PRODUCT' as const,
        batchDisplayUnit: 'PORTION' as const,
        packageWeightGrams: 440,
        expectedYield: '10.00',
        expectedYieldUnit: 'porciones',
        operationCenter: 'LOCATION' as const,
        locationIds: ['loc-1'],
        technicalResponsible: 'CHEF' as const,
        allergens: ['GLUTEN' as const],
      };
      serviceMock.updateRecipe.mockResolvedValue({ id: 'recipe-1' });

      await controller.updateRecipe(buildReq(), 'recipe-1', dto);

      expect(serviceMock.updateRecipe).toHaveBeenCalledWith(
        tenantId,
        'recipe-1',
        expect.objectContaining({
          recipeType: 'FINAL_PRODUCT',
          batchDisplayUnit: 'PORTION',
          packageWeightGrams: 440,
          expectedYield: expect.any(Decimal),
          expectedYieldUnit: 'porciones',
          operationCenter: 'LOCATION',
          locationIds: ['loc-1'],
          technicalResponsible: 'CHEF',
          allergens: ['GLUTEN'],
        }),
      );
    });

    it('softDeleteRecipe passes tenantId and id', async () => {
      serviceMock.softDeleteRecipe.mockResolvedValue({ id: 'recipe-1', isActive: false });

      await controller.softDeleteRecipe(buildReq(), 'recipe-1');

      expect(serviceMock.softDeleteRecipe).toHaveBeenCalledWith(tenantId, 'recipe-1');
    });
  });

  describe('phase inputs', () => {
    it('addPhaseInput maps decimals and passes tenantId and phase id', async () => {
      const dto = {
        supplyItemId: 'supply-1',
        quantityPerBatch: '1.500',
        unit: StockUnit.GRAMS,
      };
      serviceMock.addPhaseInput.mockResolvedValue({ id: 'input-1' });

      await controller.addPhaseInput(buildReq(), 'phase-1', dto);

      expect(serviceMock.addPhaseInput).toHaveBeenCalledWith(
        tenantId,
        'phase-1',
        expect.objectContaining({
          supplyItemId: 'supply-1',
          quantityPerBatch: expect.any(Decimal),
          unit: StockUnit.GRAMS,
        }),
      );
    });

    it('removePhaseInput passes tenantId, phase id, and input id', async () => {
      serviceMock.removePhaseInput.mockResolvedValue({ id: 'input-1' });

      await controller.removePhaseInput(buildReq(), 'phase-1', 'input-1');

      expect(serviceMock.removePhaseInput).toHaveBeenCalledWith(tenantId, 'phase-1', 'input-1');
    });
  });

  describe('production orders', () => {
    it('createOrder passes tenantId from JWT user', async () => {
      const dto = {
        recipeId: 'recipe-1',
        batchCount: 2,
        shift: ProductionShift.MORNING,
        plannedStartAt: '2026-05-27T08:00:00.000Z',
        plannedEndAt: '2026-05-27T12:00:00.000Z',
        committeeId: 'committee-1',
      };
      serviceMock.createOrder.mockResolvedValue({ id: 'order-1' });

      await controller.createOrder(buildReq(), dto);

      expect(serviceMock.createOrder).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          recipeId: 'recipe-1',
          batchCount: 2,
          plannedStartAt: expect.any(Date),
          plannedEndAt: expect.any(Date),
        }),
      );
    });

    it('findOrders passes tenantId and mapped filters', async () => {
      serviceMock.findOrders.mockResolvedValue([]);

      await controller.findOrders(buildReq(), {
        status: ProductionOrderStatus.DRAFT,
        shift: ProductionShift.MORNING,
      });

      expect(serviceMock.findOrders).toHaveBeenCalledWith(tenantId, {
        status: ProductionOrderStatus.DRAFT,
        shift: ProductionShift.MORNING,
        priority: undefined,
        plannedStartFrom: undefined,
        plannedStartTo: undefined,
      });
    });

    it('planOrder passes tenantId and order id', async () => {
      serviceMock.planOrder.mockResolvedValue({ id: 'order-1' });

      await controller.planOrder(buildReq(), 'order-1');

      expect(serviceMock.planOrder).toHaveBeenCalledWith(tenantId, 'order-1');
    });

    it('resumeOrder passes tenantId and order id', async () => {
      serviceMock.resumeOrder.mockResolvedValue({ id: 'order-1' });

      await controller.resumeOrder(buildReq(), 'order-1');

      expect(serviceMock.resumeOrder).toHaveBeenCalledWith(tenantId, 'order-1');
    });

    it('pauseOrder passes tenantId, order id, and dto', async () => {
      const dto = { reason: 'Mantenimiento' };
      serviceMock.pauseOrder.mockResolvedValue({ id: 'order-1' });

      await controller.pauseOrder(buildReq(), 'order-1', dto);

      expect(serviceMock.pauseOrder).toHaveBeenCalledWith(tenantId, 'order-1', dto);
    });

    it('findOrderById passes tenantId and order id', async () => {
      serviceMock.findOrderById.mockResolvedValue({ id: 'order-1' });

      await controller.findOrderById(buildReq(), 'order-1');

      expect(serviceMock.findOrderById).toHaveBeenCalledWith(tenantId, 'order-1');
    });

    it('cancelOrder passes tenantId, order id, dto, and supervisor sub', async () => {
      const dto = { reason: 'Cliente canceló', consumedInputsAction: 'SCRAP' as never };
      serviceMock.cancelOrder.mockResolvedValue({ id: 'order-1' });

      await controller.cancelOrder(buildReq(), 'order-1', dto);

      expect(serviceMock.cancelOrder).toHaveBeenCalledWith(tenantId, 'order-1', dto, mesUser.sub);
    });
  });

  describe('operator runtime (MES-11)', () => {
    it('getOrderRecipeView passes tenantId and order id', async () => {
      operatorOrderRuntimeServiceMock.getOrderRecipeView.mockResolvedValue({ orderId: 'order-1' });

      await controller.getOrderRecipeView(buildReq(), 'order-1');

      expect(operatorOrderRuntimeServiceMock.getOrderRecipeView).toHaveBeenCalledWith(
        tenantId,
        'order-1',
      );
    });

    it('startOrder passes tenantId, order id, operator sub, and dto', async () => {
      const dto = { workStationId: 'ws-1' };
      operatorOrderRuntimeServiceMock.startOrder.mockResolvedValue({ id: 'order-1' });

      await controller.startOrder(buildReq(), 'order-1', dto, 'idem-1');

      expect(operatorOrderRuntimeServiceMock.startOrder).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        { operatorUserId: mesUser.sub, idempotencyKey: 'idem-1' },
        dto,
      );
    });

    it('completeStep passes tenantId, order id, operator sub, and dto', async () => {
      const dto = { stepId: 'exec-1', actualMinutes: 5 };
      operatorOrderRuntimeServiceMock.completeStep.mockResolvedValue({ id: 'order-1' });

      await controller.completeStep(buildReq(), 'order-1', dto, 'idem-2');

      expect(operatorOrderRuntimeServiceMock.completeStep).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        { operatorUserId: mesUser.sub, idempotencyKey: 'idem-2' },
        dto,
      );
    });

    it('finishOrder passes tenantId, order id, operator sub, and dto', async () => {
      const dto = { notes: 'Listo' };
      operatorOrderRuntimeServiceMock.finishOrder.mockResolvedValue({ id: 'order-1' });

      await controller.finishOrder(buildReq(), 'order-1', dto, 'idem-3');

      expect(operatorOrderRuntimeServiceMock.finishOrder).toHaveBeenCalledWith(
        tenantId,
        'order-1',
        { operatorUserId: mesUser.sub, idempotencyKey: 'idem-3' },
        dto,
      );
    });
  });

  describe('qa approve', () => {
    it('qaApproveExecution passes tenantId, execution id, and supervisor sub', async () => {
      phaseChainServiceMock.qaApproveExecution.mockResolvedValue({
        orderId: 'order-1',
        changedExecutions: [],
      });

      await controller.qaApproveExecution(buildReq(), 'exec-1', {});

      expect(phaseChainServiceMock.qaApproveExecution).toHaveBeenCalledWith(
        tenantId,
        'exec-1',
        mesUser.sub,
        {},
      );
    });

    it('requires supervisor roles via Roles decorator', () => {
      const roles = Reflect.getMetadata(MES_ROLES_KEY, controller.qaApproveExecution);

      expect(roles).toEqual(
        expect.arrayContaining([
          OperationalRole.SUPERVISOR,
          OperationalRole.MANAGER,
          OperationalRole.OWNER,
        ]),
      );
    });
  });

  describe('incidents', () => {
    it('createIncident passes tenantId and reporter from JWT', async () => {
      const dto = {
        workStationId: 'ws-1',
        type: 'QUALITY',
        severity: 'WARNING',
        description: 'Incident report',
      };
      incidentServiceMock.createIncident.mockResolvedValue({ id: 'incident-1' });

      await controller.createIncident(buildReq(), dto as never);

      expect(incidentServiceMock.createIncident).toHaveBeenCalledWith(
        tenantId,
        mesUser.sub,
        expect.objectContaining({
          workStationId: 'ws-1',
          description: 'Incident report',
        }),
      );
    });

    it('listIncidents passes tenant filters to service', async () => {
      incidentServiceMock.listIncidents.mockResolvedValue([]);

      await controller.listIncidents(
        buildReq(),
        { workStationId: 'ws-1', resolved: false } as never,
        '25',
        '10',
      );

      expect(incidentServiceMock.listIncidents).toHaveBeenCalledWith(
        tenantId,
        {
          orderId: undefined,
          workStationId: 'ws-1',
          type: undefined,
          severity: undefined,
          resolved: false,
        },
        { limit: 25, offset: 10 },
      );
    });

    it('resolveIncident passes tenantId and resolver id', async () => {
      incidentServiceMock.resolveIncident.mockResolvedValue({ id: 'incident-1' });

      await controller.resolveIncident(buildReq(), 'incident-1', { resolution: 'Fixed' });

      expect(incidentServiceMock.resolveIncident).toHaveBeenCalledWith(
        tenantId,
        'incident-1',
        mesUser.sub,
        { resolution: 'Fixed' },
      );
    });

    it('requires supervisor roles for listIncidents', () => {
      const roles = Reflect.getMetadata(MES_ROLES_KEY, controller.listIncidents);

      expect(roles).toEqual(
        expect.arrayContaining([
          OperationalRole.SUPERVISOR,
          OperationalRole.MANAGER,
          OperationalRole.OWNER,
        ]),
      );
    });

    it('createOrderNovelty delegates to createIncident with orderId from path', async () => {
      const dto = {
        workStationId: 'ws-1',
        noveltyType: 'UNPLANNED_STOP',
        severity: 'HIGH',
        description: 'Parada no planificada',
        requiresPause: true,
        stepId: 'exec-1',
      };
      incidentServiceMock.createIncident.mockResolvedValue({ id: 'incident-1' });

      await controller.createOrderNovelty(buildReq(), 'order-42', dto as never);

      expect(incidentServiceMock.createIncident).toHaveBeenCalledWith(
        tenantId,
        mesUser.sub,
        expect.objectContaining({
          orderId: 'order-42',
          workStationId: 'ws-1',
          noveltyType: 'UNPLANNED_STOP',
          requiresPause: true,
          executionId: 'exec-1',
          type: 'OTHER',
          severity: 'CRITICAL',
        }),
      );
    });

    it('listOrderNovelties filters by orderId and resolved=false', async () => {
      incidentServiceMock.listIncidents.mockResolvedValue([]);

      await controller.listOrderNovelties(buildReq(), 'order-42', 'false');

      expect(incidentServiceMock.listIncidents).toHaveBeenCalledWith(tenantId, {
        orderId: 'order-42',
        resolved: false,
      });
    });
  });

  describe('production committees', () => {
    it('createCommittee delegates to CommitteeService with tenantId', async () => {
      committeeServiceMock.createCommittee.mockResolvedValue({
        id: 'committee-1',
        number: 'OP0001',
      });

      await controller.createCommittee(buildReq(), {
        memberUserIds: ['user-ops-1'],
      });

      expect(committeeServiceMock.createCommittee).toHaveBeenCalledWith(tenantId, {
        memberUserIds: ['user-ops-1'],
        status: undefined,
      });
    });

    it('requires supervisor roles for createCommittee', () => {
      const roles = Reflect.getMetadata(MES_ROLES_KEY, controller.createCommittee);

      expect(roles).toEqual(
        expect.arrayContaining([
          OperationalRole.SUPERVISOR,
          OperationalRole.MANAGER,
          OperationalRole.OWNER,
        ]),
      );
    });

    it('findEligibleCommitteeMembers delegates to CommitteeService', async () => {
      committeeServiceMock.listEligibleMembers.mockResolvedValue([
        { userId: 'user-1', email: 'ops@dev', roleCode: 'OPERATIONS_ADMIN' },
      ]);

      const result = await controller.findEligibleCommitteeMembers(buildReq());

      expect(committeeServiceMock.listEligibleMembers).toHaveBeenCalledWith(tenantId);
      expect(result).toHaveLength(1);
    });

    it('getCommitteeDetail propagates not found from service', async () => {
      committeeServiceMock.getCommitteeDetail.mockRejectedValue(
        new NotFoundException('Production committee with ID "missing" not found'),
      );

      await expect(controller.findCommitteeById(buildReq(), 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('route surface', () => {
    it('does not expose completePhase HTTP handler', () => {
      expect(Object.prototype.hasOwnProperty.call(PlantController.prototype, 'completePhase')).toBe(
        false,
      );
      expect('completePhase' in controller).toBe(false);
    });
  });
});
