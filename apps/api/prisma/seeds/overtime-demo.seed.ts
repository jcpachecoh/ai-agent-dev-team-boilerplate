import {
  ArlRiskLevel,
  AttendanceEventType,
  AttendanceShift,
  CostCenter,
  DocumentType,
  EmployeeContractType,
  LaborClassification,
  OvertimeApprovalDecision,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
  PrismaClient,
  SalaryType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { getTodayWorkDate } from './attendance.seed';

const TENANT_ID = 'palos-de-lena';
const SALT_ROUNDS = 12;
const SEED_NOTES = 'overtime-demo-seed';

const ROLE_MANAGER_ID = 'aaaaaaaa-0000-0000-0000-000000000003';

const GLOBAL_MES_MANAGER_USER_ID = '11111111-0000-0000-0000-000000000011';
const GLOBAL_MES_OPERATIONS_ADMIN_USER_ID = '11111111-0000-0000-0000-000000000007';
const GLOBAL_MES_OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';
const GLOBAL_MES_OPERATOR2_USER_ID = '11111111-0000-0000-0000-000000000006';
const GLOBAL_MES_SUPERVISOR_USER_ID = '11111111-0000-0000-0000-000000000010';
const GLOBAL_OVERTIME_GG_USER_ID = '11111111-0000-0000-0000-000000000012';

const REQUEST_IDS = {
  pendingAdmin: 'ffffffff-0000-0000-0000-000000000201',
  pendingOps: 'ffffffff-0000-0000-0000-000000000202',
  pendingGg: 'ffffffff-0000-0000-0000-000000000203',
  approved: 'ffffffff-0000-0000-0000-000000000204',
  objected: 'ffffffff-0000-0000-0000-000000000205',
} as const;

function payrollPeriodFromWorkDate(workDate: Date): string {
  return workDate.toISOString().slice(0, 7);
}

function shiftTimes(
  workDate: Date,
  excessMinutes: number,
): { shiftEndTime: Date; actualEndTime: Date } {
  const shiftEndTime = new Date(workDate.getTime() + 22 * 3600_000);
  const actualEndTime = new Date(shiftEndTime.getTime() + excessMinutes * 60_000);
  return { shiftEndTime, actualEndTime };
}

async function seedOvertimeGerenteGeneralUser(
  prisma: PrismaClient,
  locationId: string,
  passwordHash: string,
): Promise<void> {
  await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: TENANT_ID, cedula: '33445566' },
    },
    update: {
      email: 'overtime-gg@palos-de-lena.dev',
      passwordHash,
      roleId: ROLE_MANAGER_ID,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_OVERTIME_GG_USER_ID,
      tenantId: TENANT_ID,
      cedula: '33445566',
      documentType: DocumentType.CC,
      email: 'overtime-gg@palos-de-lena.dev',
      passwordHash,
      roleId: ROLE_MANAGER_ID,
      isActive: true,
      emailVerified: true,
    },
  });

  const position = await prisma.employeePosition.findUniqueOrThrow({
    where: { id: 'pos-pdl-007' },
  });

  await prisma.employeeDetails.upsert({
    where: { userId: GLOBAL_OVERTIME_GG_USER_ID },
    update: {
      isActive: true,
      name: 'Laura Vargas',
      positionId: position.id,
      position: position.title,
      area: position.area,
    },
    create: {
      userId: GLOBAL_OVERTIME_GG_USER_ID,
      tenantId: TENANT_ID,
      name: 'Laura Vargas',
      locationId,
      positionId: position.id,
      position: position.title,
      area: position.area,
      department: position.area,
      contractType: EmployeeContractType.INDEFINIDO,
      hireDate: new Date('2024-01-15'),
      contractStart: new Date('2024-01-15'),
      salaryType: SalaryType.INTEGRAL,
      salaryAmount: position.baseSalaryRange,
      epsName: 'EPS Sura',
      pensionFundName: 'Protección',
      cesantiasFundName: 'Protección',
      arlName: 'ARL Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_I,
      cajaCompensacion: 'Comfama',
      costCenter: CostCenter.GERENCIA,
      laborClassification: LaborClassification.ADMINISTRATIVO,
      isActive: true,
    },
  });

  const locations = await prisma.location.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    select: { id: true },
  });

  for (const location of locations) {
    await prisma.userLocation.upsert({
      where: {
        userId_locationId: { userId: GLOBAL_OVERTIME_GG_USER_ID, locationId: location.id },
      },
      update: { tenantId: TENANT_ID },
      create: {
        userId: GLOBAL_OVERTIME_GG_USER_ID,
        locationId: location.id,
        tenantId: TENANT_ID,
      },
    });
  }
}

