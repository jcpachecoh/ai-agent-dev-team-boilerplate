/**
 * OS-589 — 10 VacationRequest demo para pruebas de bandeja / aprobación.
 *
 * Prerrequisitos:
 * - EmployeeDetails de owner + operator (seedEmployeeDetails)
 * - VacationBalance para esos empleados (seedVacationDemoBalances)
 *
 * Idempotente: upsert por id `seed-vacation-request-001` … `010`.
 */

import { PrismaClient, VacationStatus, VacationType } from '@prisma/client';

const TENANT_ID = 'palos-de-lena';

const GLOBAL_MES_OWNER_USER_ID = '11111111-0000-0000-0000-000000000004';
const GLOBAL_MES_OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';
const GLOBAL_MES_OPERATOR2_USER_ID = '11111111-0000-0000-0000-000000000006';
const GLOBAL_MES_SUPERVISOR_USER_ID = '11111111-0000-0000-0000-000000000010';

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

type DemoRequest = {
  id: string;
  employeeUserId: string;
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  type: VacationType;
  status: VacationStatus;
  level1ApprovedBy?: string;
  level1ActedAt?: Date;
  level2ApprovedBy?: string;
  level2ActedAt?: Date;
  rejectionReason?: string;
};

const DEMO_REQUESTS: DemoRequest[] = [
  // Owner — 5 solicitudes (fechas no solapadas)
  {
    id: 'seed-vacation-request-001',
    employeeUserId: GLOBAL_MES_OWNER_USER_ID,
    startDate: utcDate(2026, 8, 3),
    endDate: utcDate(2026, 8, 7),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.SOLICITADA,
  },
  {
    id: 'seed-vacation-request-002',
    employeeUserId: GLOBAL_MES_OWNER_USER_ID,
    startDate: utcDate(2026, 9, 1),
    endDate: utcDate(2026, 9, 5),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.SOLICITADA,
  },
  {
    id: 'seed-vacation-request-003',
    employeeUserId: GLOBAL_MES_OWNER_USER_ID,
    startDate: utcDate(2026, 6, 9),
    endDate: utcDate(2026, 6, 13),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.APROBADA_NIVEL_1,
    level1ApprovedBy: GLOBAL_MES_SUPERVISOR_USER_ID,
    level1ActedAt: utcDate(2026, 6, 2),
  },
  {
    id: 'seed-vacation-request-004',
    employeeUserId: GLOBAL_MES_OWNER_USER_ID,
    startDate: utcDate(2026, 5, 5),
    endDate: utcDate(2026, 5, 9),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.APROBADA,
    level1ApprovedBy: GLOBAL_MES_SUPERVISOR_USER_ID,
    level1ActedAt: utcDate(2026, 4, 28),
    level2ApprovedBy: GLOBAL_MES_OWNER_USER_ID,
    level2ActedAt: utcDate(2026, 4, 29),
  },
  {
    id: 'seed-vacation-request-005',
    employeeUserId: GLOBAL_MES_OWNER_USER_ID,
    startDate: utcDate(2026, 4, 6),
    endDate: utcDate(2026, 4, 10),
    daysRequested: 5,
    type: VacationType.COMPENSACION,
    status: VacationStatus.RECHAZADA,
    level1ApprovedBy: GLOBAL_MES_SUPERVISOR_USER_ID,
    level1ActedAt: utcDate(2026, 3, 30),
    rejectionReason: 'Saldo insuficiente para compensación en el período solicitado.',
  },
  // Operator — 5 solicitudes
  {
    id: 'seed-vacation-request-006',
    employeeUserId: GLOBAL_MES_OPERATOR_USER_ID,
    startDate: utcDate(2026, 8, 17),
    endDate: utcDate(2026, 8, 21),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.SOLICITADA,
  },
  {
    id: 'seed-vacation-request-007',
    employeeUserId: GLOBAL_MES_OPERATOR_USER_ID,
    startDate: utcDate(2026, 10, 5),
    endDate: utcDate(2026, 10, 9),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.SOLICITADA,
  },
  {
    id: 'seed-vacation-request-008',
    employeeUserId: GLOBAL_MES_OPERATOR_USER_ID,
    startDate: utcDate(2026, 7, 6),
    endDate: utcDate(2026, 7, 10),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.APROBADA_NIVEL_1,
    level1ApprovedBy: GLOBAL_MES_SUPERVISOR_USER_ID,
    level1ActedAt: utcDate(2026, 6, 28),
  },
  {
    id: 'seed-vacation-request-009',
    employeeUserId: GLOBAL_MES_OPERATOR_USER_ID,
    startDate: utcDate(2026, 3, 2),
    endDate: utcDate(2026, 3, 6),
    daysRequested: 5,
    type: VacationType.DISFRUTE,
    status: VacationStatus.APROBADA,
    level1ApprovedBy: GLOBAL_MES_SUPERVISOR_USER_ID,
    level1ActedAt: utcDate(2026, 2, 20),
    level2ApprovedBy: GLOBAL_MES_OWNER_USER_ID,
    level2ActedAt: utcDate(2026, 2, 21),
  },
  {
    id: 'seed-vacation-request-010',
    employeeUserId: GLOBAL_MES_OPERATOR_USER_ID,
    startDate: utcDate(2026, 2, 9),
    endDate: utcDate(2026, 2, 13),
    daysRequested: 5,
    type: VacationType.COMPENSACION,
    status: VacationStatus.RECHAZADA,
    rejectionReason: 'Solicitud fuera de la ventana de planificación del área.',
  },
];

