import {
  AlarmSeverity,
  ArlRiskLevel,
  EmployeeContractType,
  IncidentType,
  PhaseExecutionStatus,
  PlantAlarmType,
  PrismaClient,
  ProductionCommitteeStatus,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
  SalaryType,
  StockUnit,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

const TENANT_ID = 'palos-de-lena';

export const PLANT_SEED_OPERATOR_ID = 'eeeeeeee-0000-0000-0000-000000000005';
export const PLANT_SEED_OPERATOR2_ID = 'eeeeeeee-0000-0000-0000-000000000006';

// Global user IDs (must match seed.ts constants)
const GLOBAL_MES_OWNER_USER_ID = '11111111-0000-0000-0000-000000000004';
const GLOBAL_MES_OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';
const GLOBAL_MES_OPERATOR2_USER_ID = '11111111-0000-0000-0000-000000000006';
const GLOBAL_MES_OPERATIONS_ADMIN_USER_ID = '11111111-0000-0000-0000-000000000007';

const RECIPE_CATEGORY_ID = 'rrrrrrrr-0000-0000-0000-000000000001';

const WS_EST01 = 'wwwwwwww-0000-0000-0000-000000000001';
const WS_EST02 = 'wwwwwwww-0000-0000-0000-000000000002';
const WS_EST03 = 'wwwwwwww-0000-0000-0000-000000000003';
const WS_EST04 = 'wwwwwwww-0000-0000-0000-000000000004';
const WS_EST05 = 'wwwwwwww-0000-0000-0000-000000000005';

const RECIPE_POLLO = 'rrrrrrrr-0000-0000-0000-000000000002';
const RECIPE_COSTILLAS = 'rrrrrrrr-0000-0000-0000-000000000003';
const RECIPE_ENSALADA = 'rrrrrrrr-0000-0000-0000-000000000004';
const RECIPE_PAPAS = 'rrrrrrrr-0000-0000-0000-000000000005';
const RECIPE_SALSAS = 'rrrrrrrr-0000-0000-0000-000000000006';

const PHASE_POLLO_1 = 'pppppppp-0000-0000-0000-000000000001';
const PHASE_POLLO_2 = 'pppppppp-0000-0000-0000-000000000002';
const PHASE_POLLO_3 = 'pppppppp-0000-0000-0000-000000000003';

const PHASE_COST_1 = 'pppppppp-0000-0000-0000-000000000004';
const PHASE_COST_2 = 'pppppppp-0000-0000-0000-000000000005';
const PHASE_COST_3 = 'pppppppp-0000-0000-0000-000000000006';
const PHASE_COST_4 = 'pppppppp-0000-0000-0000-000000000007';

const PHASE_ENS_1 = 'pppppppp-0000-0000-0000-000000000008';
const PHASE_ENS_2 = 'pppppppp-0000-0000-0000-000000000009';
const PHASE_ENS_3 = 'pppppppp-0000-0000-0000-000000000010';

const PHASE_PAPAS_1 = 'pppppppp-0000-0000-0000-000000000011';
const PHASE_PAPAS_2 = 'pppppppp-0000-0000-0000-000000000012';

const PHASE_SALSAS_1 = 'pppppppp-0000-0000-0000-000000000013';
const PHASE_SALSAS_2 = 'pppppppp-0000-0000-0000-000000000014';
const PHASE_SALSAS_3 = 'pppppppp-0000-0000-0000-000000000015';

const ORDER_012 = 'oooooooo-0000-0000-0000-000000000012';
const ORDER_013 = 'oooooooo-0000-0000-0000-000000000013';
const ORDER_014 = 'oooooooo-0000-0000-0000-000000000014';
const ORDER_015 = 'oooooooo-0000-0000-0000-000000000015';
const ORDER_016 = 'oooooooo-0000-0000-0000-000000000016';
// Demo orders for lifecycle flow
const ORDER_017 = 'oooooooo-0000-0000-0000-000000000017';
const ORDER_018 = 'oooooooo-0000-0000-0000-000000000018';

const EXEC_012_1 = 'eeeeeeee-0000-0000-0000-000000000012';
const EXEC_013_2 = 'eeeeeeee-0000-0000-0000-000000000013';
const EXEC_014_2 = 'eeeeeeee-0000-0000-0000-000000000014';
const EXEC_015_1 = 'eeeeeeee-0000-0000-0000-000000000015';
const EXEC_016_3 = 'eeeeeeee-0000-0000-0000-000000000016';

const SESSION_01 = 'ssssssss-0000-0000-0000-000000000001';
const SESSION_02A = 'ssssssss-0000-0000-0000-000000000002';
const SESSION_02B = 'ssssssss-0000-0000-0000-000000000003';
const SESSION_03 = 'ssssssss-0000-0000-0000-000000000004';
const SESSION_04 = 'ssssssss-0000-0000-0000-000000000005';
const SESSION_05 = 'ssssssss-0000-0000-0000-000000000006';
const SESSION_06 = 'ssssssss-0000-0000-0000-000000000007';

const INCIDENT_1 = 'iiiiiiii-0000-0000-0000-000000000001';
const INCIDENT_2 = 'iiiiiiii-0000-0000-0000-000000000002';
const INCIDENT_3 = 'iiiiiiii-0000-0000-0000-000000000003';
const INCIDENT_4 = 'iiiiiiii-0000-0000-0000-000000000004';

// Committee IDs
const COMMITTEE_ACTIVE = 'c0000001-0000-0000-0000-000000000001';
const COMMITTEE_DRAFT = 'c0000002-0000-0000-0000-000000000001';

// ── MES-08 QA alarm fixtures ──────────────────────────────────────────────────
const ORDER_QA_NO_OP = 'oooooooo-0000-0000-0000-000000000020';
const ORDER_QA_DELAYED = 'oooooooo-0000-0000-0000-000000000021';
const EXEC_QA_NO_OP = 'eeeeeeee-0000-0000-0000-000000000020';
const SESSION_QA_HIST = 'ssssssss-0000-0000-0000-000000000010';
// PlantAlarmDispatch IDs for dedup fixtures
const DISPATCH_QA_RECENT = 'dddddddd-0001-0000-0000-000000000001';
const DISPATCH_QA_EXPIRED = 'dddddddd-0001-0000-0000-000000000002';
const INCIDENT_QA_SAFETY = 'iiiiiiii-0000-0000-0000-000000000005';

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60_000);
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 3_600_000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