async function configureOvertimeApprovers(
  prisma: PrismaClient,
  pl01LocationId: string,
  passwordHash: string,
): Promise<void> {
  const adminPosition = await prisma.employeePosition.findUniqueOrThrow({
    where: { id: 'pos-pdl-001' },
  });
  const opsPosition = await prisma.employeePosition.findUniqueOrThrow({
    where: { id: 'pos-pdl-003' },
  });

  await prisma.employeeDetails.update({
    where: { userId: GLOBAL_MES_MANAGER_USER_ID },
    data: {
      positionId: adminPosition.id,
      position: adminPosition.title,
      area: adminPosition.area,
      name: 'Diego Torres (Administrador)',
    },
  });

  await prisma.userLocation.upsert({
    where: {
      userId_locationId: {
        userId: GLOBAL_MES_MANAGER_USER_ID,
        locationId: pl01LocationId,
      },
    },
    update: { tenantId: TENANT_ID },
    create: {
      userId: GLOBAL_MES_MANAGER_USER_ID,
      locationId: pl01LocationId,
      tenantId: TENANT_ID,
    },
  });

  await prisma.employeeDetails.update({
    where: { userId: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID },
    data: {
      positionId: opsPosition.id,
      position: opsPosition.title,
      area: opsPosition.area,
    },
  });

  await seedOvertimeGerenteGeneralUser(prisma, pl01LocationId, passwordHash);
}

async function upsertApprovalRow(
  prisma: PrismaClient,
  id: string,
  overtimeRequestId: string,
  level: OvertimeApprovalLevel,
  data: {
    approverId?: string | null;
    decision?: OvertimeApprovalDecision | null;
    decidedAt?: Date | null;
    comment?: string | null;
  },
): Promise<void> {
  await prisma.overtimeApproval.upsert({
    where: {
      overtimeRequestId_level: { overtimeRequestId, level },
    },
    update: {
      approverId: data.approverId ?? null,
      decision: data.decision ?? null,
      decidedAt: data.decidedAt ?? null,
      comment: data.comment ?? null,
    },
    create: {
      id,
      tenantId: TENANT_ID,
      overtimeRequestId,
      level,
      approverId: data.approverId ?? null,
      decision: data.decision ?? null,
      decidedAt: data.decidedAt ?? null,
      comment: data.comment ?? null,
    },
  });
}