async function ensureVacationBalance(
  prisma: PrismaClient,
  employee: { id: string; tenantId: string },
  balanceId: string,
): Promise<void> {
  await prisma.vacationBalance.upsert({
    where: { employeeId: employee.id },
    update: {},
    create: {
      id: balanceId,
      tenantId: employee.tenantId,
      employeeId: employee.id,
      accruedDays: 15.0,
      takenDays: 0,
      compensatedDays: 0,
      lastAccrualDate: utcDate(2026, 7, 1),
    },
  });
}

/**
 * Siembra 10 solicitudes de vacaciones (mezcla de estados) para pruebas UI/API.
 */
export async function seedVacationRequestsDemo(prisma: PrismaClient): Promise<void> {
  const userIds = Array.from(new Set(DEMO_REQUESTS.map((request) => request.employeeUserId)));

  const employees = await prisma.employeeDetails.findMany({
    where: { tenantId: TENANT_ID, userId: { in: userIds } },
    select: { id: true, tenantId: true, userId: true },
  });

  const byUserId = new Map(employees.map((employee) => [employee.userId, employee]));

  const owner = byUserId.get(GLOBAL_MES_OWNER_USER_ID);
  const operator = byUserId.get(GLOBAL_MES_OPERATOR_USER_ID);

  if (!owner || !operator) {
    console.warn(
      'VacationRequest demo: owner/operator EmployeeDetails missing — skipping (run seedEmployeeDetails first)',
    );
    return;
  }

  await ensureVacationBalance(prisma, owner, 'seed-vacation-balance-owner-001');
  await ensureVacationBalance(prisma, operator, 'seed-vacation-balance-operator-001');

  // Cobertura opcional: operator2 si ya tiene ficha (p. ej. seeds posteriores).
  const operator2 = byUserId.get(GLOBAL_MES_OPERATOR2_USER_ID);
  if (operator2) {
    await ensureVacationBalance(prisma, operator2, 'seed-vacation-balance-operator2-001');
  }

  let created = 0;
  for (const demo of DEMO_REQUESTS) {
    const employee = byUserId.get(demo.employeeUserId);
    if (!employee) {
      console.warn(
        `VacationRequest demo: skip ${demo.id} — employee for ${demo.employeeUserId} not found`,
      );
      continue;
    }

    const approvalFields = {
      level1ApprovedBy: demo.level1ApprovedBy ?? null,
      level1ActedAt: demo.level1ActedAt ?? null,
      level2ApprovedBy: demo.level2ApprovedBy ?? null,
      level2ActedAt: demo.level2ActedAt ?? null,
      rejectionReason: demo.rejectionReason ?? null,
    };

    await prisma.vacationRequest.upsert({
      where: { id: demo.id },
      update: {
        employeeId: employee.id,
        startDate: demo.startDate,
        endDate: demo.endDate,
        daysRequested: demo.daysRequested,
        type: demo.type,
        status: demo.status,
        isActive: true,
        ...approvalFields,
      },
      create: {
        id: demo.id,
        tenantId: TENANT_ID,
        employeeId: employee.id,
        startDate: demo.startDate,
        endDate: demo.endDate,
        daysRequested: demo.daysRequested,
        type: demo.type,
        status: demo.status,
        isActive: true,
        ...approvalFields,
      },
    });
    created += 1;
  }

  console.log(`VacationRequest: seeded ${created} demo requests (seed-vacation-request-001…010)`);
}