export async function seedPlantSupervisor(prisma: PrismaClient): Promise<void> {
  console.log('\n── Plant supervisor fixtures ──');

  const workstations = [
    {
      id: WS_EST01,
      code: 'EST-01',
      name: 'Dosificación y alistamiento',
      description: 'Dosificación y preparación de insumos',
      location: 'Zona A',
    },
    {
      id: WS_EST02,
      code: 'EST-02',
      name: 'Cocción',
      description: 'Procesos de cocción',
      location: 'Zona B',
    },
    {
      id: WS_EST03,
      code: 'EST-03',
      name: 'Abatimiento',
      description: 'Enfriamiento rápido y abatimiento',
      location: 'Zona C',
    },
    {
      id: WS_EST04,
      code: 'EST-04',
      name: 'Empaque',
      description: 'Sellado y empaque',
      location: 'Zona D',
    },
    {
      id: WS_EST05,
      code: 'EST-05',
      name: 'Almacén (Cuartos Fríos)',
      description: 'Almacenamiento en cuartos fríos',
      location: 'Zona E',
    },
  ] as const;

  for (const station of workstations) {
    await prisma.workStation.upsert({
      where: { id: station.id },
      update: {
        tenantId: TENANT_ID,
        code: station.code,
        name: station.name,
        description: station.description,
        location: station.location,
        isActive: true,
      },
      create: {
        id: station.id,
        tenantId: TENANT_ID,
        code: station.code,
        name: station.name,
        description: station.description,
        location: station.location,
        isActive: true,
      },
    });
    console.log('WorkStation:', station.code, station.name);
  }

  await prisma.recipeCategory.upsert({
    where: { id: RECIPE_CATEGORY_ID },
    update: { tenantId: TENANT_ID, nombre: 'Producción planta', isActive: true },
    create: {
      id: RECIPE_CATEGORY_ID,
      tenantId: TENANT_ID,
      nombre: 'Producción planta',
      descripcion: 'Receta demo supervisor',
      isActive: true,
    },
  });

  const recipes = [
    {
      id: RECIPE_POLLO,
      name: 'Pollo asado porcionado',
      batchSize: 50,
      estimatedMinutes: 90,
    },
    {
      id: RECIPE_COSTILLAS,
      name: 'Costillas BBQ',
      batchSize: 30,
      estimatedMinutes: 120,
    },
    {
      id: RECIPE_ENSALADA,
      name: 'Ensalada César',
      batchSize: 40,
      estimatedMinutes: 45,
    },
    {
      id: RECIPE_PAPAS,
      name: 'Papas fritas premium',
      batchSize: 25,
      estimatedMinutes: 35,
    },
    {
      id: RECIPE_SALSAS,
      name: 'Salsas house variedad',
      batchSize: 60,
      estimatedMinutes: 50,
    },
  ] as const;

  for (const recipe of recipes) {
    await prisma.productionRecipe.upsert({
      where: { id: recipe.id },
      update: {
        tenantId: TENANT_ID,
        categoryId: RECIPE_CATEGORY_ID,
        name: recipe.name,
        batchSize: recipe.batchSize,
        estimatedMinutes: recipe.estimatedMinutes,
        isActive: true,
      },
      create: {
        id: recipe.id,
        tenantId: TENANT_ID,
        categoryId: RECIPE_CATEGORY_ID,
        name: recipe.name,
        finishedProductId: `FP-${recipe.id.slice(-3)}`,
        batchSize: recipe.batchSize,
        batchUnit: StockUnit.KILOGRAMS,
        estimatedMinutes: recipe.estimatedMinutes,
        isActive: true,
      },
    });
    console.log('Recipe:', recipe.name);
  }

  const phases = [
    {
      id: PHASE_POLLO_1,
      recipeId: RECIPE_POLLO,
      workStationId: WS_EST01,
      order: 1,
      name: 'Recepción insumos',
      standardMinutes: 15,
    },
    {
      id: PHASE_POLLO_2,
      recipeId: RECIPE_POLLO,
      workStationId: WS_EST01,
      order: 2,
      name: 'Preparación de insumos',
      standardMinutes: 20,
    },
    {
      id: PHASE_POLLO_3,
      recipeId: RECIPE_POLLO,
      workStationId: WS_EST04,
      order: 3,
      name: 'Control calidad',
      standardMinutes: 10,
    },
    {
      id: PHASE_COST_1,
      recipeId: RECIPE_COSTILLAS,
      workStationId: WS_EST02,
      order: 1,
      name: 'Corte primario',
      standardMinutes: 20,
    },
    {
      id: PHASE_COST_2,
      recipeId: RECIPE_COSTILLAS,
      workStationId: WS_EST02,
      order: 2,
      name: 'Marinado',
      standardMinutes: 25,
    },
    {
      id: PHASE_COST_3,
      recipeId: RECIPE_COSTILLAS,
      workStationId: WS_EST03,
      order: 3,
      name: 'Parrilla',
      standardMinutes: 30,
    },
    {
      id: PHASE_COST_4,
      recipeId: RECIPE_COSTILLAS,
      workStationId: WS_EST04,
      order: 4,
      name: 'Reposado',
      standardMinutes: 15,
    },
    {
      id: PHASE_ENS_1,
      recipeId: RECIPE_ENSALADA,
      workStationId: WS_EST04,
      order: 1,
      name: 'Lavado y corte',
      standardMinutes: 12,
    },
    {
      id: PHASE_ENS_2,
      recipeId: RECIPE_ENSALADA,
      workStationId: WS_EST04,
      order: 2,
      name: 'Mezclado',
      standardMinutes: 8,
    },
    {
      id: PHASE_ENS_3,
      recipeId: RECIPE_ENSALADA,
      workStationId: WS_EST04,
      order: 3,
      name: 'Porcionado',
      standardMinutes: 10,
    },
    {
      id: PHASE_PAPAS_1,
      recipeId: RECIPE_PAPAS,
      workStationId: WS_EST05,
      order: 1,
      name: 'Corte',
      standardMinutes: 10,
    },
    {
      id: PHASE_PAPAS_2,
      recipeId: RECIPE_PAPAS,
      workStationId: WS_EST05,
      order: 2,
      name: 'Freído',
      standardMinutes: 18,
    },
    {
      id: PHASE_SALSAS_1,
      recipeId: RECIPE_SALSAS,
      workStationId: WS_EST01,
      order: 1,
      name: 'Dosificado',
      standardMinutes: 12,
    },
    {
      id: PHASE_SALSAS_2,
      recipeId: RECIPE_SALSAS,
      workStationId: WS_EST04,
      order: 2,
      name: 'Mezclado',
      standardMinutes: 15,
    },
    {
      id: PHASE_SALSAS_3,
      recipeId: RECIPE_SALSAS,
      workStationId: WS_EST04,
      order: 3,
      name: 'Etiquetado',
      standardMinutes: 10,
    },
  ] as const;

  for (const phase of phases) {
    await prisma.productionPhase.upsert({
      where: { id: phase.id },
      update: {
        tenantId: TENANT_ID,
        recipeId: phase.recipeId,
        workStationId: phase.workStationId,
        order: phase.order,
        name: phase.name,
        standardMinutes: phase.standardMinutes,
        minOperators: 1,
        maxOperators: 2,
      },
      create: {
        id: phase.id,
        tenantId: TENANT_ID,
        recipeId: phase.recipeId,
        workStationId: phase.workStationId,
        order: phase.order,
        name: phase.name,
        standardMinutes: phase.standardMinutes,
        minOperators: 1,
        maxOperators: 2,
      },
    });
  }
  console.log('Production phases:', phases.length);

  const plannedStart = minutesAgo(30);
  const plannedEnd = hoursFromNow(4);

  // ── IN_PROCESS orders (supervisor view) ──────────────────────────────────────
  const orders = [
    {
      id: ORDER_012,
      number: '000012',
      recipeId: RECIPE_POLLO,
      priority: ProductionPriority.NORMAL,
      plannedQuantity: 50,
      unit: StockUnit.KILOGRAMS,
    },
    {
      id: ORDER_013,
      number: '000013',
      recipeId: RECIPE_COSTILLAS,
      priority: ProductionPriority.HIGH,
      plannedQuantity: 30,
      unit: StockUnit.KILOGRAMS,
    },
    {
      id: ORDER_014,
      number: '000014',
      recipeId: RECIPE_ENSALADA,
      priority: ProductionPriority.NORMAL,
      plannedQuantity: 40,
      unit: StockUnit.UNIT,
    },
    {
      id: ORDER_015,
      number: '000015',
      recipeId: RECIPE_PAPAS,
      priority: ProductionPriority.HIGH,
      plannedQuantity: 25,
      unit: StockUnit.KILOGRAMS,
    },
    {
      id: ORDER_016,
      number: '000016',
      recipeId: RECIPE_SALSAS,
      priority: ProductionPriority.HIGH,
      plannedQuantity: 60,
      unit: StockUnit.UNIT,
    },
  ] as const;

  for (const order of orders) {
    await prisma.productionOrder.upsert({
      where: { id: order.id },
      update: {
        tenantId: TENANT_ID,
        number: order.number,
        recipeId: order.recipeId,
        recipeVersion: 1,
        status: ProductionOrderStatus.IN_PROCESS,
        priority: order.priority,
        shift: ProductionShift.MORNING,
        batchCount: 1,
        plannedQuantity: order.plannedQuantity,
        unit: order.unit,
        plannedStartAt: plannedStart,
        plannedEndAt: plannedEnd,
        actualStartAt: minutesAgo(25),
      },
      create: {
        id: order.id,
        tenantId: TENANT_ID,
        number: order.number,
        recipeId: order.recipeId,
        recipeVersion: 1,
        status: ProductionOrderStatus.IN_PROCESS,
        priority: order.priority,
        shift: ProductionShift.MORNING,
        batchCount: 1,
        plannedQuantity: order.plannedQuantity,
        unit: order.unit,
        plannedStartAt: plannedStart,
        plannedEndAt: plannedEnd,
        actualStartAt: minutesAgo(25),
      },
    });
    console.log('ProductionOrder (IN_PROCESS): OP-' + order.number);
  }

  // ── Demo orders for lifecycle flow (section 06 Postman) ─────────────────────
  await prisma.productionOrder.upsert({
    where: { id: ORDER_017 },
    update: {
      tenantId: TENANT_ID,
      number: '000017',
      recipeId: RECIPE_POLLO,
      recipeVersion: 1,
      status: ProductionOrderStatus.DRAFT,
      priority: ProductionPriority.NORMAL,
      shift: ProductionShift.MORNING,
      batchCount: 1,
      plannedQuantity: 20,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: daysFromNow(1),
      plannedEndAt: daysFromNow(1),
    },
    create: {
      id: ORDER_017,
      tenantId: TENANT_ID,
      number: '000017',
      recipeId: RECIPE_POLLO,
      recipeVersion: 1,
      status: ProductionOrderStatus.DRAFT,
      priority: ProductionPriority.NORMAL,
      shift: ProductionShift.MORNING,
      batchCount: 1,
      plannedQuantity: 20,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: daysFromNow(1),
      plannedEndAt: daysFromNow(1),
    },
  });
  console.log('ProductionOrder (DRAFT): OP-000017');

  await prisma.productionOrder.upsert({
    where: { id: ORDER_018 },
    update: {
      tenantId: TENANT_ID,
      number: '000018',
      recipeId: RECIPE_COSTILLAS,
      recipeVersion: 1,
      status: ProductionOrderStatus.PLANNED,
      priority: ProductionPriority.HIGH,
      shift: ProductionShift.AFTERNOON,
      batchCount: 2,
      plannedQuantity: 60,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: daysFromNow(1),
      plannedEndAt: daysFromNow(1),
    },
    create: {
      id: ORDER_018,
      tenantId: TENANT_ID,
      number: '000018',
      recipeId: RECIPE_COSTILLAS,
      recipeVersion: 1,
      status: ProductionOrderStatus.PLANNED,
      priority: ProductionPriority.HIGH,
      shift: ProductionShift.AFTERNOON,
      batchCount: 2,
      plannedQuantity: 60,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: daysFromNow(1),
      plannedEndAt: daysFromNow(1),
    },
  });
  console.log('ProductionOrder (PLANNED): OP-000018');

  const executions = [
    {
      id: EXEC_012_1,
      orderId: ORDER_012,
      phaseId: PHASE_POLLO_1,
      workStationId: WS_EST01,
      plannedMinutes: 15,
      startedAt: minutesAgo(9.8),
      efficiencyPct: 65,
    },
    {
      id: EXEC_013_2,
      orderId: ORDER_013,
      phaseId: PHASE_COST_2,
      workStationId: WS_EST02,
      plannedMinutes: 25,
      startedAt: minutesAgo(14.8),
      efficiencyPct: 99,
    },
    {
      id: EXEC_014_2,
      orderId: ORDER_014,
      phaseId: PHASE_ENS_2,
      workStationId: WS_EST04,
      plannedMinutes: 8,
      startedAt: minutesAgo(8.2),
      efficiencyPct: 55,
    },
    {
      id: EXEC_015_1,
      orderId: ORDER_015,
      phaseId: PHASE_PAPAS_1,
      workStationId: WS_EST05,
      plannedMinutes: 10,
      startedAt: minutesAgo(17.9),
      efficiencyPct: 120,
    },
    {
      id: EXEC_016_3,
      orderId: ORDER_016,
      phaseId: PHASE_SALSAS_3,
      workStationId: WS_EST04,
      plannedMinutes: 10,
      startedAt: minutesAgo(10),
      efficiencyPct: 67,
    },
  ] as const;

  for (const execution of executions) {
    await prisma.phaseExecution.upsert({
      where: { id: execution.id },
      update: {
        tenantId: TENANT_ID,
        orderId: execution.orderId,
        phaseId: execution.phaseId,
        workStationId: execution.workStationId,
        status: PhaseExecutionStatus.IN_PROCESS,
        plannedMinutes: execution.plannedMinutes,
        startedAt: execution.startedAt,
        efficiencyPct: execution.efficiencyPct,
        operatorCount: 1,
      },
      create: {
        id: execution.id,
        tenantId: TENANT_ID,
        orderId: execution.orderId,
        phaseId: execution.phaseId,
        workStationId: execution.workStationId,
        status: PhaseExecutionStatus.IN_PROCESS,
        plannedMinutes: execution.plannedMinutes,
        startedAt: execution.startedAt,
        efficiencyPct: execution.efficiencyPct,
        operatorCount: 1,
      },
    });
  }

  // Parrilla Central — fase crítica de costillas (misma OP que EST-02, fase 3)
  const execEst03 = 'eeeeeeee-0000-0000-0000-000000000017';
  await prisma.phaseExecution.upsert({
    where: { id: execEst03 },
    update: {
      tenantId: TENANT_ID,
      orderId: ORDER_013,
      phaseId: PHASE_COST_3,
      workStationId: WS_EST03,
      status: PhaseExecutionStatus.IN_PROCESS,
      plannedMinutes: 30,
      startedAt: minutesAgo(17.9),
      efficiencyPct: 120,
      operatorCount: 1,
    },
    create: {
      id: execEst03,
      tenantId: TENANT_ID,
      orderId: ORDER_013,
      phaseId: PHASE_COST_3,
      workStationId: WS_EST03,
      status: PhaseExecutionStatus.IN_PROCESS,
      plannedMinutes: 30,
      startedAt: minutesAgo(17.9),
      efficiencyPct: 120,
      operatorCount: 1,
    },
  });

  await prisma.operatorSession.upsert({
    where: { id: SESSION_01 },
    update: {
      tenantId: TENANT_ID,
      workStationId: WS_EST01,
      operatorUserId: PLANT_SEED_OPERATOR2_ID,
      phaseExecutionId: EXEC_012_1,
      startedAt: minutesAgo(47.5),
      endedAt: null,
    },
    create: {
      id: SESSION_01,
      tenantId: TENANT_ID,
      workStationId: WS_EST01,
      operatorUserId: PLANT_SEED_OPERATOR2_ID,
      phaseExecutionId: EXEC_012_1,
      startedAt: minutesAgo(47.5),
    },
  });

  await prisma.operatorSession.upsert({
    where: { id: SESSION_02A },
    update: {
      tenantId: TENANT_ID,
      workStationId: WS_EST02,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      phaseExecutionId: EXEC_013_2,
      startedAt: minutesAgo(40),
      endedAt: null,
    },
    create: {
      id: SESSION_02A,
      tenantId: TENANT_ID,
      workStationId: WS_EST02,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      phaseExecutionId: EXEC_013_2,
      startedAt: minutesAgo(40),
    },
  });

  await prisma.operatorSession.upsert({
    where: { id: SESSION_02B },
    update: {
      tenantId: TENANT_ID,
      workStationId: WS_EST02,
      operatorUserId: PLANT_SEED_OPERATOR2_ID,
      phaseExecutionId: EXEC_013_2,
      startedAt: minutesAgo(38),
      endedAt: null,
    },
    create: {
      id: SESSION_02B,
      tenantId: TENANT_ID,
      workStationId: WS_EST02,
      operatorUserId: PLANT_SEED_OPERATOR2_ID,
      phaseExecutionId: EXEC_013_2,
      startedAt: minutesAgo(38),
    },
  });

  const extraSessions = [
    {
      id: SESSION_03,
      workStationId: WS_EST03,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      phaseExecutionId: execEst03,
      startedAt: minutesAgo(35),
    },
    {
      id: SESSION_04,
      workStationId: WS_EST04,
      operatorUserId: PLANT_SEED_OPERATOR2_ID,
      phaseExecutionId: EXEC_014_2,
      startedAt: minutesAgo(28),
    },
    {
      id: SESSION_05,
      workStationId: WS_EST05,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      phaseExecutionId: EXEC_015_1,
      startedAt: minutesAgo(42),
    },
    {
      id: SESSION_06,
      workStationId: WS_EST04,
      operatorUserId: PLANT_SEED_OPERATOR2_ID,
      phaseExecutionId: EXEC_016_3,
      startedAt: minutesAgo(31),
    },
  ] as const;

  for (const session of extraSessions) {
    await prisma.operatorSession.upsert({
      where: { id: session.id },
      update: {
        tenantId: TENANT_ID,
        workStationId: session.workStationId,
        operatorUserId: session.operatorUserId,
        phaseExecutionId: session.phaseExecutionId,
        startedAt: session.startedAt,
        endedAt: null,
      },
      create: {
        id: session.id,
        tenantId: TENANT_ID,
        workStationId: session.workStationId,
        operatorUserId: session.operatorUserId,
        phaseExecutionId: session.phaseExecutionId,
        startedAt: session.startedAt,
      },
    });
  }

  const incidents: Array<{
    id: string;
    workStationId: string;
    orderId: string;
    executionId: string;
    type: IncidentType;
    severity: AlarmSeverity;
    description: string;
    createdAt: Date;
    resolvedAt?: Date;
  }> = [
    {
      id: INCIDENT_1,
      workStationId: WS_EST03,
      orderId: ORDER_013,
      executionId: execEst03,
      type: IncidentType.EQUIPMENT,
      severity: AlarmSeverity.CRITICAL,
      description: 'Temperatura parrilla excedida',
      createdAt: minutesAgo(2),
    },
    {
      id: INCIDENT_2,
      workStationId: WS_EST05,
      orderId: ORDER_015,
      executionId: EXEC_015_1,
      type: IncidentType.OTHER,
      severity: AlarmSeverity.WARNING,
      description: 'Tiempo de fase excedido',
      createdAt: minutesAgo(5),
    },
    {
      id: INCIDENT_3,
      workStationId: WS_EST04,
      orderId: ORDER_014,
      executionId: EXEC_014_2,
      type: IncidentType.OTHER,
      severity: AlarmSeverity.INFO,
      description: 'Operario sin asignar',
      createdAt: minutesAgo(12),
    },
    {
      id: INCIDENT_4,
      workStationId: WS_EST02,
      orderId: ORDER_013,
      executionId: EXEC_013_2,
      type: IncidentType.QUALITY,
      severity: AlarmSeverity.WARNING,
      description: 'Desviación en porcionado',
      createdAt: minutesAgo(20),
      resolvedAt: minutesAgo(5),
    },
  ];

  for (const incident of incidents) {
    await prisma.productionIncident.upsert({
      where: { id: incident.id },
      update: {
        tenantId: TENANT_ID,
        workStationId: incident.workStationId,
        orderId: incident.orderId,
        executionId: incident.executionId,
        operatorUserId: PLANT_SEED_OPERATOR_ID,
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt ?? null,
      },
      create: {
        id: incident.id,
        tenantId: TENANT_ID,
        workStationId: incident.workStationId,
        orderId: incident.orderId,
        executionId: incident.executionId,
        operatorUserId: PLANT_SEED_OPERATOR_ID,
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt ?? null,
      },
    });
  }

  // ── Committees (plan.committees.manage / OPERATIONS_ADMIN flow) ──────────────
  await prisma.productionCommittee.upsert({
    where: { id: COMMITTEE_ACTIVE },
    update: {
      tenantId: TENANT_ID,
      number: 'COM-001',
      status: ProductionCommitteeStatus.ACTIVE,
      ordersCount: 3,
    },
    create: {
      id: COMMITTEE_ACTIVE,
      tenantId: TENANT_ID,
      number: 'COM-001',
      status: ProductionCommitteeStatus.ACTIVE,
      ordersCount: 3,
    },
  });
  console.log('Committee ACTIVE: COM-001');

  await prisma.productionCommittee.upsert({
    where: { id: COMMITTEE_DRAFT },
    update: {
      tenantId: TENANT_ID,
      number: 'COM-002',
      status: ProductionCommitteeStatus.DRAFT,
      ordersCount: 0,
    },
    create: {
      id: COMMITTEE_DRAFT,
      tenantId: TENANT_ID,
      number: 'COM-002',
      status: ProductionCommitteeStatus.DRAFT,
      ordersCount: 0,
    },
  });
  console.log('Committee DRAFT: COM-002');

  // Committee members
  const committeeMembers = [
    { committeeId: COMMITTEE_ACTIVE, userId: GLOBAL_MES_OWNER_USER_ID },
    { committeeId: COMMITTEE_ACTIVE, userId: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID },
    { committeeId: COMMITTEE_ACTIVE, userId: GLOBAL_MES_OPERATOR2_USER_ID },
    { committeeId: COMMITTEE_DRAFT, userId: GLOBAL_MES_OWNER_USER_ID },
    { committeeId: COMMITTEE_DRAFT, userId: GLOBAL_MES_OPERATOR_USER_ID },
  ];

  for (const member of committeeMembers) {
    await prisma.productionCommitteeMember.upsert({
      where: {
        committeeId_userId: {
          committeeId: member.committeeId,
          userId: member.userId,
        },
      },
      update: {},
      create: {
        committeeId: member.committeeId,
        userId: member.userId,
      },
    });
  }
  console.log('CommitteeMembers: seeded', committeeMembers.length, 'memberships');

  // ── Employee details for operator2 and operations_admin ──────────────────────
  const firstLocation = await prisma.location.findFirst({
    where: { tenantId: TENANT_ID, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  const locationId = firstLocation!.id;

  // NOM-03: pinHash para kiosko de asistencia (distinto de OperationalUser.pinHash del MES)
  const operator2PinHashEmployee = await bcrypt.hash('4321', SALT_ROUNDS);
  const opsAdminPinHashEmployee = await bcrypt.hash('5678', SALT_ROUNDS);

  await prisma.employeeDetails.upsert({
    where: { userId: GLOBAL_MES_OPERATOR2_USER_ID },
    update: { isActive: true, pinHash: operator2PinHashEmployee, name: 'Carlos Mendoza' },
    create: {
      userId: GLOBAL_MES_OPERATOR2_USER_ID,
      tenantId: TENANT_ID,
      name: 'Carlos Mendoza',
      locationId,
      position: 'Operario Senior',
      area: 'Producción',
      department: 'Parrilla',
      contractType: EmployeeContractType.INDEFINIDO,
      hireDate: new Date('2023-06-01'),
      contractStart: new Date('2023-06-01'),
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: 2200000.0,
      hasTransportSubsidy: true,
      isExemptFromTax: false,
      epsName: 'Nueva EPS',
      pensionFundName: 'Colfondos',
      cesantiasFundName: 'Colfondos',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_II,
      cajaCompensacion: 'Comfama',
      pinHash: operator2PinHashEmployee,
      isActive: true,
    },
  });

  await prisma.employeeDetails.upsert({
    where: { userId: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID },
    update: { isActive: true, pinHash: opsAdminPinHashEmployee, name: 'Admin de Operaciones' },
    create: {
      userId: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID,
      tenantId: TENANT_ID,
      name: 'Admin de Operaciones',
      locationId,
      position: 'Administrador de Operaciones',
      area: 'Operaciones',
      department: 'Planeación',
      contractType: EmployeeContractType.INDEFINIDO,
      hireDate: new Date('2022-03-15'),
      contractStart: new Date('2022-03-15'),
      salaryType: SalaryType.INTEGRAL,
      salaryAmount: 8000000.0,
      hasTransportSubsidy: false,
      isExemptFromTax: false,
      epsName: 'Sura',
      pensionFundName: 'Protección',
      cesantiasFundName: 'Protección',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_I,
      cajaCompensacion: 'Comfama',
      pinHash: opsAdminPinHashEmployee,
      isActive: true,
    },
  });
  console.log('EmployeeDetails: seeded for operator2 and operations_admin');

  console.log(
    '✅ Plant supervisor seed: 5 estaciones, 5 recetas, 7 órdenes (5 IN_PROCESS + 1 DRAFT + 1 PLANNED), 2 comités, 4 incidentes',
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // MES-08 QA alarm fixtures
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n── MES-08 QA alarm fixtures ──');

  // Fetch PL-01 locationId for incidents (created by seedLocations in seed.ts)
  const pl01Location = await prisma.location.findFirst({
    where: { tenantId: TENANT_ID, code: 'PL-01' },
    select: { id: true },
  });
  const pl01Id = pl01Location?.id ?? null;

  // ── Fixture A: FASE_SIN_OPERARIO ─────────────────────────────────────────────
  //
  // ProductionOrder dedicated for QA — plannedEndAt 4h ahead so OP_RETRASADA
  // does NOT fire for this order.
  await prisma.productionOrder.upsert({
    where: { id: ORDER_QA_NO_OP },
    update: {
      tenantId: TENANT_ID,
      number: 'ALARM-NO-OP',
      recipeId: RECIPE_COSTILLAS,
      recipeVersion: 1,
      status: ProductionOrderStatus.IN_PROCESS,
      priority: ProductionPriority.NORMAL,
      shift: ProductionShift.MORNING,
      batchCount: 1,
      plannedQuantity: 10,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: minutesAgo(30),
      plannedEndAt: hoursFromNow(4),
      actualStartAt: minutesAgo(25),
    },
    create: {
      id: ORDER_QA_NO_OP,
      tenantId: TENANT_ID,
      number: 'ALARM-NO-OP',
      recipeId: RECIPE_COSTILLAS,
      recipeVersion: 1,
      status: ProductionOrderStatus.IN_PROCESS,
      priority: ProductionPriority.NORMAL,
      shift: ProductionShift.MORNING,
      batchCount: 1,
      plannedQuantity: 10,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: minutesAgo(30),
      plannedEndAt: hoursFromNow(4),
      actualStartAt: minutesAgo(25),
    },
  });

  // PhaseExecution without an active session.
  // phase = PHASE_COST_3 (standardMinutes=30 → threshold=36min)
  // startedAt = minutesAgo(20) → elapsed 20min < 36min → TIEMPO_EXCEDIDO does NOT fire.
  // No active OperatorSession (endedAt IS NULL) → activeSessionStartedAt = null → FASE_SIN_OPERARIO fires.
  await prisma.phaseExecution.upsert({
    where: { id: EXEC_QA_NO_OP },
    update: {
      tenantId: TENANT_ID,
      orderId: ORDER_QA_NO_OP,
      phaseId: PHASE_COST_3,
      workStationId: WS_EST03,
      status: PhaseExecutionStatus.IN_PROCESS,
      plannedMinutes: 30,
      startedAt: minutesAgo(20),
    },
    create: {
      id: EXEC_QA_NO_OP,
      tenantId: TENANT_ID,
      orderId: ORDER_QA_NO_OP,
      phaseId: PHASE_COST_3,
      workStationId: WS_EST03,
      status: PhaseExecutionStatus.IN_PROCESS,
      plannedMinutes: 30,
      startedAt: minutesAgo(20),
    },
  });

  // Historical (closed) session — simulates operator who left 3 minutes ago.
  // endedAt IS NOT NULL → alarm repository's `where: { endedAt: null }` filter
  // excludes it → activeSessionStartedAt = null → FASE_SIN_OPERARIO condition met.
  await prisma.operatorSession.upsert({
    where: { id: SESSION_QA_HIST },
    update: {
      tenantId: TENANT_ID,
      workStationId: WS_EST03,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      phaseExecutionId: EXEC_QA_NO_OP,
      startedAt: minutesAgo(30),
      endedAt: minutesAgo(3),
    },
    create: {
      id: SESSION_QA_HIST,
      tenantId: TENANT_ID,
      workStationId: WS_EST03,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      phaseExecutionId: EXEC_QA_NO_OP,
      startedAt: minutesAgo(30),
      endedAt: minutesAgo(3),
    },
  });
  console.log(
    'Fixture A (FASE_SIN_OPERARIO): ORDER ALARM-NO-OP — EXEC_QA_NO_OP (sin sesión activa, startedAt −20min)',
  );

  // ── Fixture B: OP_RETRASADA ───────────────────────────────────────────────────
  //
  // plannedEndAt = now + 15min → within the 30min alarm window →
  // findDelayedOrdersForAlarmScan returns this order → OP_RETRASADA fires.
  // After 15min it changes to "superó la fecha planificada".
  // Re-running the seed resets plannedEndAt to now+15min (idempotent refresh).
  await prisma.productionOrder.upsert({
    where: { id: ORDER_QA_DELAYED },
    update: {
      tenantId: TENANT_ID,
      number: 'ALARM-DELAYED',
      recipeId: RECIPE_PAPAS,
      recipeVersion: 1,
      status: ProductionOrderStatus.IN_PROCESS,
      priority: ProductionPriority.HIGH,
      shift: ProductionShift.MORNING,
      batchCount: 1,
      plannedQuantity: 15,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: minutesAgo(60),
      plannedEndAt: minutesFromNow(15),
      actualStartAt: minutesAgo(55),
    },
    create: {
      id: ORDER_QA_DELAYED,
      tenantId: TENANT_ID,
      number: 'ALARM-DELAYED',
      recipeId: RECIPE_PAPAS,
      recipeVersion: 1,
      status: ProductionOrderStatus.IN_PROCESS,
      priority: ProductionPriority.HIGH,
      shift: ProductionShift.MORNING,
      batchCount: 1,
      plannedQuantity: 15,
      unit: StockUnit.KILOGRAMS,
      plannedStartAt: minutesAgo(60),
      plannedEndAt: minutesFromNow(15),
      actualStartAt: minutesAgo(55),
    },
  });
  console.log('Fixture B (OP_RETRASADA): ORDER ALARM-DELAYED — plannedEndAt = now +15min');

  // ── Fixture C: Deduplicación ──────────────────────────────────────────────────
  //
  // Recent dispatch (−10min, inside 30min window) for EXEC_015_1:
  //   findRecentDispatch finds this → cron BLOCKS a new dispatch → QA verifies
  //   that plant_alarm_dispatches does NOT get a second row for EXEC_015_1.
  await prisma.plantAlarmDispatch.upsert({
    where: { id: DISPATCH_QA_RECENT },
    update: {
      tenantId: TENANT_ID,
      alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
      executionId: EXEC_015_1,
      orderId: ORDER_015,
      severity: AlarmSeverity.WARNING,
      message: '[QA dedup] TIEMPO_EXCEDIDO reciente — debe ser bloqueado por el cron',
      dispatchedAt: minutesAgo(10),
    },
    create: {
      id: DISPATCH_QA_RECENT,
      tenantId: TENANT_ID,
      alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
      executionId: EXEC_015_1,
      orderId: ORDER_015,
      severity: AlarmSeverity.WARNING,
      message: '[QA dedup] TIEMPO_EXCEDIDO reciente — debe ser bloqueado por el cron',
      dispatchedAt: minutesAgo(10),
    },
  });

  // Expired dispatch (−35min, outside 30min window) for EXEC_014_2:
  //   findRecentDispatch does NOT find it (dispatchedAt < since) → cron ALLOWS
  //   a new dispatch when EXEC_014_2 crosses its threshold (≈2min after seed).
  await prisma.plantAlarmDispatch.upsert({
    where: { id: DISPATCH_QA_EXPIRED },
    update: {
      tenantId: TENANT_ID,
      alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
      executionId: EXEC_014_2,
      orderId: ORDER_014,
      severity: AlarmSeverity.WARNING,
      message: '[QA dedup] TIEMPO_EXCEDIDO expirado — debe generar nuevo dispatch',
      dispatchedAt: minutesAgo(35),
    },
    create: {
      id: DISPATCH_QA_EXPIRED,
      tenantId: TENANT_ID,
      alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
      executionId: EXEC_014_2,
      orderId: ORDER_014,
      severity: AlarmSeverity.WARNING,
      message: '[QA dedup] TIEMPO_EXCEDIDO expirado — debe generar nuevo dispatch',
      dispatchedAt: minutesAgo(35),
    },
  });
  console.log(
    'Fixture C (dedup): EXEC_015_1 dispatch −10min (bloqueado) | EXEC_014_2 dispatch −35min (permitido)',
  );

  // ── Fixture D + E: Incidente SAFETY con locationId ───────────────────────────
  //
  // Covers D (type SAFETY — único tipo no seeded hasta ahora) y
  // E (locationId poblado con PL-01 — todos los incidentes anteriores tienen locationId=null).
  await prisma.productionIncident.upsert({
    where: { id: INCIDENT_QA_SAFETY },
    update: {
      tenantId: TENANT_ID,
      workStationId: WS_EST02,
      orderId: ORDER_013,
      executionId: EXEC_013_2,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      locationId: pl01Id,
      type: IncidentType.SAFETY,
      severity: AlarmSeverity.CRITICAL,
      description: 'Incidente de seguridad — QA MES-08',
      createdAt: minutesAgo(7),
      resolvedAt: null,
    },
    create: {
      id: INCIDENT_QA_SAFETY,
      tenantId: TENANT_ID,
      workStationId: WS_EST02,
      orderId: ORDER_013,
      executionId: EXEC_013_2,
      operatorUserId: PLANT_SEED_OPERATOR_ID,
      locationId: pl01Id,
      type: IncidentType.SAFETY,
      severity: AlarmSeverity.CRITICAL,
      description: 'Incidente de seguridad — QA MES-08',
      createdAt: minutesAgo(7),
      resolvedAt: null,
    },
  });
  console.log(
    `Fixture D+E (SAFETY incident, locationId=${pl01Id ?? 'null — PL-01 not found'}): INCIDENT_QA_SAFETY`,
  );

  console.log('\n✅ MES-08 alarm fixtures:');
  console.log(
    '  FASE_SIN_OPERARIO : ORDER ALARM-NO-OP  — EXEC_QA_NO_OP (sin sesión activa, startedAt −20min)',
  );
  console.log('  OP_RETRASADA      : ORDER ALARM-DELAYED — plannedEndAt = now +15min');
  console.log('  Dedup reciente    : EXEC_015_1 dispatch −10min → cron bloqueado');
  console.log('  Dedup expirado    : EXEC_014_2 dispatch −35min → cron permitido');
  console.log(
    `  Incidente SAFETY  : INCIDENT_QA_SAFETY (CRITICAL, locationId=${pl01Id ?? 'null'})`,
  );
}
