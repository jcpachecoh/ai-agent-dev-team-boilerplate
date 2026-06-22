import { AttendanceEventType, AttendanceShift, PrismaClient } from '@prisma/client';

const TENANT_ID = 'palos-de-lena';
const SEED_NOTES = 'attendance-seed';
const HISTORICAL_SEED_NOTES = 'attendance-seed-historical';
const MONITOR_OVERTIME_NOTES = 'attendance-seed-monitor-overtime';

const GLOBAL_MES_OWNER_USER_ID = '11111111-0000-0000-0000-000000000004';

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

/**
 * Detecta el turno a partir de un timestamp, usando la hora local en Bogotá.
 * Usada en seedAttendance y seedMonitorOvertime para logs con timestamps dinámicos.
 */
function detectShiftForTs(ts: Date): AttendanceShift {
  const hour = parseInt(
    new Intl.DateTimeFormat('en', {
      timeZone: 'America/Bogota',
      hour: 'numeric',
      hour12: false,
      hourCycle: 'h23',
    }).format(ts),
    10,
  );
  if (hour >= 6 && hour < 14) return AttendanceShift.MORNING;
  if (hour >= 14 && hour < 22) return AttendanceShift.AFTERNOON;
  return AttendanceShift.NIGHT;
}

/**
 * Logs de HOY en Bogotá para la vista de monitor y pruebas básicas de attendance.
 * Todos los timestamps son relativos a `now`, nunca futuros.
 * Se borran y recrean en cada seed (deleteMany + upsert por ID fijo).
 *
 * Logs creados:
 *   001  operator  PL-01  ENTRY 6h ago  → activo PL-01
 *   002  operator2 PL-01  ENTRY 8.5h ago → base de par cerrado
 *   003  operator2 PL-01  EXIT  30min ago → cierra par → ~8h normal (sin OT)
 *   004  ops_admin PL-01  ENTRY 2.5h ago → activo PL-01
 *   005  operator  PL-02  ENTRY 3.5h ago → activo PL-02
 */
export async function seedAttendance(prisma: PrismaClient): Promise<void> {
  const now = new Date();
  const nowMs = now.getTime();
  const workDate = getTodayWorkDate();
  // Bogotá day starts at midnight Bogotá = workDate + 5h UTC; cap keeps all timestamps today
  const todayStartUtc = new Date(workDate.getTime() + 5 * 60 * 60_000);
  const cap = todayStartUtc.getTime() + 60_000;

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

  // Timestamps: relative to now, capped to start of today in Bogotá (safe at any hour)
  const op1EntryTs = new Date(Math.max(nowMs - 6 * 3600_000, cap)); // operator  PL-01 open
  const op2EntryTs = new Date(Math.max(nowMs - 8.5 * 3600_000, cap)); // operator2 entry
  const op2ExitTs = new Date(Math.max(nowMs - 30 * 60_000, op2EntryTs.getTime() + 60_000)); // operator2 exit
  const opsEntryTs = new Date(Math.max(nowMs - 2.5 * 3600_000, cap)); // ops_admin PL-01 open
  const op2ndEntry = new Date(Math.max(nowMs - 3.5 * 3600_000, cap)); // operator  PL-02 open

  const logs = [
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000001',
      employeeId: operator.id,
      locationId: location1.id,
      eventType: AttendanceEventType.ENTRY,
      shift: detectShiftForTs(op1EntryTs),
      timestamp: op1EntryTs,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000002',
      employeeId: operator2.id,
      locationId: location1.id,
      eventType: AttendanceEventType.ENTRY,
      shift: detectShiftForTs(op2EntryTs),
      timestamp: op2EntryTs,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000003',
      employeeId: operator2.id,
      locationId: location1.id,
      eventType: AttendanceEventType.EXIT,
      shift: detectShiftForTs(op2ExitTs),
      timestamp: op2ExitTs,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000004',
      employeeId: operationsAdmin.id,
      locationId: location1.id,
      eventType: AttendanceEventType.ENTRY,
      shift: detectShiftForTs(opsEntryTs),
      timestamp: opsEntryTs,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000005',
      employeeId: operator.id,
      locationId: location2.id,
      eventType: AttendanceEventType.ENTRY,
      shift: detectShiftForTs(op2ndEntry),
      timestamp: op2ndEntry,
    },
  ];

  // Safety guard: no future timestamps
  for (const log of logs) {
    if (log.timestamp.getTime() > nowMs) {
      throw new Error(
        `seedAttendance: future timestamp — ${log.eventType} id=${log.id} ts=${log.timestamp.toISOString()} now=${now.toISOString()}`,
      );
    }
  }

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
        workDate,
        notes: SEED_NOTES,
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
        workDate,
        notes: SEED_NOTES,
        isActive: true,
      },
    });
  }

  const op2PairMin = Math.round((op2ExitTs.getTime() - op2EntryTs.getTime()) / 60_000);
  console.log('✅ Attendance seed (monitor /payroll/attendance):');
  console.log(`  workDate (Bogotá) = ${workDate.toISOString().slice(0, 10)}`);
  console.log(
    `  ${location1.code} — activos: ${operator.name} (6h), ${operationsAdmin.name} (2.5h)`,
  );
  console.log(
    `  ${location1.code} — cerrado: ${operator2.name} (~${Math.round(op2PairMin / 60)}h par, sin OT)`,
  );
  console.log(`  ${location2.code} — activo:  ${operator.name} (3.5h)`);
  console.log('  Login: mes-owner@palos-de-lena.dev / TestPass123! (x-tenant-id: palos-de-lena)');
}