async function seedOvertimeRequests(
  prisma: PrismaClient,
  locationId: string,
  payrollPeriod: string,
  workDate: Date,
): Promise<void> {
  const employees = await prisma.employeeDetails.findMany({
    where: {
      tenantId: TENANT_ID,
      userId: {
        in: [
          GLOBAL_MES_OPERATOR_USER_ID,
          GLOBAL_MES_OPERATOR2_USER_ID,
          GLOBAL_MES_OPERATIONS_ADMIN_USER_ID,
          GLOBAL_MES_SUPERVISOR_USER_ID,
          GLOBAL_MES_MANAGER_USER_ID,
        ],
      },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, userId: true, name: true },
  });

  const byUserId = new Map(employees.map((row) => [row.userId, row]));
  const operator = byUserId.get(GLOBAL_MES_OPERATOR_USER_ID);
  const operator2 = byUserId.get(GLOBAL_MES_OPERATOR2_USER_ID);
  const opsAdmin = byUserId.get(GLOBAL_MES_OPERATIONS_ADMIN_USER_ID);
  const supervisor = byUserId.get(GLOBAL_MES_SUPERVISOR_USER_ID);
  const manager = byUserId.get(GLOBAL_MES_MANAGER_USER_ID);

  if (!operator || !operator2 || !opsAdmin || !supervisor || !manager) {
    console.warn('Overtime demo seed: missing EmployeeDetails — skipping requests');
    return;
  }

  const decidedAt = new Date();

  const scenarios: Array<{
    id: string;
    employeeId: string;
    status: OvertimeStatus;
    accumulatedMinutes: number;
    approvals: Array<{
      id: string;
      level: OvertimeApprovalLevel;
      approverId?: string | null;
      decision?: OvertimeApprovalDecision | null;
      comment?: string | null;
    }>;
  }> = [
    {
      id: REQUEST_IDS.pendingAdmin,
      employeeId: operator.id,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      accumulatedMinutes: 45,
      approvals: [
        { id: 'ffffffff-0000-0000-0000-000000000211', level: OvertimeApprovalLevel.ADMINISTRADOR },
        {
          id: 'ffffffff-0000-0000-0000-000000000212',
          level: OvertimeApprovalLevel.GERENCIA_OPERACIONES,
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000213',
          level: OvertimeApprovalLevel.GERENCIA_GENERAL,
        },
      ],
    },
    {
      id: REQUEST_IDS.pendingOps,
      employeeId: operator2.id,
      status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      accumulatedMinutes: 52,
      approvals: [
        {
          id: 'ffffffff-0000-0000-0000-000000000221',
          level: OvertimeApprovalLevel.ADMINISTRADOR,
          approverId: GLOBAL_MES_MANAGER_USER_ID,
          decision: OvertimeApprovalDecision.APROBADO,
          comment: 'Aprobado administrador de sede (seed)',
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000222',
          level: OvertimeApprovalLevel.GERENCIA_OPERACIONES,
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000223',
          level: OvertimeApprovalLevel.GERENCIA_GENERAL,
        },
      ],
    },
    {
      id: REQUEST_IDS.pendingGg,
      employeeId: opsAdmin.id,
      status: OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
      accumulatedMinutes: 68,
      approvals: [
        {
          id: 'ffffffff-0000-0000-0000-000000000231',
          level: OvertimeApprovalLevel.ADMINISTRADOR,
          approverId: GLOBAL_MES_MANAGER_USER_ID,
          decision: OvertimeApprovalDecision.APROBADO,
          comment: 'OK administrador (seed)',
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000232',
          level: OvertimeApprovalLevel.GERENCIA_OPERACIONES,
          approverId: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID,
          decision: OvertimeApprovalDecision.APROBADO,
          comment: 'OK gerencia operaciones (seed)',
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000233',
          level: OvertimeApprovalLevel.GERENCIA_GENERAL,
        },
      ],
    },
    {
      id: REQUEST_IDS.approved,
      employeeId: manager.id,
      status: OvertimeStatus.APROBADA,
      accumulatedMinutes: 90,
      approvals: [
        {
          id: 'ffffffff-0000-0000-0000-000000000241',
          level: OvertimeApprovalLevel.ADMINISTRADOR,
          approverId: GLOBAL_MES_MANAGER_USER_ID,
          decision: OvertimeApprovalDecision.APROBADO,
          comment: 'Aprobado L1 (seed)',
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000242',
          level: OvertimeApprovalLevel.GERENCIA_OPERACIONES,
          approverId: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID,
          decision: OvertimeApprovalDecision.APROBADO,
          comment: 'Aprobado L2 (seed)',
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000243',
          level: OvertimeApprovalLevel.GERENCIA_GENERAL,
          approverId: GLOBAL_OVERTIME_GG_USER_ID,
          decision: OvertimeApprovalDecision.APROBADO,
          comment: 'Aprobado L3 (seed)',
        },
      ],
    },
    {
      id: REQUEST_IDS.objected,
      employeeId: supervisor.id,
      status: OvertimeStatus.OBJETADA,
      accumulatedMinutes: 40,
      approvals: [
        {
          id: 'ffffffff-0000-0000-0000-000000000251',
          level: OvertimeApprovalLevel.ADMINISTRADOR,
          approverId: GLOBAL_MES_MANAGER_USER_ID,
          decision: OvertimeApprovalDecision.OBJETADO,
          comment: 'No autorizado — demo objeción (seed)',
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000252',
          level: OvertimeApprovalLevel.GERENCIA_OPERACIONES,
        },
        {
          id: 'ffffffff-0000-0000-0000-000000000253',
          level: OvertimeApprovalLevel.GERENCIA_GENERAL,
        },
      ],
    },
  ];

  for (const scenario of scenarios) {
    const { shiftEndTime, actualEndTime } = shiftTimes(workDate, scenario.accumulatedMinutes);

    await prisma.overtimeRequest.upsert({
      where: { id: scenario.id },
      update: {
        tenantId: TENANT_ID,
        employeeId: scenario.employeeId,
        locationId,
        type: OvertimeRequestType.DETECCION_AUTOMATICA,
        shiftEndTime,
        actualEndTime,
        accumulatedMinutes: scenario.accumulatedMinutes,
        status: scenario.status,
        payrollPeriod,
        deletedAt: null,
      },
      create: {
        id: scenario.id,
        tenantId: TENANT_ID,
        employeeId: scenario.employeeId,
        locationId,
        type: OvertimeRequestType.DETECCION_AUTOMATICA,
        shiftEndTime,
        actualEndTime,
        accumulatedMinutes: scenario.accumulatedMinutes,
        status: scenario.status,
        payrollPeriod,
      },
    });

    for (const approval of scenario.approvals) {
      await upsertApprovalRow(prisma, approval.id, scenario.id, approval.level, {
        approverId: approval.approverId ?? null,
        decision: approval.decision ?? null,
        decidedAt: approval.decision ? decidedAt : null,
        comment: approval.comment ?? null,
      });
    }
  }
}

