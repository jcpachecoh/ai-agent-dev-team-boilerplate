import { AttendanceEventType, AttendanceShift, PrismaClient } from '@prisma/client';

const TENANT_ID = 'palos-de-lena';
const SEED_NOTES = 'attendance-seed';

const GLOBAL_MES_OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';
const GLOBAL_MES_OPERATOR2_USER_ID = '11111111-0000-0000-0000-000000000006';
const GLOBAL_MES_OPERATIONS_ADMIN_USER_ID = '11111111-0000-0000-0000-000000000007';

function getTodayWorkDate(): Date {
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** Hora local Bogotá (UTC-5) sobre la fecha de jornada normalizada. */
function bogotaTimeOnWorkDate(workDate: Date, hour: number, minute = 0): Date {
  const day = workDate.toISOString().slice(0, 10);
  const utcHour = hour + 5;
  return new Date(
    `${day}T${String(utcHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`,
  );
}

export async function seedAttendance(prisma: PrismaClient): Promise<void> {
  const workDate = getTodayWorkDate();

  const locations = await prisma.location.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    orderBy: { code: 'asc' },
    take: 2,
    select: { id: true, name: true, code: true },
  });

  if (locations.length === 0) {
    console.warn('Attendance seed: no locations found — skipping');
    return;
  }

  const location1 = locations[0];
  const location2 = locations[1] ?? location1;

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
    select: { id: true, userId: true, name: true },
  });

  const byUserId = new Map(employees.map((employee) => [employee.userId, employee]));
  const operator = byUserId.get(GLOBAL_MES_OPERATOR_USER_ID);
  const operator2 = byUserId.get(GLOBAL_MES_OPERATOR2_USER_ID);
  const operationsAdmin = byUserId.get(GLOBAL_MES_OPERATIONS_ADMIN_USER_ID);

  if (!operator || !operator2 || !operationsAdmin) {
    console.warn('Attendance seed: missing EmployeeDetails (run full seed first) — skipping');
    return;
  }

  await prisma.attendanceLog.deleteMany({
    where: { tenantId: TENANT_ID, notes: SEED_NOTES },
  });

  const logs = [
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000001',
      employeeId: operator.id,
      locationId: location1.id,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaTimeOnWorkDate(workDate, 5, 30),
      workDate,
      notes: SEED_NOTES,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000002',
      employeeId: operator2.id,
      locationId: location1.id,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaTimeOnWorkDate(workDate, 7, 0),
      workDate,
      notes: SEED_NOTES,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000003',
      employeeId: operator2.id,
      locationId: location1.id,
      eventType: AttendanceEventType.EXIT,
      shift: AttendanceShift.AFTERNOON,
      timestamp: bogotaTimeOnWorkDate(workDate, 15, 0),
      workDate,
      notes: SEED_NOTES,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000004',
      employeeId: operationsAdmin.id,
      locationId: location1.id,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaTimeOnWorkDate(workDate, 9, 0),
      workDate,
      notes: SEED_NOTES,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000005',
      employeeId: operator.id,
      locationId: location2.id,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaTimeOnWorkDate(workDate, 8, 0),
      workDate,
      notes: SEED_NOTES,
    },
  ] as const;

  for (const log of logs) {
    await prisma.attendanceLog.upsert({
      where: { id: log.id },
      update: {
        tenantId: TENANT_ID,
        employeeId: log.employeeId,
        locationId: log.locationId,
        eventType: log.eventType,
        shift: log.shift,
        timestamp: log.timestamp,
        workDate: log.workDate,
        notes: log.notes,
        isActive: true,
      },
      create: {
        id: log.id,
        tenantId: TENANT_ID,
        employeeId: log.employeeId,
        locationId: log.locationId,
        eventType: log.eventType,
        shift: log.shift,
        timestamp: log.timestamp,
        workDate: log.workDate,
        notes: log.notes,
        isActive: true,
      },
    });
  }

  console.log('✅ Attendance seed (monitor /payroll/attendance):');
  console.log(`  workDate (Bogotá)     = ${workDate.toISOString().slice(0, 10)}`);
  console.log(`  ${location1.code} — en turno: ${operator.name}, ${operationsAdmin.name}`);
  console.log(`  ${location1.code} — ausente: ${operator2.name} (salida 15:00)`);
  console.log(`  ${location2.code} — en turno: ${operator.name}`);
  console.log('  Login: mes-owner@palos-de-lena.dev / TestPass123! (x-tenant-id: palos-de-lena)');
}