/**
 * Convierte una hora local Bogotá (UTC-5) a UTC, manejando overflow de medianoche.
 *
 * Ejemplos:
 *   bogotaToUtc('2026-06-03', 23, 30) → 2026-06-04T04:30:00.000Z
 *   bogotaToUtc('2026-06-15', 19,  0) → 2026-06-16T00:00:00.000Z
 *   bogotaToUtc('2026-06-02',  8,  0) → 2026-06-02T13:00:00.000Z
 */
function bogotaToUtc(dateStr: string, hour: number, minute = 0): Date {
  const totalUtcMinutes = hour * 60 + minute + 5 * 60;
  const utcHour = Math.floor(totalUtcMinutes / 60) % 24;
  const utcMinute = totalUtcMinutes % 60;
  const dayOffset = Math.floor(totalUtcMinutes / (24 * 60));

  const base = new Date(`${dateStr}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  const finalDay = base.toISOString().slice(0, 10);

  return new Date(
    `${finalDay}T${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')}:00.000Z`,
  );
}

/**
 * Logs históricos fijos de junio 2026 para probar overtime diurno/nocturno y reportes NOM-04.
 *
 * Fixtures:
 *   A) operator     2026-06-02  08:00–17:00  → 9h, 1h overtime diurno
 *   B) operator2    2026-06-03  14:00–23:30  → 9.5h, EXIT ≥ 21h → overtime nocturno
 *   C) operator     2026-06-15  07:00–19:00  → 12h, supera cap diario 2h
 *   D) ops_admin    2026-06-16  09:00–(open) → entrada abierta, excluida de reportes
 *   E) operator2    2026-06-20  08:00–16:00  → 8h normal
 *
 * Idempotencia: upsert por ID fijo; los IDs 101–109 no colisionan con los de seedAttendance (001–005).
 */
export async function seedHistoricalAttendance(prisma: PrismaClient): Promise<void> {
  const location = await prisma.location.findFirst({
    where: { tenantId: TENANT_ID, isActive: true, code: 'PL-01' },
    select: { id: true, code: true },
  });

  if (!location) {
    console.warn('Historical attendance seed: location PL-01 not found — skipping');
    return;
  }

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

  const byUserId = new Map(employees.map((e) => [e.userId, e]));
  const operator = byUserId.get(GLOBAL_MES_OPERATOR_USER_ID);
  const operator2 = byUserId.get(GLOBAL_MES_OPERATOR2_USER_ID);
  const operationsAdmin = byUserId.get(GLOBAL_MES_OPERATIONS_ADMIN_USER_ID);

  if (!operator || !operator2 || !operationsAdmin) {
    console.warn(
      'Historical attendance seed: missing EmployeeDetails (run full seed first) — skipping',
    );
    return;
  }

  const loc = location.id;

  // Fixed workDates (calendar date in Bogotá, stored as midnight UTC)
  const wd0602 = new Date('2026-06-02T00:00:00.000Z');
  const wd0603 = new Date('2026-06-03T00:00:00.000Z');
  const wd0615 = new Date('2026-06-15T00:00:00.000Z');
  const wd0616 = new Date('2026-06-16T00:00:00.000Z');
  const wd0620 = new Date('2026-06-20T00:00:00.000Z');

  const logs = [
    // A) operator 2026-06-02 — 9h jornada → 1h overtime diurno
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000101',
      employeeId: operator.id,
      locationId: loc,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaToUtc('2026-06-02', 8, 0),
      workDate: wd0602,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000102',
      employeeId: operator.id,
      locationId: loc,
      eventType: AttendanceEventType.EXIT,
      shift: AttendanceShift.AFTERNOON,
      timestamp: bogotaToUtc('2026-06-02', 17, 0),
      workDate: wd0602,
    },
    // B) operator2 2026-06-03 — EXIT a las 23:30 Bogotá → overtime nocturno
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000103',
      employeeId: operator2.id,
      locationId: loc,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.AFTERNOON,
      timestamp: bogotaToUtc('2026-06-03', 14, 0),
      workDate: wd0603,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000104',
      employeeId: operator2.id,
      locationId: loc,
      eventType: AttendanceEventType.EXIT,
      shift: AttendanceShift.NIGHT,
      // 23:30 Bogotá = 04:30 UTC del 2026-06-04
      timestamp: bogotaToUtc('2026-06-03', 23, 30),
      workDate: wd0603,
    },
    // C) operator 2026-06-15 — 12h jornada → 4h overtime (supera cap diario 2h)
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000105',
      employeeId: operator.id,
      locationId: loc,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaToUtc('2026-06-15', 7, 0),
      workDate: wd0615,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000106',
      employeeId: operator.id,
      locationId: loc,
      eventType: AttendanceEventType.EXIT,
      shift: AttendanceShift.AFTERNOON,
      // 19:00 Bogotá = 00:00 UTC del 2026-06-16
      timestamp: bogotaToUtc('2026-06-15', 19, 0),
      workDate: wd0615,
    },
    // D) ops_admin 2026-06-16 — entrada abierta (sin EXIT); excluida de reportes de horas
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000107',
      employeeId: operationsAdmin.id,
      locationId: loc,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaToUtc('2026-06-16', 9, 0),
      workDate: wd0616,
    },
    // E) operator2 2026-06-20 — jornada normal 8h
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000108',
      employeeId: operator2.id,
      locationId: loc,
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: bogotaToUtc('2026-06-20', 8, 0),
      workDate: wd0620,
    },
    {
      id: 'nnnnnnnn-0000-0000-0000-000000000109',
      employeeId: operator2.id,
      locationId: loc,
      eventType: AttendanceEventType.EXIT,
      shift: AttendanceShift.AFTERNOON,
      timestamp: bogotaToUtc('2026-06-20', 16, 0),
      workDate: wd0620,
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
        notes: HISTORICAL_SEED_NOTES,
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
        notes: HISTORICAL_SEED_NOTES,
        isActive: true,
      },
    });
  }

  console.log('✅ Historical attendance seed (reportes NOM-04, junio 2026):');
  console.log('  A) operator     2026-06-02  08:00–17:00  → 9h, 1h OT diurno');
  console.log('  B) operator2    2026-06-03  14:00–23:30  → EXIT ≥21h → OT nocturno');
  console.log('  C) operator     2026-06-15  07:00–19:00  → 12h, supera cap 2h/día');
  console.log('  D) ops_admin    2026-06-16  09:00–(open) → entrada abierta, excluida de reportes');
  console.log('  E) operator2    2026-06-20  08:00–16:00  → 8h normal');
  console.log('  Queries de prueba:');
  console.log('    GET /api/reports/attendance?from=2026-06-01&to=2026-06-30');
  console.log('    GET /api/reports/payroll?period=2026-06');
  console.log('    GET /api/reports/social-security?period=2026-06');
}

