import {
  BankAccountType,
  FinancialPaymentStatus,
  PaymentMethod,
  PrismaClient,
} from '@prisma/client';

const GLOBAL_MES_OPERATIONS_ADMIN_USER_ID = '11111111-0000-0000-0000-000000000007';

const SEED_IDS = {
  opsAdminProfile: 'cccccccc-0000-0000-0000-000000000062',
  opsAdminBankPrimary: 'cccccccc-0000-0000-0000-000000000063',
  opsAdminPaymentJune2026: 'cccccccc-0000-0000-0000-000000000064',
} as const;

/**
 * OS-594 — fixtures para probar el desglose de retención en Nómina → Empleado → Pagos.
 * Requiere plant-supervisor.seed (EmployeeDetails de operations_admin) y ENCRYPTION_KEY.
 */
export async function seedOs594TaxWithholdingUiFixtures(prisma: PrismaClient): Promise<void> {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️  ENCRYPTION_KEY not set — skipping OS-594 tax withholding UI seed');
    return;
  }

  const opsAdminEmployee = await prisma.employeeDetails.findUnique({
    where: { userId: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID },
    select: { id: true, tenantId: true, name: true },
  });

  if (!opsAdminEmployee) {
    console.warn('⚠️  OS-594 UI seed: operations_admin EmployeeDetails not found — skipping');
    return;
  }

  await prisma.employeeDetails.update({
    where: { id: opsAdminEmployee.id },
    data: { isExemptFromTax: true },
  });

  const profile = await prisma.employeeFinancialProfile.upsert({
    where: { employeeDetailsId: opsAdminEmployee.id },
    update: {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      primaryBankAccountId: SEED_IDS.opsAdminBankPrimary,
      deletedAt: null,
    },
    create: {
      id: SEED_IDS.opsAdminProfile,
      tenantId: opsAdminEmployee.tenantId,
      employeeDetailsId: opsAdminEmployee.id,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      primaryBankAccountId: SEED_IDS.opsAdminBankPrimary,
    },
  });

  await prisma.employeeBankAccount.upsert({
    where: { id: SEED_IDS.opsAdminBankPrimary },
    update: {
      bankName: 'Banco de Bogotá',
      bankCode: 'bancodebogota',
      accountType: BankAccountType.SAVINGS,
      accountLast4: '7890',
      isPrimary: true,
      isActive: true,
      deletedAt: null,
    },
    create: {
      id: SEED_IDS.opsAdminBankPrimary,
      tenantId: opsAdminEmployee.tenantId,
      financialProfileId: profile.id,
      bankName: 'Banco de Bogotá',
      bankCode: 'bancodebogota',
      accountType: BankAccountType.SAVINGS,
      accountNumberEncrypted: 'seed-placeholder-ops-admin-account',
      accountLast4: '7890',
      isPrimary: true,
      isActive: true,
    },
  });

  await prisma.employeePaymentHistory.upsert({
    where: {
      financialProfileId_periodYear_periodMonth: {
        financialProfileId: profile.id,
        periodYear: 2026,
        periodMonth: 6,
      },
    },
    update: {
      bankAccountId: SEED_IDS.opsAdminBankPrimary,
      grossAmount: 8000000,
      totalDeductions: 0,
      netAmount: 8000000,
      paymentDate: new Date('2026-06-30T12:00:00.000Z'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: FinancialPaymentStatus.PAID,
      transactionReference: 'SEED-PAY-OPSADMIN-EXEMPT-2026-06',
    },
    create: {
      id: SEED_IDS.opsAdminPaymentJune2026,
      tenantId: opsAdminEmployee.tenantId,
      financialProfileId: profile.id,
      bankAccountId: SEED_IDS.opsAdminBankPrimary,
      periodYear: 2026,
      periodMonth: 6,
      grossAmount: 8000000,
      totalDeductions: 0,
      netAmount: 8000000,
      paymentDate: new Date('2026-06-30T12:00:00.000Z'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: FinancialPaymentStatus.PAID,
      transactionReference: 'SEED-PAY-OPSADMIN-EXEMPT-2026-06',
    },
  });

  console.log('✅ OS-594 tax withholding UI seed:');
  console.log('  Exento — Admin de Operaciones (operations.admin@palos-de-lena.dev)');
  console.log('    /payroll/employees/11111111-0000-0000-0000-000000000007?tab=payments');
  console.log('  Retención $0 — Operario (mes-operator@palos-de-lena.dev)');
  console.log('    /payroll/employees/11111111-0000-0000-0000-000000000005?tab=payments');
  console.log('  Con retención — Propietario (mes-owner@palos-de-lena.dev)');
  console.log('    /payroll/employees/11111111-0000-0000-0000-000000000004?tab=payments');
}
