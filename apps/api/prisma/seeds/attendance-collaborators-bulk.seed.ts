import {
  ArlRiskLevel,
  AttendanceEventType,
  CostCenter,
  DocumentType,
  EmployeeContractType,
  LaborClassification,
  PrismaClient,
  SalaryType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { detectShiftForTs, getTodayWorkDate } from './attendance.seed';
import { syncEmployeeCompensationHistory } from './employee-compensation-history.seed-util';

const SALT_ROUNDS = 12;
const TENANT_ID = 'palos-de-lena';
/** Same role as the demo `mes-operator` user — plain operational employees, no admin access. */
const ROLE_OPERATOR_ID = 'aaaaaaaa-0000-0000-0000-000000000004';
const ATTENDANCE_LOG_NOTES = 'attendance-seed-bulk-collaborators';

/** Enough rows to exercise pagination (pageSize options up to 50) with 2+ pages to spare. */
const BULK_COUNT = 100;

const FIRST_NAMES = [
  'Camila',
  'Santiago',
  'Valentina',
  'Mateo',
  'Isabella',
  'Samuel',
  'Sofía',
  'Juan David',
  'Mariana',
  'Nicolás',
  'Luisa',
  'Andrés',
  'Daniela',
  'Sebastián',
  'Laura',
  'Felipe',
  'Gabriela',
  'Julián',
  'Paula',
  'Esteban',
] as const;

const LAST_NAMES = [
  'Gómez',
  'Rodríguez',
  'Martínez',
  'López',
  'García',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Torres',
  'Flórez',
  'Vargas',
  'Castro',
  'Ortiz',
  'Rojas',
  'Morales',
  'Suárez',
  'Jiménez',
  'Herrera',
  'Mendoza',
  'Cárdenas',
] as const;

const EPS_OPTIONS = ['Sura', 'Sanitas', 'Compensar', 'Nueva EPS', 'Famisanar'] as const;
const PENSION_OPTIONS = ['Porvenir', 'Protección', 'Colfondos', 'Colpensiones'] as const;
const CAJA_OPTIONS = ['Comfama', 'Compensar', 'Cafam'] as const;
const CONTRACT_TYPES = [
  EmployeeContractType.INDEFINIDO,
  EmployeeContractType.FIJO,
  EmployeeContractType.OBRA,
  EmployeeContractType.PRESTACION,
  EmployeeContractType.APRENDIZAJE,
] as const;

function laborClassificationForArea(area: string): LaborClassification {
  if (area === 'Cocina' || area === 'Planta') return LaborClassification.COCINA;
  if (area === 'Servicio') return LaborClassification.SERVICIO;
  return LaborClassification.ADMINISTRATIVO;
}

function costCenterForArea(area: string): CostCenter {
  if (area === 'Gerencia') return CostCenter.GERENCIA;
  if (area === 'Cocina' || area === 'Planta') return CostCenter.PLANTA;
  if (area === 'Servicio') return CostCenter.OPERACIONES;
  return CostCenter.ADMINISTRATIVO;
}

function arlRiskLevelForClassification(classification: LaborClassification): ArlRiskLevel {
  return classification === LaborClassification.ADMINISTRATIVO
    ? ArlRiskLevel.RIESGO_I
    : ArlRiskLevel.RIESGO_II;
}

function padded(id: number): string {
  return id.toString().padStart(12, '0');
}

/**
 * ~100 colaboradores sintéticos (User + EmployeeDetails + EmployeePersonalData) para
 * probar paginación, búsqueda y filtros del panel de colaboradores de asistencia
 * (AttendanceCollaboratorsService.list). Distribuidos entre las sedes y cargos ya
 * sembrados por seedLocations/seedEmployeePositions — idempotente vía upsert por
 * userId/cedula, así que puede correrse repetidas veces sin duplicar filas.
 */
export async function seedBulkAttendanceCollaborators(prisma: PrismaClient): Promise<void> {
  const positions = await prisma.employeePosition.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    orderBy: { title: 'asc' },
  });
  const locations = await prisma.location.findMany({
    where: { tenantId: TENANT_ID, isActive: true },
    orderBy: { code: 'asc' },
  });

  if (positions.length === 0 || locations.length === 0) {
    console.warn(
      'Bulk collaborators seed: missing positions/locations (run seed first) — skipping',
    );
    return;
  }

  const passwordHash = await bcrypt.hash('TestPass123!', SALT_ROUNDS);
  const workDate = getTodayWorkDate();
  // Bogotá day starts at midnight Bogotá = workDate + 5h UTC; cap keeps all timestamps today
  const todayStartUtc = new Date(workDate.getTime() + 5 * 60 * 60_000);
  const cap = todayStartUtc.getTime() + 60_000;
  const nowMs = Date.now();
  let created = 0;
  let inactiveCount = 0;
  let attendanceLogsCreated = 0;

  for (let i = 1; i <= BULK_COUNT; i++) {
    const index = i.toString().padStart(3, '0');
    const cedula = `9000000${index}`;
    const email = `colaborador${index}@palos-de-lena.dev`;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const primerApellido = LAST_NAMES[i % LAST_NAMES.length]!;
    const segundoApellido = LAST_NAMES[(i * 7) % LAST_NAMES.length]!;
    const fullName = `${firstName} ${primerApellido} ${segundoApellido}`;

    const position = positions[i % positions.length]!;
    const location = locations[i % locations.length]!;
    const contractType = CONTRACT_TYPES[i % CONTRACT_TYPES.length]!;
    const laborClassification = laborClassificationForArea(position.area);
    const costCenter = costCenterForArea(position.area);
    const arlRiskLevel = arlRiskLevelForClassification(laborClassification);
    const salaryType =
      Number(position.baseSalaryRange) >= 8_000_000 ? SalaryType.INTEGRAL : SalaryType.ORDINARIO;
    // ~15% inactive so the active/inactive filter has both branches to page through.
    const isActive = i % 7 !== 0;
    const portalWorkerEnabled = i % 3 === 0;
    const hireDate = new Date(Date.UTC(2024, 0, 1) + i * 6 * 24 * 3600_000);

    if (!isActive) inactiveCount++;

    const user = await prisma.user.upsert({
      where: { tenantId_cedula: { tenantId: TENANT_ID, cedula } },
      update: {
        email,
        passwordHash,
        documentType: DocumentType.CC,
        roleId: ROLE_OPERATOR_ID,
        isActive,
        emailVerified: true,
      },
      create: {
        id: `22222222-0000-0000-0000-${padded(i)}`,
        tenantId: TENANT_ID,
        cedula,
        documentType: DocumentType.CC,
        email,
        passwordHash,
        roleId: ROLE_OPERATOR_ID,
        isActive,
        emailVerified: true,
      },
    });

    const employee = await prisma.employeeDetails.upsert({
      where: { userId: user.id },
      update: {
        name: fullName,
        locationId: location.id,
        positionId: position.id,
        position: position.title,
        area: position.area,
        department: position.area,
        contractType,
        salaryType,
        salaryAmount: position.baseSalaryRange,
        epsName: EPS_OPTIONS[i % EPS_OPTIONS.length]!,
        pensionFundName: PENSION_OPTIONS[i % PENSION_OPTIONS.length]!,
        cesantiasFundName: PENSION_OPTIONS[i % PENSION_OPTIONS.length]!,
        arlName: 'Sura',
        arlRiskLevel,
        cajaCompensacion: CAJA_OPTIONS[i % CAJA_OPTIONS.length]!,
        costCenter,
        laborClassification,
        isActive,
        portalWorkerEnabled,
      },
      create: {
        id: `33333333-0000-0000-0000-${padded(i)}`,
        userId: user.id,
        tenantId: TENANT_ID,
        name: fullName,
        locationId: location.id,
        positionId: position.id,
        position: position.title,
        area: position.area,
        department: position.area,
        contractType,
        hireDate,
        contractStart: hireDate,
        salaryType,
        salaryAmount: position.baseSalaryRange,
        epsName: EPS_OPTIONS[i % EPS_OPTIONS.length]!,
        pensionFundName: PENSION_OPTIONS[i % PENSION_OPTIONS.length]!,
        cesantiasFundName: PENSION_OPTIONS[i % PENSION_OPTIONS.length]!,
        arlName: 'Sura',
        arlRiskLevel,
        cajaCompensacion: CAJA_OPTIONS[i % CAJA_OPTIONS.length]!,
        costCenter,
        laborClassification,
        isActive,
        portalWorkerEnabled,
      },
    });

    await syncEmployeeCompensationHistory(prisma, employee);

    await prisma.employeePersonalData.upsert({
      where: { employeeDetailsId: employee.id },
      update: { nombres: firstName, primerApellido, segundoApellido },
      create: {
        id: `44444444-0000-0000-0000-${padded(i)}`,
        tenantId: TENANT_ID,
        employeeDetailsId: employee.id,
        nombres: firstName,
        primerApellido,
        segundoApellido,
      },
    });

    // Marcación de HOY (solo activos — un inactivo no debería estar marcando asistencia)
    // para poblar "Línea de tiempo hoy" del panel de control (una fila por empleado/día).
    if (isActive) {
      const entryTs = new Date(Math.max(nowMs - i * 5 * 60_000, cap));
      if (entryTs.getTime() > nowMs) {
        throw new Error(
          `seedBulkAttendanceCollaborators: future timestamp — ts=${entryTs.toISOString()}`,
        );
      }

      await prisma.attendanceLog.upsert({
        where: { id: `55555555-0000-0000-0000-${padded(i)}` },
        update: {
          tenantId: TENANT_ID,
          employeeId: employee.id,
          locationId: location.id,
          eventType: AttendanceEventType.ENTRY,
          shift: detectShiftForTs(entryTs),
          timestamp: entryTs,
          workDate,
          notes: ATTENDANCE_LOG_NOTES,
          isActive: true,
        },
        create: {
          id: `55555555-0000-0000-0000-${padded(i)}`,
          tenantId: TENANT_ID,
          employeeId: employee.id,
          locationId: location.id,
          eventType: AttendanceEventType.ENTRY,
          shift: detectShiftForTs(entryTs),
          timestamp: entryTs,
          workDate,
          notes: ATTENDANCE_LOG_NOTES,
          isActive: true,
        },
      });
      attendanceLogsCreated++;
    }

    created++;
  }

  console.log(
    `✅ Bulk attendance collaborators seed: ${created} colaboradores (${inactiveCount} inactivos), ` +
      `repartidos entre ${locations.length} sedes y ${positions.length} cargos.`,
  );
  console.log(
    `  Marcaciones de HOY creadas: ${attendanceLogsCreated} (una por colaborador activo, todas ENTRY).`,
  );
  console.log('  Login de ejemplo: colaborador001@palos-de-lena.dev / TestPass123!');
  console.log('  GET /api/attendance/collaborators?page=1&pageSize=20');
}