/**
 * Logs de HOY en Bogotá para probar alertas de overtime en el monitor.
 * Todos los timestamps son relativos a `now` — nunca futuros.
 * Se borran y recrean en cada seed (deleteMany + create).
 *
 * Estrategia: offsets fijos sobre `now`, capados al inicio del día Bogotá para que
 * workDate = today siempre, sin condiciones por hora del día.
 *
 * Escenarios:
 *   A) owner     PL-01  ENTRY = now - 10h (cap: inicio hoy Bogotá)
 *      → activo en monitor; OT = max(0, minutos transcurridos - 480), creciente
 *   C) operator2 PL-01  ENTRY = now - 4h, EXIT = now - 1h (caps: hoy Bogotá)
 *      → par cerrado que suma al par de seedAttendance (~8h) → total ~11h, OT ~3h
 *
 * Escenarios cubiertos por seedAttendance sin logs adicionales:
 *   B) Jornada normal ~8h → operator2 par (8.5h ago → 30min ago)
 *   E) Activo reciente    → ops_admin ENTRY 2.5h ago
 *   F) Activo PL-01/PL-02 → operator ENTRYs 6h/3.5h ago
 *   D) Nocturno histórico → fixture B seedHistoricalAttendance (2026-06-03, EXIT 23:30)
 */