async function seedOvertimeAttendanceLogs(
  prisma: PrismaClient,
  locationId: string,
  workDate: Date,
): Promise<void> {
  const employees = await prisma.employeeDetails.findMany({
    where: {
      tenantId: TENANT_ID,
      userId: {
        in: [
          GLOBAL_MES_OPERATOR_USER_ID,
          GLOBAL_MES_OPERATOR2_USER_ID,
          GLOBAL_MES_OPERATIONS_ADMIN_USER_ID,
        ],
      },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, userId: true },
  });

  await prisma.attendanceLog.deleteMany({
    where: { tenantId: TENANT_ID, notes: SEED_NOTES },
  });

  const exitOffsetsMinutes = [45, 52, 68];

  for (let index = 0; index < employees.length; index += 1) {
    const employee = employees[index];
    const excess = exitOffsetsMinutes[index] ?? 40;
    const { shiftEndTime, actualEndTime } = shiftTimes(workDate, excess);
    const entryTime = new Date(shiftEndTime.getTime() - 8 * 3600_000);

    await prisma.attendanceLog.create({
      data: {
        tenantId: TENANT_ID,
        employeeId: employee.id,
        locationId,
        eventType: AttendanceEventType.ENTRY,
        shift: AttendanceShift.AFTERNOON,
        timestamp: entryTime,
        workDate,
        notes: SEED_NOTES,
        isActive: true,
      },
    });

    await prisma.attendanceLog.create({
      data: {
        tenantId: TENANT_ID,
        employeeId: employee.id,
        locationId,
        eventType: AttendanceEventType.EXIT,
        shift: AttendanceShift.AFTERNOON,
        timestamp: actualEndTime,
        workDate,
        notes: SEED_NOTES,
        isActive: true,
      },
    });
  }
}

/**
 * CONN-04a — fixtures de solicitudes de tiempo extra para bandeja, cascada y nómina.
 * Idempotente: upsert por IDs fijos; recalcula período con la fecha actual en Bogotá.
 */
export async function seedOvertimeDemo(prisma: PrismaClient): Promise<void> {
  const workDate = getTodayWorkDate();
  const payrollPeriod = payrollPeriodFromWorkDate(workDate);

  const location = await prisma.location.findFirst({
    where: { tenantId: TENANT_ID, code: 'PL-01', isActive: true },
    select: { id: true, code: true },
  });

  if (!location) {
    console.warn('Overtime demo seed: PL-01 not found — skipping');
    return;
  }

  const passwordHash = await bcrypt.hash('TestPass123!', SALT_ROUNDS);

  await configureOvertimeApprovers(prisma, location.id, passwordHash);
  await seedOvertimeRequests(prisma, location.id, payrollPeriod, workDate);
  await seedOvertimeAttendanceLogs(prisma, location.id, workDate);

  console.log('✅ CONN-04a Overtime demo seed:');
  console.log(`  Período nómina: ${payrollPeriod} | Sede: ${location.code}`);
  console.log(
    '  Ver bandeja UI: nomina@palos-de-lena.dev / TestPass123! → /asistencia/tiempo-extra',
  );
  console.log('  Aprobar L1 (ADMINISTRADOR):     mes-manager@palos-de-lena.dev / TestPass123!');
  console.log(
    '  Aprobar L2 (GERENCIA OPS):      operations.admin@palos-de-lena.dev / TestPass123!',
  );
  console.log('  Aprobar L3 (GERENTE GENERAL):   overtime-gg@palos-de-lena.dev / TestPass123!');
  console.log('  Solicitudes sembradas:');
  console.log('    • Operario de Planta        → PENDIENTE_ADMIN');
  console.log('    • Carlos Mendoza (operator2)→ PENDIENTE_GERENCIA_OPERACIONES');
  console.log('    • Operations admin          → PENDIENTE_GERENCIA_GENERAL');
  console.log('    • Diego Torres (manager)    → APROBADA');
  console.log('    • Sofía Ramírez (supervisor)→ OBJETADA');
}
