import {
  ArlRiskLevel,
  ContractTerminationReason,
  CostCenter,
  DocumentType,
  EmployeeContractType,
  FinalSettlementMode,
  FinalSettlementStatus,
  LaborClassification,
  PrismaClient,
  SalaryType,
  SettlementLineOrigin,
  SettlementLineType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { syncEmployeeCompensationHistory } from './employee-compensation-history.seed-util';
import {
  seedRehireHistory,
  syncEmployeeContractHistory,
} from './employee-contract-history.seed-util';

const SALT_ROUNDS = 12;

export type Os591SeedParams = {
  tenantId: string;
  /** userId del empleado INDEFINIDO ya sembrado por seedEmployeeDetails (owner demo). */
  indefinidoEmployeeUserId: string;
  /** userId del empleado FIJO ya sembrado por seedEmployeeDetails (operator demo). */
  fijoEmployeeUserId: string;
  locationId: string;
  roleId: string;
};

/**
 * OS-591 (fase 1) — casos idempotentes mínimos para historial contractual y prima de
 * servicios. NO crea ningún modelo de liquidación definitiva (eso es fase 2) ni conecta
 * nada con desactivación de empleados. Ver tasks/OS-591.md.
 */
export async function seedOs591Fixtures(
  prisma: PrismaClient,
  params: Os591SeedParams,
): Promise<void> {
  // ── 1. Historial contractual de los empleados demo existentes (INDEFINIDO/FIJO) ─────────
  // Estos EmployeeDetails se siembran vía prisma.employeeDetails.upsert directo (no pasan por
  // PayrollRepository.create), así que no disparan createInitialContractTx — se sincronizan
  // aquí explícitamente, mismo criterio que syncEmployeeCompensationHistory.
  const indefinidoEmployee = await prisma.employeeDetails.findUniqueOrThrow({
    where: { userId: params.indefinidoEmployeeUserId },
  });
  await syncEmployeeContractHistory(prisma, indefinidoEmployee);

  const fijoEmployee = await prisma.employeeDetails.findUniqueOrThrow({
    where: { userId: params.fijoEmployeeUserId },
  });
  await syncEmployeeContractHistory(prisma, fijoEmployee);

  // ── 2. Contrato por obra o labor + recontratación histórica ─────────────────────────────
  // Un solo empleado nuevo demuestra ambos casos: un primer contrato OBRA que terminó por
  // vencimiento del término y una recontratación (segundo contrato OBRA, ACTIVO hoy).
  const obraPasswordHash = await bcrypt.hash('TestPass123!', SALT_ROUNDS);
  const obraPinHash = await bcrypt.hash('5678', SALT_ROUNDS);

  const obraGlobalUser = await prisma.user.upsert({
    where: { tenantId_cedula: { tenantId: params.tenantId, cedula: '77889900' } },
    update: {
      email: 'ricardo.obra@palos-de-lena.dev',
      passwordHash: obraPasswordHash,
      documentType: DocumentType.CC,
      roleId: params.roleId,
      isActive: true,
      emailVerified: true,
    },
    create: {
      tenantId: params.tenantId,
      cedula: '77889900',
      documentType: DocumentType.CC,
      email: 'ricardo.obra@palos-de-lena.dev',
      passwordHash: obraPasswordHash,
      roleId: params.roleId,
      isActive: true,
      emailVerified: true,
    },
  });

  const obraEmployee = await prisma.employeeDetails.upsert({
    where: { userId: obraGlobalUser.id },
    update: {
      isActive: true,
      pinHash: obraPinHash,
      name: 'Ricardo Obra',
      contractType: EmployeeContractType.OBRA,
      contractStart: new Date('2026-01-15'),
      contractEnd: new Date('2026-06-15'),
    },
    create: {
      userId: obraGlobalUser.id,
      tenantId: params.tenantId,
      name: 'Ricardo Obra',
      locationId: params.locationId,
      position: 'Auxiliar de Obra',
      area: 'Producción',
      department: 'Producción',
      contractType: EmployeeContractType.OBRA,
      hireDate: new Date('2026-01-15'),
      contractStart: new Date('2026-01-15'),
      contractEnd: new Date('2026-06-15'),
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: 1750905.0,
      hasTransportSubsidy: true,
      isExemptFromTax: false,
      epsName: 'Sura',
      pensionFundName: 'Protección',
      cesantiasFundName: 'Protección',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_III,
      cajaCompensacion: 'Comfama',
      costCenter: CostCenter.PLANTA,
      laborClassification: LaborClassification.COCINA,
      pinHash: obraPinHash,
      isActive: true,
    },
  });
  await syncEmployeeCompensationHistory(prisma, obraEmployee);
  await syncEmployeeContractHistory(prisma, obraEmployee);

  // Recontratación: el contrato OBRA sembrado arriba ("2026-01-15") se cierra por
  // vencimiento y se abre uno nuevo — deja dos filas en employment_contracts para el mismo
  // empleado (una TERMINADO, una ACTIVO), el caso que el ticket pide cubrir explícitamente.
  await seedRehireHistory(prisma, {
    tenantId: params.tenantId,
    employeeDetailsId: obraEmployee.id,
    previousTerminationDate: new Date('2026-06-15'),
    previousTerminationReason: ContractTerminationReason.VENCIMIENTO_TERMINO,
    newContract: {
      contractType: EmployeeContractType.OBRA,
      startDate: new Date('2026-06-16'),
      agreedEndDate: new Date('2026-12-16'),
    },
  });
  // El snapshot vigente de EmployeeDetails debe reflejar el contrato nuevo (ACTIVO), no el
  // ya terminado — mismo criterio que un update real vía PayrollRepository.
  await prisma.employeeDetails.update({
    where: { id: obraEmployee.id },
    data: { contractStart: new Date('2026-06-16'), contractEnd: new Date('2026-12-16') },
  });

  // ── 3. Prima de servicios — parcial, pagada y con sobrepago ─────────────────────────────
  // Valores estáticos (fixture de prueba, NO calculados con PrimaCalculationService — el
  // propósito es tener casos de estado ya persistidos para pruebas manuales/E2E, igual
  // criterio que otros seeds de este archivo que no recalculan con el motor real).
  await prisma.primaLiquidation.upsert({
    where: {
      employeeId_year_half: { employeeId: fijoEmployee.id, year: 2026, half: 'PRIMER_SEMESTRE' },
    },
    update: {},
    create: {
      tenantId: params.tenantId,
      employeeId: fijoEmployee.id,
      year: 2026,
      half: 'PRIMER_SEMESTRE',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-06-30'),
      accrualDays: 180,
      calculationBase: 1800000,
      accruedAmount: 900000,
      paidAmount: 450000, // prima parcial: la mitad ya pagada, saldo pendiente 450000
      divisorSnapshot: 180,
      status: 'CALCULADA',
    },
  });

  await prisma.primaLiquidation.upsert({
    where: {
      employeeId_year_half: {
        employeeId: indefinidoEmployee.id,
        year: 2025,
        half: 'SEGUNDO_SEMESTRE',
      },
    },
    update: {},
    create: {
      tenantId: params.tenantId,
      employeeId: indefinidoEmployee.id,
      year: 2025,
      half: 'SEGUNDO_SEMESTRE',
      periodStart: new Date('2025-07-01'),
      periodEnd: new Date('2025-12-31'),
      accrualDays: 180,
      calculationBase: 15000000,
      accruedAmount: 7500000,
      paidAmount: 7500000, // prima pagada en su totalidad
      divisorSnapshot: 180,
      status: 'PAGADA',
    },
  });

  await prisma.primaLiquidation.upsert({
    where: {
      employeeId_year_half: { employeeId: obraEmployee.id, year: 2026, half: 'PRIMER_SEMESTRE' },
    },
    update: {},
    create: {
      tenantId: params.tenantId,
      employeeId: obraEmployee.id,
      year: 2026,
      half: 'PRIMER_SEMESTRE',
      periodStart: new Date('2026-01-15'),
      periodEnd: new Date('2026-06-15'),
      accrualDays: 150,
      calculationBase: 1750905,
      accruedAmount: 729544, // ~150/180 de un semestre
      paidAmount: 800000, // sobrepago deliberado (fixture del caso "prima con sobrepago")
      divisorSnapshot: 180,
      status: 'PAGADA',
    },
  });

  console.log('OS-591: historial contractual y prima de servicios sembrados (fixtures fase 1)');
}

// ─────────────────────────────────────────────────────────────────────────────
// OS-591 (fase 2) — Fixtures de liquidaciones definitivas.
//
// Crea 5 empleados demo específicos para demostrar los 10 escenarios requeridos:
//   1. RENUNCIA               → emp_liq_bajo (VOIDED — causal sin indemnización)
//   2. JUSTA_CAUSA            → emp_liq_bajo (VOIDED — causal sin indemnización)
//   3. INDEFINIDO < 10 SMLMV  → emp_liq_bajo (CALCULATED — SIN_JUSTA_CAUSA, tabla baja)
//   4. INDEFINIDO = 10 SMLMV  → emp_liq_igual (CALCULATED — umbral exacto)
//   5. INDEFINIDO > 10 SMLMV  → indefinidoEmployee (CALCULATED — tabla alta)
//   6. FIJO con plazo restante → fijoEmployee (CALCULATED — días × salario diario)
//   7. OBRA mínimo 15 días    → obraEmployee (CALCULATED — mínimo legal)
//   8. Deducciones manuales   → emp_liq_deducciones (CALCULATED + línea DEDUCCION)
//   9. Liquidación MANUAL     → emp_liq_manual (mode=MANUAL, todos los campos)
//  10. Empleado con variable  → emp_liq_variable (CALCULATED + warnings de promedio var.)
//
// Todos los montos son fixtures estáticos aproximados — no calculados con el motor real.
// La idempotencia se garantiza con `findFirst` + creación condicional (no hay @@unique
// natural para FinalSettlement salvo por el contractId + status no-VOIDED).
// ─────────────────────────────────────────────────────────────────────────────

type Phase2EmployeeSpec = {
  cedula: string;
  email: string;
  name: string;
  contractType: EmployeeContractType;
  salaryAmount: number;
  contractStart: Date;
  contractEnd?: Date;
  hasTransportSubsidy?: boolean;
};

async function upsertLiquidationDemoEmployee(
  prisma: PrismaClient,
  params: Os591SeedParams,
  spec: Phase2EmployeeSpec,
  passwordHash: string,
  pinHash: string,
) {
  const user = await prisma.user.upsert({
    where: { tenantId_cedula: { tenantId: params.tenantId, cedula: spec.cedula } },
    update: { email: spec.email, passwordHash, isActive: true, emailVerified: true },
    create: {
      tenantId: params.tenantId,
      cedula: spec.cedula,
      documentType: DocumentType.CC,
      email: spec.email,
      passwordHash,
      roleId: params.roleId,
      isActive: true,
      emailVerified: true,
    },
  });

  const employee = await prisma.employeeDetails.upsert({
    where: { userId: user.id },
    update: { isActive: true, pinHash },
    create: {
      userId: user.id,
      tenantId: params.tenantId,
      name: spec.name,
      locationId: params.locationId,
      position: 'Demo Liquidación',
      area: 'Demo',
      department: 'Demo',
      contractType: spec.contractType,
      hireDate: spec.contractStart,
      contractStart: spec.contractStart,
      contractEnd: spec.contractEnd ?? null,
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: spec.salaryAmount,
      hasTransportSubsidy: spec.hasTransportSubsidy ?? false,
      isExemptFromTax: false,
      epsName: 'Sura',
      pensionFundName: 'Protección',
      cesantiasFundName: 'Protección',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_I,
      cajaCompensacion: 'Comfama',
      costCenter: CostCenter.ADMINISTRACION,
      laborClassification: LaborClassification.SERVICIO,
      pinHash,
      isActive: true,
    },
  });

  await syncEmployeeCompensationHistory(prisma, employee);
  await syncEmployeeContractHistory(prisma, employee);
  return employee;
}

/** Encuentra el contrato ACTIVO del empleado (requerido para crear el settlement). */
async function findActiveContractOrThrow(
  prisma: PrismaClient,
  tenantId: string,
  employeeId: string,
) {
  const contract = await prisma.employmentContract.findFirst({
    where: { tenantId, employeeDetailsId: employeeId, status: 'ACTIVO' },
  });
  if (!contract)
    throw new Error(`OS-591 seed: no ACTIVO contract found for employee ${employeeId}`);
  return contract;
}

/** Idempotencia: crea la liquidación solo si no existe una no-VOIDED para el mismo contrato. */
async function createSettlementIfAbsent(
  prisma: PrismaClient,
  data: Parameters<PrismaClient['finalSettlement']['create']>[0]['data'],
): Promise<void> {
  const existing = await prisma.finalSettlement.findFirst({
    where: {
      tenantId: data.tenantId as string,
      contractId: data.contractId as string,
      status: { not: FinalSettlementStatus.VOIDED },
    },
  });
  if (!existing) {
    await prisma.finalSettlement.create({ data });
  }
}

export async function seedOs591Phase2Fixtures(
  prisma: PrismaClient,
  params: Os591SeedParams,
): Promise<void> {
  const passwordHash = await bcrypt.hash('TestPass123!', 10);
  const pinHash = await bcrypt.hash('9999', 10);

  // ── Empleados demo para escenarios 1-4, 8-10 ──────────────────────────────

  const empBajo = await upsertLiquidationDemoEmployee(
    prisma,
    params,
    {
      cedula: '11223301',
      email: 'liq.bajo@palos-de-lena.dev',
      name: 'Liq Demo Bajo SMLMV',
      contractType: EmployeeContractType.INDEFINIDO,
      salaryAmount: 2_000_000,
      contractStart: new Date('2022-01-01'),
      hasTransportSubsidy: true,
    },
    passwordHash,
    pinHash,
  );

  const empIgual = await upsertLiquidationDemoEmployee(
    prisma,
    params,
    {
      cedula: '11223302',
      email: 'liq.igual@palos-de-lena.dev',
      name: 'Liq Demo Igual 10 SMLMV',
      contractType: EmployeeContractType.INDEFINIDO,
      salaryAmount: 13_000_000,
      contractStart: new Date('2022-01-01'),
    },
    passwordHash,
    pinHash,
  );

  const empDeducciones = await upsertLiquidationDemoEmployee(
    prisma,
    params,
    {
      cedula: '11223303',
      email: 'liq.deducciones@palos-de-lena.dev',
      name: 'Liq Demo Deducciones Manuales',
      contractType: EmployeeContractType.INDEFINIDO,
      salaryAmount: 2_500_000,
      contractStart: new Date('2021-06-01'),
      hasTransportSubsidy: true,
    },
    passwordHash,
    pinHash,
  );

  const empManual = await upsertLiquidationDemoEmployee(
    prisma,
    params,
    {
      cedula: '11223304',
      email: 'liq.manual@palos-de-lena.dev',
      name: 'Liq Demo Liquidacion Manual',
      contractType: EmployeeContractType.INDEFINIDO,
      salaryAmount: 3_000_000,
      contractStart: new Date('2020-03-15'),
    },
    passwordHash,
    pinHash,
  );

  const empVariable = await upsertLiquidationDemoEmployee(
    prisma,
    params,
    {
      cedula: '11223305',
      email: 'liq.variable@palos-de-lena.dev',
      name: 'Liq Demo Variable Income',
      contractType: EmployeeContractType.INDEFINIDO,
      salaryAmount: 2_200_000,
      contractStart: new Date('2021-01-01'),
      hasTransportSubsidy: true,
    },
    passwordHash,
    pinHash,
  );

  // ── Empleados ya existentes (de fase 1) ───────────────────────────────────
  const indefinidoEmployee = await prisma.employeeDetails.findUniqueOrThrow({
    where: { userId: params.indefinidoEmployeeUserId },
  });
  const fijoEmployee = await prisma.employeeDetails.findUniqueOrThrow({
    where: { userId: params.fijoEmployeeUserId },
  });
  // obraEmployee sembrado en fase 1 con cédula 77889900
  const obraUser = await prisma.user.findFirst({
    where: { tenantId: params.tenantId, cedula: '77889900' },
  });
  const obraEmployee = obraUser
    ? await prisma.employeeDetails.findUnique({ where: { userId: obraUser.id } })
    : null;

  // ── Resolver contratos ACTIVOS ─────────────────────────────────────────────
  const contractBajo = await findActiveContractOrThrow(prisma, params.tenantId, empBajo.id);
  const contractIgual = await findActiveContractOrThrow(prisma, params.tenantId, empIgual.id);
  const contractDeducciones = await findActiveContractOrThrow(
    prisma,
    params.tenantId,
    empDeducciones.id,
  );
  const contractManual = await findActiveContractOrThrow(prisma, params.tenantId, empManual.id);
  const contractVariable = await findActiveContractOrThrow(prisma, params.tenantId, empVariable.id);
  const contractIndefinidoAlto = await prisma.employmentContract.findFirst({
    where: {
      tenantId: params.tenantId,
      employeeDetailsId: indefinidoEmployee.id,
      status: 'ACTIVO',
    },
  });
  const contractFijo = await prisma.employmentContract.findFirst({
    where: { tenantId: params.tenantId, employeeDetailsId: fijoEmployee.id, status: 'ACTIVO' },
  });
  const contractObra = obraEmployee
    ? await prisma.employmentContract.findFirst({
        where: { tenantId: params.tenantId, employeeDetailsId: obraEmployee.id, status: 'ACTIVO' },
      })
    : null;

  const SMLMV = '1300000.00';
  const TRANSPORT_SUBSIDY = '162000.00';
  const FORMULA_VERSION = 1;
  const TERMINATION_DATE_2024 = new Date('2024-06-30');
  const AUDIT_CALCULATED = JSON.stringify([
    {
      event: 'DRAFT_CREATED',
      actor: 'seed-os591',
      timestamp: new Date().toISOString(),
      detail: 'Seed OS-591 fase 2',
    },
    {
      event: 'CALCULATED',
      actor: 'seed-os591',
      timestamp: new Date().toISOString(),
      detail: 'Cálculo automático',
    },
  ]);
  const AUDIT_VOIDED = JSON.stringify([
    { event: 'DRAFT_CREATED', actor: 'seed-os591', timestamp: new Date().toISOString() },
    {
      event: 'VOIDED',
      actor: 'seed-os591',
      timestamp: new Date().toISOString(),
      detail: 'Anulado para reseed',
    },
  ]);

  // ── Escenarios 1 & 2: RENUNCIA + JUSTA_CAUSA → VOIDED (emp_bajo, sin indemnización)
  // Se crean como VOIDED directamente — no ocupan el slot activo y sirven de historial.
  await prisma.finalSettlement.createMany({
    data: [
      {
        tenantId: params.tenantId,
        employeeDetailsId: empBajo.id,
        contractId: contractBajo.id,
        effectiveTerminationDate: new Date('2023-12-31'),
        terminationReason: ContractTerminationReason.RENUNCIA,
        status: FinalSettlementStatus.VOIDED,
        mode: FinalSettlementMode.AUTOMATIC,
        snapshotContractType: EmployeeContractType.INDEFINIDO,
        snapshotContractStartDate: new Date('2022-01-01'),
        snapshotAgreedEndDate: null,
        snapshotSalaryType: SalaryType.ORDINARIO,
        snapshotSalaryAmount: '2000000.00',
        snapshotSmlvAmount: SMLMV,
        snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
        snapshotFormulaVersion: FORMULA_VERSION,
        snapshotVariableAvgMonthsCovered: 0,
        snapshotVariableAvgTotal: '0.00',
        snapshotVariableAvgMonthly: '0.00',
        grossDevengados: '5000000.00',
        totalDeducciones: '0.00',
        netAmount: '5000000.00',
        acceptedWarnings: JSON.stringify([]),
        auditTrail: AUDIT_VOIDED,
        voidedBy: 'seed-os591',
        voidedAt: new Date(),
        voidReason: 'Fixture histórico — escenario RENUNCIA',
      },
      {
        tenantId: params.tenantId,
        employeeDetailsId: empBajo.id,
        contractId: contractBajo.id,
        effectiveTerminationDate: new Date('2023-12-31'),
        terminationReason: ContractTerminationReason.JUSTA_CAUSA,
        status: FinalSettlementStatus.VOIDED,
        mode: FinalSettlementMode.AUTOMATIC,
        snapshotContractType: EmployeeContractType.INDEFINIDO,
        snapshotContractStartDate: new Date('2022-01-01'),
        snapshotAgreedEndDate: null,
        snapshotSalaryType: SalaryType.ORDINARIO,
        snapshotSalaryAmount: '2000000.00',
        snapshotSmlvAmount: SMLMV,
        snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
        snapshotFormulaVersion: FORMULA_VERSION,
        snapshotVariableAvgMonthsCovered: 0,
        snapshotVariableAvgTotal: '0.00',
        snapshotVariableAvgMonthly: '0.00',
        grossDevengados: '4500000.00',
        totalDeducciones: '0.00',
        netAmount: '4500000.00',
        acceptedWarnings: JSON.stringify([]),
        auditTrail: AUDIT_VOIDED,
        voidedBy: 'seed-os591',
        voidedAt: new Date(),
        voidReason: 'Fixture histórico — escenario JUSTA_CAUSA',
      },
    ],
    skipDuplicates: true,
  });

  // ── Escenario 3: INDEFINIDO < 10 SMLMV, SIN_JUSTA_CAUSA (emp_bajo) ───────
  // Salario 2M (< 10 × 1.3M = 13M). Antigüedad ~2.5 años.
  // Tabla baja: 30 días + 20 días por año completo adicional.
  // ~2.5 años → 30 + 20 + 10 (frac) = 60 días; indem = 60 × (2M/30) = 4,000,000
  await createSettlementIfAbsent(prisma, {
    tenantId: params.tenantId,
    employeeDetailsId: empBajo.id,
    contractId: contractBajo.id,
    effectiveTerminationDate: TERMINATION_DATE_2024,
    terminationReason: ContractTerminationReason.SIN_JUSTA_CAUSA,
    status: FinalSettlementStatus.CALCULATED,
    mode: FinalSettlementMode.AUTOMATIC,
    snapshotContractType: EmployeeContractType.INDEFINIDO,
    snapshotContractStartDate: new Date('2022-01-01'),
    snapshotAgreedEndDate: null,
    snapshotSalaryType: SalaryType.ORDINARIO,
    snapshotSalaryAmount: '2000000.00',
    snapshotSmlvAmount: SMLMV,
    snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
    snapshotFormulaVersion: FORMULA_VERSION,
    snapshotVariableAvgMonthsCovered: 0,
    snapshotVariableAvgTotal: '0.00',
    snapshotVariableAvgMonthly: '0.00',
    grossDevengados: '9000000.00',
    totalDeducciones: '0.00',
    netAmount: '9000000.00',
    acceptedWarnings: JSON.stringify([]),
    auditTrail: AUDIT_CALCULATED,
    calculatedBy: 'seed-os591',
    calculatedAt: new Date(),
    lines: {
      create: [
        {
          tenantId: params.tenantId,
          code: 'SAL_PENDIENTE',
          name: 'Salario pendiente',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '2000000.00',
          sortOrder: 10,
        },
        {
          tenantId: params.tenantId,
          code: 'CESANTIAS',
          name: 'Cesantías (saldo pendiente)',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '500000.00',
          sortOrder: 20,
        },
        {
          tenantId: params.tenantId,
          code: 'INTERESES_CESANTIAS',
          name: 'Intereses cesantías',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '60000.00',
          sortOrder: 25,
        },
        {
          tenantId: params.tenantId,
          code: 'PRIMA',
          name: 'Prima de servicios',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '440000.00',
          sortOrder: 30,
        },
        {
          tenantId: params.tenantId,
          code: 'VACACIONES',
          name: 'Vacaciones pendientes',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '2000000.00',
          sortOrder: 40,
        },
        {
          tenantId: params.tenantId,
          code: 'INDEMNIZACION',
          name: 'Indemnización SJC — tabla baja',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '4000000.00',
          metadata: JSON.stringify({
            appliedRule: 'INDEFINIDO_BAJO:SIN_JUSTA_CAUSA:antigüedad < 1 año',
            formulaVersion: 1,
          }),
          sortOrder: 50,
        },
      ],
    },
  } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);

  // ── Escenario 4: INDEFINIDO = 10 SMLMV, SIN_JUSTA_CAUSA (emp_igual) ───────
  // Salario 13M = 10 × 1.3M. Tabla ALTO.
  // ~2.5 años → 20 + 15 + 7.5 = ~42.5 días; indem = 42 × (13M/30) = 18,200,000 (aprox)
  await createSettlementIfAbsent(prisma, {
    tenantId: params.tenantId,
    employeeDetailsId: empIgual.id,
    contractId: contractIgual.id,
    effectiveTerminationDate: TERMINATION_DATE_2024,
    terminationReason: ContractTerminationReason.SIN_JUSTA_CAUSA,
    status: FinalSettlementStatus.CALCULATED,
    mode: FinalSettlementMode.AUTOMATIC,
    snapshotContractType: EmployeeContractType.INDEFINIDO,
    snapshotContractStartDate: new Date('2022-01-01'),
    snapshotAgreedEndDate: null,
    snapshotSalaryType: SalaryType.ORDINARIO,
    snapshotSalaryAmount: '13000000.00',
    snapshotSmlvAmount: SMLMV,
    snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
    snapshotFormulaVersion: FORMULA_VERSION,
    snapshotVariableAvgMonthsCovered: 0,
    snapshotVariableAvgTotal: '0.00',
    snapshotVariableAvgMonthly: '0.00',
    grossDevengados: '24000000.00',
    totalDeducciones: '0.00',
    netAmount: '24000000.00',
    acceptedWarnings: JSON.stringify([]),
    auditTrail: AUDIT_CALCULATED,
    calculatedBy: 'seed-os591',
    calculatedAt: new Date(),
    lines: {
      create: [
        {
          tenantId: params.tenantId,
          code: 'SAL_PENDIENTE',
          name: 'Salario pendiente',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '4333333.00',
          sortOrder: 10,
        },
        {
          tenantId: params.tenantId,
          code: 'CESANTIAS',
          name: 'Cesantías',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '1000000.00',
          sortOrder: 20,
        },
        {
          tenantId: params.tenantId,
          code: 'PRIMA',
          name: 'Prima',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '466667.00',
          sortOrder: 30,
        },
        {
          tenantId: params.tenantId,
          code: 'VACACIONES',
          name: 'Vacaciones',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '8666667.00',
          sortOrder: 40,
        },
        {
          tenantId: params.tenantId,
          code: 'INDEMNIZACION',
          name: 'Indemnización SJC — tabla alto (exactamente umbral)',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '18200000.00',
          metadata: JSON.stringify({
            appliedRule: 'INDEFINIDO_ALTO:SIN_JUSTA_CAUSA',
            formulaVersion: 1,
          }),
          sortOrder: 50,
        },
      ],
    },
  } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);

  // ── Escenario 5: INDEFINIDO > 10 SMLMV (indefinidoEmployee, salary 15M) ──
  if (contractIndefinidoAlto) {
    await createSettlementIfAbsent(prisma, {
      tenantId: params.tenantId,
      employeeDetailsId: indefinidoEmployee.id,
      contractId: contractIndefinidoAlto.id,
      effectiveTerminationDate: TERMINATION_DATE_2024,
      terminationReason: ContractTerminationReason.SIN_JUSTA_CAUSA,
      status: FinalSettlementStatus.CALCULATED,
      mode: FinalSettlementMode.AUTOMATIC,
      snapshotContractType: EmployeeContractType.INDEFINIDO,
      snapshotContractStartDate: contractIndefinidoAlto.startDate,
      snapshotAgreedEndDate: null,
      snapshotSalaryType: SalaryType.ORDINARIO,
      snapshotSalaryAmount: '15000000.00',
      snapshotSmlvAmount: SMLMV,
      snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
      snapshotFormulaVersion: FORMULA_VERSION,
      snapshotVariableAvgMonthsCovered: 0,
      snapshotVariableAvgTotal: '0.00',
      snapshotVariableAvgMonthly: '0.00',
      grossDevengados: '42000000.00',
      totalDeducciones: '0.00',
      netAmount: '42000000.00',
      acceptedWarnings: JSON.stringify([]),
      auditTrail: AUDIT_CALCULATED,
      calculatedBy: 'seed-os591',
      calculatedAt: new Date(),
      lines: {
        create: [
          {
            tenantId: params.tenantId,
            code: 'SAL_PENDIENTE',
            name: 'Salario pendiente',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '5000000.00',
            sortOrder: 10,
          },
          {
            tenantId: params.tenantId,
            code: 'CESANTIAS',
            name: 'Cesantías',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '2000000.00',
            sortOrder: 20,
          },
          {
            tenantId: params.tenantId,
            code: 'PRIMA',
            name: 'Prima',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '1000000.00',
            sortOrder: 30,
          },
          {
            tenantId: params.tenantId,
            code: 'VACACIONES',
            name: 'Vacaciones',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '14000000.00',
            sortOrder: 40,
          },
          {
            tenantId: params.tenantId,
            code: 'INDEMNIZACION',
            name: 'Indemnización SJC — tabla alto (> umbral)',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '17500000.00',
            metadata: JSON.stringify({
              appliedRule: 'INDEFINIDO_ALTO:SIN_JUSTA_CAUSA',
              formulaVersion: 1,
            }),
            sortOrder: 50,
          },
          {
            tenantId: params.tenantId,
            code: 'INTERESES_CESANTIAS',
            name: 'Intereses cesantías',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '2500000.00',
            sortOrder: 25,
          },
        ],
      },
    } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);
  }

  // ── Escenario 6: FIJO con plazo restante (fijoEmployee, salary 1.8M) ──────
  // La fecha pactada de fin era 2025-12-31; terminación anticipada 2024-06-30 → 184 días restantes.
  // Indem = 184 × (1.8M/30) = 11,040,000
  if (contractFijo) {
    await createSettlementIfAbsent(prisma, {
      tenantId: params.tenantId,
      employeeDetailsId: fijoEmployee.id,
      contractId: contractFijo.id,
      effectiveTerminationDate: TERMINATION_DATE_2024,
      terminationReason: ContractTerminationReason.SIN_JUSTA_CAUSA,
      status: FinalSettlementStatus.CALCULATED,
      mode: FinalSettlementMode.AUTOMATIC,
      snapshotContractType: EmployeeContractType.FIJO,
      snapshotContractStartDate: contractFijo.startDate,
      snapshotAgreedEndDate: new Date('2025-12-31'),
      snapshotSalaryType: SalaryType.ORDINARIO,
      snapshotSalaryAmount: '1800000.00',
      snapshotSmlvAmount: SMLMV,
      snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
      snapshotFormulaVersion: FORMULA_VERSION,
      snapshotVariableAvgMonthsCovered: 0,
      snapshotVariableAvgTotal: '0.00',
      snapshotVariableAvgMonthly: '0.00',
      grossDevengados: '14240000.00',
      totalDeducciones: '0.00',
      netAmount: '14240000.00',
      acceptedWarnings: JSON.stringify([]),
      auditTrail: AUDIT_CALCULATED,
      calculatedBy: 'seed-os591',
      calculatedAt: new Date(),
      lines: {
        create: [
          {
            tenantId: params.tenantId,
            code: 'SAL_PENDIENTE',
            name: 'Salario pendiente',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '1800000.00',
            sortOrder: 10,
          },
          {
            tenantId: params.tenantId,
            code: 'CESANTIAS',
            name: 'Cesantías',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '300000.00',
            sortOrder: 20,
          },
          {
            tenantId: params.tenantId,
            code: 'PRIMA',
            name: 'Prima',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '100000.00',
            sortOrder: 30,
          },
          {
            tenantId: params.tenantId,
            code: 'VACACIONES',
            name: 'Vacaciones',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '240000.00',
            sortOrder: 40,
          },
          {
            tenantId: params.tenantId,
            code: 'INDEMNIZACION',
            name: 'Indemnización FIJO — días restantes hasta fecha pactada',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '11040000.00',
            metadata: JSON.stringify({
              appliedRule: 'FIJO:SIN_JUSTA_CAUSA',
              formulaVersion: 1,
              remainingDays: 184,
            }),
            sortOrder: 50,
          },
          {
            tenantId: params.tenantId,
            code: 'INTERESES_CESANTIAS',
            name: 'Intereses cesantías',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '36000.00',
            sortOrder: 25,
          },
          {
            tenantId: params.tenantId,
            code: 'TRANSPORTE',
            name: 'Auxilio de transporte',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '324000.00',
            sortOrder: 15,
          },
          {
            tenantId: params.tenantId,
            code: 'SALUD',
            name: 'Descuento salud 4%',
            type: SettlementLineType.DEDUCCION,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '72000.00',
            sortOrder: 100,
          },
          {
            tenantId: params.tenantId,
            code: 'PENSION',
            name: 'Descuento pensión 4%',
            type: SettlementLineType.DEDUCCION,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '72000.00',
            sortOrder: 101,
          },
          {
            tenantId: params.tenantId,
            code: 'TOTAL_DEDUCCIONES',
            name: 'Total deducciones legales',
            type: SettlementLineType.DEDUCCION,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '400000.00',
            sortOrder: 199,
          },
        ],
      },
    } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);
  }

  // ── Escenario 7: OBRA con mínimo 15 días (obraEmployee) ───────────────────
  // Días estimados restantes = 10; mínimo legal = 15. Indem = 15 × (1.75M/30) = 875,000
  if (contractObra && obraEmployee) {
    await createSettlementIfAbsent(prisma, {
      tenantId: params.tenantId,
      employeeDetailsId: obraEmployee.id,
      contractId: contractObra.id,
      effectiveTerminationDate: TERMINATION_DATE_2024,
      terminationReason: ContractTerminationReason.SIN_JUSTA_CAUSA,
      status: FinalSettlementStatus.CALCULATED,
      mode: FinalSettlementMode.AUTOMATIC,
      snapshotContractType: EmployeeContractType.OBRA,
      snapshotContractStartDate: contractObra.startDate,
      snapshotAgreedEndDate: null,
      snapshotSalaryType: SalaryType.ORDINARIO,
      snapshotSalaryAmount: '1750905.00',
      snapshotSmlvAmount: SMLMV,
      snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
      snapshotFormulaVersion: FORMULA_VERSION,
      snapshotVariableAvgMonthsCovered: 0,
      snapshotVariableAvgTotal: '0.00',
      snapshotVariableAvgMonthly: '0.00',
      grossDevengados: '3775905.00',
      totalDeducciones: '0.00',
      netAmount: '3775905.00',
      acceptedWarnings: JSON.stringify([
        'obra_labor_below_minimum — 10 días estimados < 15, se aplica mínimo legal',
      ]),
      auditTrail: AUDIT_CALCULATED,
      calculatedBy: 'seed-os591',
      calculatedAt: new Date(),
      lines: {
        create: [
          {
            tenantId: params.tenantId,
            code: 'SAL_PENDIENTE',
            name: 'Salario pendiente',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '1750905.00',
            sortOrder: 10,
          },
          {
            tenantId: params.tenantId,
            code: 'CESANTIAS',
            name: 'Cesantías',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '250000.00',
            sortOrder: 20,
          },
          {
            tenantId: params.tenantId,
            code: 'PRIMA',
            name: 'Prima',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '900000.00',
            sortOrder: 30,
          },
          {
            tenantId: params.tenantId,
            code: 'INDEMNIZACION',
            name: 'Indemnización OBRA — mínimo 15 días (estimados: 10)',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '875000.00',
            metadata: JSON.stringify({
              appliedRule: 'OBRA_LABOR:SIN_JUSTA_CAUSA:minimo_15_dias',
              formulaVersion: 1,
              estimatedRemainingDays: 10,
              appliedDays: 15,
            }),
            sortOrder: 50,
          },
        ],
      },
    } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);
  }

  // ── Escenario 8: Deducciones manuales (empDeducciones) ────────────────────
  await createSettlementIfAbsent(prisma, {
    tenantId: params.tenantId,
    employeeDetailsId: empDeducciones.id,
    contractId: contractDeducciones.id,
    effectiveTerminationDate: TERMINATION_DATE_2024,
    terminationReason: ContractTerminationReason.RENUNCIA,
    status: FinalSettlementStatus.CALCULATED,
    mode: FinalSettlementMode.AUTOMATIC,
    snapshotContractType: EmployeeContractType.INDEFINIDO,
    snapshotContractStartDate: new Date('2021-06-01'),
    snapshotAgreedEndDate: null,
    snapshotSalaryType: SalaryType.ORDINARIO,
    snapshotSalaryAmount: '2500000.00',
    snapshotSmlvAmount: SMLMV,
    snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
    snapshotFormulaVersion: FORMULA_VERSION,
    snapshotVariableAvgMonthsCovered: 0,
    snapshotVariableAvgTotal: '0.00',
    snapshotVariableAvgMonthly: '0.00',
    grossDevengados: '6000000.00',
    totalDeducciones: '800000.00',
    netAmount: '5200000.00',
    acceptedWarnings: JSON.stringify([]),
    auditTrail: AUDIT_CALCULATED,
    calculatedBy: 'seed-os591',
    calculatedAt: new Date(),
    lines: {
      create: [
        {
          tenantId: params.tenantId,
          code: 'SAL_PENDIENTE',
          name: 'Salario pendiente',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '2500000.00',
          sortOrder: 10,
        },
        {
          tenantId: params.tenantId,
          code: 'CESANTIAS',
          name: 'Cesantías',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '800000.00',
          sortOrder: 20,
        },
        {
          tenantId: params.tenantId,
          code: 'PRIMA',
          name: 'Prima',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '1250000.00',
          sortOrder: 30,
        },
        {
          tenantId: params.tenantId,
          code: 'VACACIONES',
          name: 'Vacaciones',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '1450000.00',
          sortOrder: 40,
        },
        // Deducciones manuales — requieren manualJustification
        {
          tenantId: params.tenantId,
          code: 'ANTICIPO_DEDUC',
          name: 'Anticipo de nómina no recuperado',
          type: SettlementLineType.DEDUCCION,
          origin: SettlementLineOrigin.MANUAL,
          amount: '500000.00',
          manualJustification:
            'Anticipo otorgado el 2024-03-15, no descontado en nóminas posteriores',
          sortOrder: 100,
        },
        {
          tenantId: params.tenantId,
          code: 'SOBREPAGO_PRIMA',
          name: 'Sobrepago de prima — semestre anterior',
          type: SettlementLineType.DEDUCCION,
          origin: SettlementLineOrigin.MANUAL,
          amount: '300000.00',
          manualJustification:
            'Prima 2023-S2 pagada en exceso según reliquidación aprobada por RR.HH.',
          sortOrder: 101,
        },
      ],
    },
  } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);

  // ── Escenario 9: Liquidación MANUAL completa (empManual) ──────────────────
  await createSettlementIfAbsent(prisma, {
    tenantId: params.tenantId,
    employeeDetailsId: empManual.id,
    contractId: contractManual.id,
    effectiveTerminationDate: TERMINATION_DATE_2024,
    terminationReason: ContractTerminationReason.MUTUO_ACUERDO,
    status: FinalSettlementStatus.CALCULATED,
    mode: FinalSettlementMode.MANUAL,
    manualJustification: 'Liquidación por mutuo acuerdo documentado en acta firmada por las partes',
    manualReference: 'ACTA-2024-042',
    manualResponsible: 'Gerencia de Recursos Humanos',
    snapshotContractType: EmployeeContractType.INDEFINIDO,
    snapshotContractStartDate: new Date('2020-03-15'),
    snapshotAgreedEndDate: null,
    snapshotSalaryType: SalaryType.ORDINARIO,
    snapshotSalaryAmount: '3000000.00',
    snapshotSmlvAmount: SMLMV,
    snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
    snapshotFormulaVersion: FORMULA_VERSION,
    snapshotVariableAvgMonthsCovered: 0,
    snapshotVariableAvgTotal: '0.00',
    snapshotVariableAvgMonthly: '0.00',
    grossDevengados: '8000000.00',
    totalDeducciones: '0.00',
    netAmount: '8000000.00',
    acceptedWarnings: JSON.stringify([]),
    auditTrail: JSON.stringify([
      {
        event: 'MANUAL_CREATED',
        actor: 'gerencia.rrhh',
        timestamp: new Date().toISOString(),
        detail: 'Creación manual — mutuo acuerdo ACTA-2024-042',
      },
    ]),
    createdBy: 'gerencia.rrhh',
    calculatedBy: 'gerencia.rrhh',
    calculatedAt: new Date(),
    lines: {
      create: [
        {
          tenantId: params.tenantId,
          code: 'SAL_PENDIENTE',
          name: 'Salario pendiente',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.MANUAL,
          amount: '3000000.00',
          manualJustification: 'Tramo salarial junio 2024 calculado manualmente',
          sortOrder: 10,
        },
        {
          tenantId: params.tenantId,
          code: 'CESANTIAS',
          name: 'Cesantías',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.MANUAL,
          amount: '2000000.00',
          manualJustification: 'Saldo de cesantías verificado con fondo Protección',
          sortOrder: 20,
        },
        {
          tenantId: params.tenantId,
          code: 'PRIMA',
          name: 'Prima',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.MANUAL,
          amount: '1500000.00',
          manualJustification: 'Prima proporcional S1-2024 calculada manualmente',
          sortOrder: 30,
        },
        {
          tenantId: params.tenantId,
          code: 'VACACIONES',
          name: 'Vacaciones',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.MANUAL,
          amount: '1500000.00',
          manualJustification: '30 días pendientes × salario diario',
          sortOrder: 40,
        },
      ],
    },
  } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);

  // ── Escenario 10: Empleado con ingresos variables (empVariable) ───────────
  // El promedio variable de 6 meses fue calculable — incluye warnings pero no blocks.
  await createSettlementIfAbsent(prisma, {
    tenantId: params.tenantId,
    employeeDetailsId: empVariable.id,
    contractId: contractVariable.id,
    effectiveTerminationDate: TERMINATION_DATE_2024,
    terminationReason: ContractTerminationReason.SIN_JUSTA_CAUSA,
    status: FinalSettlementStatus.CALCULATED,
    mode: FinalSettlementMode.AUTOMATIC,
    snapshotContractType: EmployeeContractType.INDEFINIDO,
    snapshotContractStartDate: new Date('2021-01-01'),
    snapshotAgreedEndDate: null,
    snapshotSalaryType: SalaryType.ORDINARIO,
    snapshotSalaryAmount: '2200000.00',
    snapshotSmlvAmount: SMLMV,
    snapshotTransportSubsidyAmount: TRANSPORT_SUBSIDY,
    snapshotFormulaVersion: FORMULA_VERSION,
    snapshotVariableAvgMonthsCovered: 6,
    snapshotVariableAvgTotal: '1200000.00',
    snapshotVariableAvgMonthly: '200000.00',
    grossDevengados: '11800000.00',
    totalDeducciones: '0.00',
    netAmount: '11800000.00',
    acceptedWarnings: JSON.stringify([
      'variable_avg_salary_change_within_window — hubo un cambio salarial dentro de los 6 meses del promedio, el monto puede ser aproximado',
    ]),
    auditTrail: JSON.stringify([
      { event: 'DRAFT_CREATED', actor: 'seed-os591', timestamp: new Date().toISOString() },
      {
        event: 'CALCULATED',
        actor: 'seed-os591',
        timestamp: new Date().toISOString(),
        detail: 'Cálculo automático con promedio variable de 6 meses',
      },
    ]),
    calculatedBy: 'seed-os591',
    calculatedAt: new Date(),
    lines: {
      create: [
        {
          tenantId: params.tenantId,
          code: 'SAL_PENDIENTE',
          name: 'Salario pendiente',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '2200000.00',
          sortOrder: 10,
        },
        {
          tenantId: params.tenantId,
          code: 'CESANTIAS',
          name: 'Cesantías (base con variable)',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '900000.00',
          metadata: JSON.stringify({ variableAvgIncluded: true, variableAvgMonthly: '200000.00' }),
          sortOrder: 20,
        },
        {
          tenantId: params.tenantId,
          code: 'PRIMA',
          name: 'Prima (base con variable)',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '1100000.00',
          metadata: JSON.stringify({ variableAvgIncluded: true }),
          sortOrder: 30,
        },
        {
          tenantId: params.tenantId,
          code: 'VACACIONES',
          name: 'Vacaciones pendientes',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '1600000.00',
          sortOrder: 40,
        },
        {
          tenantId: params.tenantId,
          code: 'INDEMNIZACION',
          name: 'Indemnización SJC — tabla baja',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '4400000.00',
          metadata: JSON.stringify({
            appliedRule: 'INDEFINIDO_BAJO:SIN_JUSTA_CAUSA',
            formulaVersion: 1,
          }),
          sortOrder: 50,
        },
        {
          tenantId: params.tenantId,
          code: 'HORAS_EXTRA',
          name: 'Horas extra pendientes (6 meses)',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '1200000.00',
          metadata: JSON.stringify({
            source: 'VariableAverageService',
            monthsCovered: 6,
            monthlyAverage: '200000.00',
          }),
          sortOrder: 45,
        },
        {
          tenantId: params.tenantId,
          code: 'INTERESES_CESANTIAS',
          name: 'Intereses cesantías',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '108000.00',
          sortOrder: 25,
        },
        {
          tenantId: params.tenantId,
          code: 'TRANSPORTE',
          name: 'Auxilio de transporte',
          type: SettlementLineType.DEVENGO,
          origin: SettlementLineOrigin.AUTOMATIC,
          amount: '292000.00',
          sortOrder: 15,
        },
      ],
    },
  } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);

  console.log('OS-591 fase 2: 10 escenarios de liquidaciones definitivas sembrados (fixtures)');
}

// ─────────────────────────────────────────────────────────────────────────────
// OS-591 (fase 3) — Fixtures del workflow productivo (validación legal, aprobación,
// pago, reconciliación de salario pendiente, bloqueo de desactivación). Ver
// tasks/OS-591.md §15. Reutiliza los empleados/liquidaciones de fase 2 — no crea
// datos redundantes salvo los dos casos que necesitan un estado final distinto
// (APPROVED/PAID), que requieren su propio contrato para no interferir con los
// escenarios "CALCULATED bloqueado" que la fase 2 ya demuestra.
//
//   a. Validación legal ACTIVA para INDEMNIZACION_FORMULA_VERSION=1 — habilita
//      aprobar cualquier liquidación AUTOMATIC con línea INDEMNIZACION que use
//      esa versión (escenarios 3-7, 10 de fase 2 siguen bloqueados solo por falta
//      de reconciliación de salario pendiente, no por la fórmula).
//   b. Reconciliación de salario pendiente para `empDeducciones` (escenario 8,
//      fase 2) — sin indemnización, así que tras reconciliar queda 100% lista
//      para aprobar (demuestra el caso "listo para aprobar").
//   c. `empAprobada` — liquidación AUTOMATIC APPROVED (contrato TERMINADO,
//      empleado inactivo) — demuestra el efecto colateral real de `approve()`.
//   d. `empPagada` — liquidación AUTOMATIC PAID (mismo efecto + pago registrado).
//   e. `empManual` (escenario 9, fase 2) promovido a APPROVED — demuestra que
//      MANUAL pasa por el mismo gate y efecto de terminación que AUTOMATIC.
//   f. Intento de desactivación bloqueado: cualquier empleado demo con contrato
//      ACTIVO y sin FinalSettlement (p.ej. el owner/operator sembrados fuera de
//      este archivo) ya sirve como caso de prueba — no requiere fixture nueva.
//   g. Recontratación posterior a terminación: ya cubierta por `obraEmployee`
//      (fase 1, `seedRehireHistory`) — no requiere fixture nueva.
// ─────────────────────────────────────────────────────────────────────────────

export async function seedOs591Phase3Fixtures(
  prisma: PrismaClient,
  params: Os591SeedParams,
): Promise<void> {
  const FORMULA_VERSION = 1;
  const TERMINATION_DATE_2024 = new Date('2024-06-30');

  // ── a. Validación legal activa para la versión de fórmula usada en fase 2 ──
  const existingValidation = await prisma.indemnificationFormulaValidation.findFirst({
    where: { tenantId: params.tenantId, formulaVersion: FORMULA_VERSION, isActive: true },
  });
  if (!existingValidation) {
    await prisma.indemnificationFormulaValidation.create({
      data: {
        tenantId: params.tenantId,
        formulaVersion: FORMULA_VERSION,
        legalReference: 'Concepto Jurídico Interno 001-2026 — CST art. 64 (Ley 789/2002)',
        observations: 'Validación seed — fórmula de indemnización versión 1 revisada por Legal.',
        validatedBy: 'seed-os591-legal',
        validatedAt: new Date('2026-01-05'),
        isActive: true,
      },
    });
  }

  // ── b. Reconciliación de salario pendiente para empDeducciones (escenario 8) ─
  const deduccionesUser = await prisma.user.findFirst({
    where: { tenantId: params.tenantId, cedula: '11223303' },
  });
  if (deduccionesUser) {
    const empDeducciones = await prisma.employeeDetails.findUnique({
      where: { userId: deduccionesUser.id },
    });
    if (empDeducciones) {
      const contractDeducciones = await prisma.employmentContract.findFirst({
        where: { tenantId: params.tenantId, employeeDetailsId: empDeducciones.id },
      });
      const settlementDeducciones = contractDeducciones
        ? await prisma.finalSettlement.findFirst({
            where: {
              tenantId: params.tenantId,
              contractId: contractDeducciones.id,
              status: FinalSettlementStatus.CALCULATED,
            },
          })
        : null;
      if (settlementDeducciones) {
        await prisma.pendingSalaryReconciliation.upsert({
          where: { settlementId: settlementDeducciones.id },
          update: {},
          create: {
            tenantId: params.tenantId,
            settlementId: settlementDeducciones.id,
            previouslyPaidAmount: '0.00',
            paymentReference: 'NOM-2024-06',
            paymentDate: new Date('2024-06-30'),
            responsible: 'Gerencia de Recursos Humanos',
            observation:
              'Verificado contra nómina de junio 2024 — el tramo no había sido liquidado previamente.',
            recognizedBalance: '2500000.00',
            createdBy: 'seed-os591',
          },
        });
      }
    }
  }

  const passwordHash = await bcrypt.hash('TestPass123!', 10);
  const pinHash = await bcrypt.hash('9999', 10);

  // ── c. empAprobada — AUTOMATIC APPROVED (contrato TERMINADO, empleado inactivo) ─
  // Idempotencia: `upsertLiquidationDemoEmployee` + `syncEmployeeContractHistory`
  // auto-sanan un contrato ACTIVO si no encuentran uno (por diseño, para empleados
  // legados) — pero el contrato de este empleado SIEMPRE queda TERMINADO (efecto de
  // `terminateContractForApprovedSettlement`). Sin este guard, cada corrida del seed
  // crearía un contrato+liquidación nuevos. Se verifica ANTES de tocar nada si ya
  // existe una liquidación APPROVED/PAID para esta cédula.
  if (!(await hasApprovedOrPaidSettlementByCedula(prisma, params.tenantId, '11223306'))) {
    const empAprobada = await upsertLiquidationDemoEmployee(
      prisma,
      params,
      {
        cedula: '11223306',
        email: 'liq.aprobada@palos-de-lena.dev',
        name: 'Liq Demo Aprobada',
        contractType: EmployeeContractType.INDEFINIDO,
        salaryAmount: 2_100_000,
        contractStart: new Date('2022-03-01'),
        hasTransportSubsidy: true,
      },
      passwordHash,
      pinHash,
    );
    const contractAprobada = await findActiveContractOrThrow(
      prisma,
      params.tenantId,
      empAprobada.id,
    );
    await createSettlementIfAbsent(prisma, {
      tenantId: params.tenantId,
      employeeDetailsId: empAprobada.id,
      contractId: contractAprobada.id,
      effectiveTerminationDate: TERMINATION_DATE_2024,
      terminationReason: ContractTerminationReason.SIN_JUSTA_CAUSA,
      status: FinalSettlementStatus.APPROVED,
      mode: FinalSettlementMode.AUTOMATIC,
      snapshotContractType: EmployeeContractType.INDEFINIDO,
      snapshotContractStartDate: new Date('2022-03-01'),
      snapshotAgreedEndDate: null,
      snapshotSalaryType: SalaryType.ORDINARIO,
      snapshotSalaryAmount: '2100000.00',
      snapshotSmlvAmount: '1300000.00',
      snapshotTransportSubsidyAmount: '162000.00',
      snapshotFormulaVersion: FORMULA_VERSION,
      snapshotVariableAvgMonthsCovered: 0,
      snapshotVariableAvgTotal: '0.00',
      snapshotVariableAvgMonthly: '0.00',
      grossDevengados: '5200000.00',
      totalDeducciones: '0.00',
      netAmount: '5200000.00',
      acceptedWarnings: JSON.stringify([]),
      auditTrail: JSON.stringify([
        { event: 'DRAFT_CREATED', actor: 'seed-os591', timestamp: new Date().toISOString() },
        { event: 'CALCULATED', actor: 'seed-os591', timestamp: new Date().toISOString() },
        { event: 'APPROVED', actor: 'seed-os591-approver', timestamp: new Date().toISOString() },
      ]),
      calculatedBy: 'seed-os591',
      calculatedAt: new Date(),
      approvedBy: 'seed-os591-approver',
      approvedAt: new Date('2024-07-01'),
      lines: {
        create: [
          {
            tenantId: params.tenantId,
            code: 'CESANTIAS',
            name: 'Cesantías',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '700000.00',
            sortOrder: 20,
          },
          {
            tenantId: params.tenantId,
            code: 'VACACIONES',
            name: 'Vacaciones',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '1200000.00',
            sortOrder: 40,
          },
          {
            tenantId: params.tenantId,
            code: 'INDEMNIZACION',
            name: 'Indemnización SJC — tabla baja',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '3300000.00',
            metadata: JSON.stringify({
              appliedRule: 'INDEFINIDO_BAJO:SIN_JUSTA_CAUSA',
              formulaVersion: 1,
            }),
            sortOrder: 50,
          },
        ],
      },
    } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);
    await terminateContractForApprovedSettlement(prisma, params.tenantId, empAprobada.id);
  }

  // ── d. empPagada — AUTOMATIC PAID (mismo efecto + pago registrado) ─────────
  // Mismo guard de idempotencia que el bloque "c" — ver comentario arriba.
  if (!(await hasApprovedOrPaidSettlementByCedula(prisma, params.tenantId, '11223307'))) {
    const empPagada = await upsertLiquidationDemoEmployee(
      prisma,
      params,
      {
        cedula: '11223307',
        email: 'liq.pagada@palos-de-lena.dev',
        name: 'Liq Demo Pagada',
        contractType: EmployeeContractType.INDEFINIDO,
        salaryAmount: 2_300_000,
        contractStart: new Date('2021-09-01'),
        hasTransportSubsidy: true,
      },
      passwordHash,
      pinHash,
    );
    const contractPagada = await findActiveContractOrThrow(prisma, params.tenantId, empPagada.id);
    await createSettlementIfAbsent(prisma, {
      tenantId: params.tenantId,
      employeeDetailsId: empPagada.id,
      contractId: contractPagada.id,
      effectiveTerminationDate: TERMINATION_DATE_2024,
      terminationReason: ContractTerminationReason.RENUNCIA,
      status: FinalSettlementStatus.PAID,
      mode: FinalSettlementMode.AUTOMATIC,
      snapshotContractType: EmployeeContractType.INDEFINIDO,
      snapshotContractStartDate: new Date('2021-09-01'),
      snapshotAgreedEndDate: null,
      snapshotSalaryType: SalaryType.ORDINARIO,
      snapshotSalaryAmount: '2300000.00',
      snapshotSmlvAmount: '1300000.00',
      snapshotTransportSubsidyAmount: '162000.00',
      snapshotFormulaVersion: FORMULA_VERSION,
      snapshotVariableAvgMonthsCovered: 0,
      snapshotVariableAvgTotal: '0.00',
      snapshotVariableAvgMonthly: '0.00',
      grossDevengados: '4100000.00',
      totalDeducciones: '0.00',
      netAmount: '4100000.00',
      acceptedWarnings: JSON.stringify([]),
      auditTrail: JSON.stringify([
        { event: 'DRAFT_CREATED', actor: 'seed-os591', timestamp: new Date().toISOString() },
        { event: 'CALCULATED', actor: 'seed-os591', timestamp: new Date().toISOString() },
        { event: 'APPROVED', actor: 'seed-os591-approver', timestamp: new Date().toISOString() },
        { event: 'PAID', actor: 'seed-os591-tesoreria', timestamp: new Date().toISOString() },
      ]),
      calculatedBy: 'seed-os591',
      calculatedAt: new Date(),
      approvedBy: 'seed-os591-approver',
      approvedAt: new Date('2024-07-01'),
      paidBy: 'seed-os591-tesoreria',
      paidAt: new Date('2024-07-05'),
      lines: {
        create: [
          {
            tenantId: params.tenantId,
            code: 'CESANTIAS',
            name: 'Cesantías',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '1600000.00',
            sortOrder: 20,
          },
          {
            tenantId: params.tenantId,
            code: 'VACACIONES',
            name: 'Vacaciones',
            type: SettlementLineType.DEVENGO,
            origin: SettlementLineOrigin.AUTOMATIC,
            amount: '2500000.00',
            sortOrder: 40,
          },
        ],
      },
    } as Parameters<PrismaClient['finalSettlement']['create']>[0]['data']);
    await terminateContractForApprovedSettlement(prisma, params.tenantId, empPagada.id);
  }

  // ── e. empManual (escenario 9, fase 2) → promovido a APPROVED ──────────────
  const manualUser = await prisma.user.findFirst({
    where: { tenantId: params.tenantId, cedula: '11223304' },
  });
  if (manualUser) {
    const empManual = await prisma.employeeDetails.findUnique({ where: { userId: manualUser.id } });
    if (empManual) {
      const contractManual = await prisma.employmentContract.findFirst({
        where: { tenantId: params.tenantId, employeeDetailsId: empManual.id, status: 'ACTIVO' },
      });
      const settlementManual = contractManual
        ? await prisma.finalSettlement.findFirst({
            where: {
              tenantId: params.tenantId,
              contractId: contractManual.id,
              status: FinalSettlementStatus.CALCULATED,
            },
          })
        : null;
      if (settlementManual) {
        const trail =
          (settlementManual.auditTrail as unknown as Array<Record<string, unknown>>) ?? [];
        await prisma.finalSettlement.update({
          where: { id: settlementManual.id },
          data: {
            status: FinalSettlementStatus.APPROVED,
            approvedBy: 'seed-os591-approver',
            approvedAt: new Date('2024-07-02'),
            auditTrail: JSON.stringify([
              ...trail,
              {
                event: 'APPROVED',
                actor: 'seed-os591-approver',
                timestamp: new Date().toISOString(),
                detail: 'Liquidación manual aprobada — mismo gate que AUTOMATIC',
              },
            ]),
          },
        });
        await terminateContractForApprovedSettlement(prisma, params.tenantId, empManual.id);
      }
    }
  }

  console.log(
    'OS-591 fase 3: validación legal, reconciliación, aprobación y pago sembrados (fixtures workflow)',
  );
}

/**
 * Idempotencia de los fixtures APPROVED/PAID: busca al empleado por cédula y verifica si
 * YA tiene una liquidación en estado APPROVED o PAID — si la tiene, el bloque que la creó
 * no debe volver a ejecutarse (evita duplicar contrato+liquidación en cada corrida, ver
 * comentario en los bloques "c"/"d" de `seedOs591Phase3Fixtures`).
 */
async function hasApprovedOrPaidSettlementByCedula(
  prisma: PrismaClient,
  tenantId: string,
  cedula: string,
): Promise<boolean> {
  const user = await prisma.user.findFirst({ where: { tenantId, cedula } });
  if (!user) return false;

  const employee = await prisma.employeeDetails.findUnique({ where: { userId: user.id } });
  if (!employee) return false;

  const settlement = await prisma.finalSettlement.findFirst({
    where: {
      tenantId,
      employeeDetailsId: employee.id,
      status: { in: [FinalSettlementStatus.APPROVED, FinalSettlementStatus.PAID] },
    },
  });
  return settlement !== null;
}

/**
 * Refleja el efecto colateral real de `FinalSettlementService.approve()` (terminar el
 * contrato ACTIVO + desactivar al empleado) para que los fixtures de APPROVED/PAID queden
 * consistentes con lo que el servicio real produciría — ver tasks/OS-591.md §15.4.
 */
async function terminateContractForApprovedSettlement(
  prisma: PrismaClient,
  tenantId: string,
  employeeDetailsId: string,
): Promise<void> {
  const active = await prisma.employmentContract.findFirst({
    where: { tenantId, employeeDetailsId, status: 'ACTIVO' },
  });
  if (!active) return;

  await prisma.$transaction([
    prisma.employmentContract.update({
      where: { id: active.id },
      data: {
        status: 'TERMINADO',
        activeSlot: null,
        terminationDate: new Date('2024-06-30'),
        terminationReason: 'SIN_JUSTA_CAUSA',
        terminationNotes: 'Seed OS-591 fase 3 — terminación por aprobación de liquidación',
      },
    }),
    prisma.employeeDetails.update({
      where: { id: employeeDetailsId },
      data: { isActive: false, deletedAt: new Date('2024-06-30') },
    }),
  ]);
}