export async function seedMonitorOvertime(prisma: PrismaClient): Promise<void> {
  const now = new Date();
  const nowMs = now.getTime();
  const workDate = getTodayWorkDate();
  const dateStr = workDate.toISOString().slice(0, 10);
  // Bogotá day starts at midnight Bogotá = workDate + 5h UTC; cap keeps timestamps today
  const todayStartUtc = new Date(workDate.getTime() + 5 * 60 * 60_000);
  const cap = todayStartUtc.getTime() + 60_000;

  const location = await prisma.location.findFirst({
    where: { tenantId: TENANT_ID, code: 'PL-01', isActive: true },
    select: { id: true, code: true },
  });

  if (!location) {
    console.warn('Monitor overtime seed: location PL-01 not found — skipping');
    return;
  }

  const employees = await prisma.employeeDetails.findMany({
    where: {
      tenantId: TENANT_ID,
      userId: { in: [GLOBAL_MES_OWNER_USER_ID, GLOBAL_MES_OPERATOR2_USER_ID] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, userId: true, name: true },
  });

  const byUserId = new Map(employees.map((e) => [e.userId, e]));
  const owner = byUserId.get(GLOBAL_MES_OWNER_USER_ID);
  const operator2 = byUserId.get(GLOBAL_MES_OPERATOR2_USER_ID);

  if (!owner || !operator2) {
    console.warn('Monitor overtime seed: missing EmployeeDetails (run full seed first) — skipping');
    return;
  }

  await prisma.attendanceLog.deleteMany({
    where: { tenantId: TENANT_ID, notes: MONITOR_OVERTIME_NOTES },
  });

  const loc = location.id;

  // A) owner: open entry 10h ago → active, OT growing
  const entryATs = new Date(Math.max(nowMs - 10 * 3600_000, cap));
  // C) operator2: closed pair — entry 4h ago, exit 1h ago
  const entryCTs = new Date(Math.max(nowMs - 4 * 3600_000, cap));
  const exitCTs = new Date(Math.max(nowMs - 1 * 3600_000, entryCTs.getTime() + 60_000));

  const logsToInsert = [
    {
      tenantId: TENANT_ID,
      employeeId: owner.id,
      locationId: loc,
      eventType: AttendanceEventType.ENTRY,
      shift: detectShiftForTs(entryATs),
      timestamp: entryATs,
      workDate,
      notes: MONITOR_OVERTIME_NOTES,
      isActive: true,
    },
    {
      tenantId: TENANT_ID,
      employeeId: operator2.id,
      locationId: loc,
      eventType: AttendanceEventType.ENTRY,
      shift: detectShiftForTs(entryCTs),
      timestamp: entryCTs,
      workDate,
      notes: MONITOR_OVERTIME_NOTES,
      isActive: true,
    },
    {
      tenantId: TENANT_ID,
      employeeId: operator2.id,
      locationId: loc,
      eventType: AttendanceEventType.EXIT,
      shift: detectShiftForTs(exitCTs),
      timestamp: exitCTs,
      workDate,
      notes: MONITOR_OVERTIME_NOTES,
      isActive: true,
    },
  ];

  // Safety guard: no future timestamps
  for (const log of logsToInsert) {
    if (log.timestamp.getTime() > nowMs) {
      throw new Error(
        `seedMonitorOvertime: future timestamp — ${log.eventType} ts=${log.timestamp.toISOString()} now=${now.toISOString()}`,
      );
    }
  }

  for (const log of logsToInsert) {
    await prisma.attendanceLog.create({ data: log });
  }

  const ownerOtMin = Math.max(0, Math.round((nowMs - entryATs.getTime()) / 60_000) - 480);
  const pairCMin = Math.round((exitCTs.getTime() - entryCTs.getTime()) / 60_000);
  const op2TotalMin = 8 * 60 + pairCMin; // seedAttendance ~8h + this pair
  const op2OtMin = Math.max(0, op2TotalMin - 480);

  console.log('✅ Monitor overtime seed (HOY Bogotá — timestamps relativos a now):');
  console.log(`  workDate = ${dateStr}`);
  console.log(
    `  [A] owner     ENTRY ${entryATs.toISOString()}  → activo; OT ~${ownerOtMin}min, creciente`,
  );
  console.log(
    `  [C] operator2 ENTRY ${entryCTs.toISOString()} + EXIT ${exitCTs.toISOString()} → par ${pairCMin}min, OT total ~${op2OtMin}min`,
  );
  console.log('  [B] Normal ~8h   → operator2 par de seedAttendance');
  console.log('  [D] Nocturno     → fixture histórico 2026-06-03');
  console.log('  Queries:');
  console.log('    GET /api/attendance/active?locationId=<PL-01-id>');
  console.log(
    `    GET /api/attendance/employees/${GLOBAL_MES_OWNER_USER_ID}/overtime       → OT ~${ownerOtMin}min`,
  );
  console.log(
    `    GET /api/attendance/employees/${GLOBAL_MES_OPERATOR2_USER_ID}/overtime   → OT ~${op2OtMin}min`,
  );
}
