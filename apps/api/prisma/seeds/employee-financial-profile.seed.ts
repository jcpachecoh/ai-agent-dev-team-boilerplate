import * as crypto from 'node:crypto';

import {
  BankAccountType,
  FinancialPaymentStatus,
  PaymentMethod,
  PrismaClient,
} from '@prisma/client';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

const SEED_IDS = {
  ownerProfile: 'cccccccc-0000-0000-0000-000000000054',
  operatorProfile: 'cccccccc-0000-0000-0000-000000000055',
  ownerBankPrimary: 'cccccccc-0000-0000-0000-000000000056',
  ownerBankSecondary: 'cccccccc-0000-0000-0000-000000000057',
  operatorBankPrimary: 'cccccccc-0000-0000-0000-000000000058',
  ownerTaxInfo: 'cccccccc-0000-0000-0000-000000000059',
  ownerPaymentJune2026: 'cccccccc-0000-0000-0000-000000000060',
} as const;

function getEncryptionKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is required to seed employee financial profiles');
  }
  const keyBuffer = Buffer.from(rawKey, 'hex');
  if (keyBuffer.length !== KEY_BYTES) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_BYTES * 2} hex characters (${KEY_BYTES} bytes)`);
  }
  return keyBuffer;
}

/** Deterministic IV so re-running the seed produces the same ciphertext. */
function encryptForSeed(plaintext: string, contextId: string): string {
  const key = getEncryptionKey();
  const iv = crypto.createHash('sha256').update(`seed:${contextId}`).digest().subarray(0, IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
    ':',
  );
}

function lastDigits(value: string, keep = 4): string {
  return value.slice(-keep);
}

type BankAccountSeed = {
  id: string;
  bankName: string;
  bankCode: string;
  accountType: BankAccountType;
  accountNumber: string;
  isPrimary: boolean;
};

async function upsertFinancialProfile(
  prisma: PrismaClient,
  params: {
    id: string;
    tenantId: string;
    employeeDetailsId: string;
    primaryBankAccountId: string;
  },
) {
  return prisma.employeeFinancialProfile.upsert({
    where: { employeeDetailsId: params.employeeDetailsId },
    update: {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      primaryBankAccountId: params.primaryBankAccountId,
      deletedAt: null,
    },
    create: {
      id: params.id,
      tenantId: params.tenantId,
      employeeDetailsId: params.employeeDetailsId,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      primaryBankAccountId: params.primaryBankAccountId,
    },
  });
}

async function upsertBankAccount(
  prisma: PrismaClient,
  params: {
    id: string;
    tenantId: string;
    financialProfileId: string;
    account: BankAccountSeed;
  },
) {
  const accountLast4 = lastDigits(params.account.accountNumber);
  return prisma.employeeBankAccount.upsert({
    where: { id: params.id },
    update: {
      bankName: params.account.bankName,
      bankCode: params.account.bankCode,
      accountType: params.account.accountType,
      accountNumberEncrypted: encryptForSeed(params.account.accountNumber, params.id),
      accountLast4,
      isPrimary: params.account.isPrimary,
      isActive: true,
      deletedAt: null,
    },
    create: {
      id: params.id,
      tenantId: params.tenantId,
      financialProfileId: params.financialProfileId,
      bankName: params.account.bankName,
      bankCode: params.account.bankCode,
      accountType: params.account.accountType,
      accountNumberEncrypted: encryptForSeed(params.account.accountNumber, params.id),
      accountLast4,
      isPrimary: params.account.isPrimary,
      isActive: true,
    },
  });
}

export async function seedEmployeeFinancialProfiles(
  prisma: PrismaClient,
  ownerUserId: string,
  operatorUserId: string,
): Promise<void> {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️  ENCRYPTION_KEY not set — skipping employee financial profile seed');
    return;
  }

  const ownerEmployee = await prisma.employeeDetails.findUnique({
    where: { userId: ownerUserId },
    select: { id: true, tenantId: true },
  });
  const operatorEmployee = await prisma.employeeDetails.findUnique({
    where: { userId: operatorUserId },
    select: { id: true, tenantId: true },
  });

  if (!ownerEmployee || !operatorEmployee) {
    console.warn('⚠️  Employee details not found — skipping financial profile seed');
    return;
  }

  const ownerAccounts: BankAccountSeed[] = [
    {
      id: SEED_IDS.ownerBankPrimary,
      bankName: 'Bancolombia',
      bankCode: 'bancolombia',
      accountType: BankAccountType.SAVINGS,
      accountNumber: '12345678901',
      isPrimary: true,
    },
    {
      id: SEED_IDS.ownerBankSecondary,
      bankName: 'Davivienda',
      bankCode: 'davivienda',
      accountType: BankAccountType.CHECKING,
      accountNumber: '123456789012',
      isPrimary: false,
    },
  ];

  const operatorAccounts: BankAccountSeed[] = [
    {
      id: SEED_IDS.operatorBankPrimary,
      bankName: 'Nequi',
      bankCode: 'nequi',
      accountType: BankAccountType.SAVINGS,
      accountNumber: '3001234567',
      isPrimary: true,
    },
  ];

  const ownerProfile = await upsertFinancialProfile(prisma, {
    id: SEED_IDS.ownerProfile,
    tenantId: ownerEmployee.tenantId,
    employeeDetailsId: ownerEmployee.id,
    primaryBankAccountId: SEED_IDS.ownerBankPrimary,
  });

  for (const account of ownerAccounts) {
    await upsertBankAccount(prisma, {
      id: account.id,
      tenantId: ownerEmployee.tenantId,
      financialProfileId: ownerProfile.id,
      account,
    });
  }

  await prisma.employeeTaxInformation.upsert({
    where: { financialProfileId: ownerProfile.id },
    update: {
      taxIdEncrypted: encryptForSeed('9001234567', SEED_IDS.ownerTaxInfo),
      taxIdLast4: '4567',
      taxRegime: 'ORDINARIO',
      withholdingApplicable: true,
      withholdingRate: 0.11,
    },
    create: {
      id: SEED_IDS.ownerTaxInfo,
      tenantId: ownerEmployee.tenantId,
      financialProfileId: ownerProfile.id,
      taxIdEncrypted: encryptForSeed('9001234567', SEED_IDS.ownerTaxInfo),
      taxIdLast4: '4567',
      taxRegime: 'ORDINARIO',
      withholdingApplicable: true,
      withholdingRate: 0.11,
    },
  });

  await prisma.employeePaymentHistory.upsert({
    where: {
      financialProfileId_periodYear_periodMonth: {
        financialProfileId: ownerProfile.id,
        periodYear: 2026,
        periodMonth: 6,
      },
    },
    update: {
      bankAccountId: SEED_IDS.ownerBankPrimary,
      grossAmount: 15000000,
      totalDeductions: 2850000,
      netAmount: 12150000,
      paymentDate: new Date('2026-06-30T12:00:00.000Z'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: FinancialPaymentStatus.PAID,
      transactionReference: 'SEED-PAY-OWNER-2026-06',
    },
    create: {
      id: SEED_IDS.ownerPaymentJune2026,
      tenantId: ownerEmployee.tenantId,
      financialProfileId: ownerProfile.id,
      bankAccountId: SEED_IDS.ownerBankPrimary,
      periodYear: 2026,
      periodMonth: 6,
      grossAmount: 15000000,
      totalDeductions: 2850000,
      netAmount: 12150000,
      paymentDate: new Date('2026-06-30T12:00:00.000Z'),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      status: FinancialPaymentStatus.PAID,
      transactionReference: 'SEED-PAY-OWNER-2026-06',
    },
  });

  const operatorProfile = await upsertFinancialProfile(prisma, {
    id: SEED_IDS.operatorProfile,
    tenantId: operatorEmployee.tenantId,
    employeeDetailsId: operatorEmployee.id,
    primaryBankAccountId: SEED_IDS.operatorBankPrimary,
  });

  for (const account of operatorAccounts) {
    await upsertBankAccount(prisma, {
      id: account.id,
      tenantId: operatorEmployee.tenantId,
      financialProfileId: operatorProfile.id,
      account,
    });
  }

  console.log('EmployeeFinancialProfile: seeded for owner and operator');
  console.log(`  ownerFinancialProfileId=${ownerProfile.id}`);
  console.log(`  ownerPrimaryBankAccountId=${SEED_IDS.ownerBankPrimary}`);
  console.log(`  operatorFinancialProfileId=${operatorProfile.id}`);
  console.log(`  operatorPrimaryBankAccountId=${SEED_IDS.operatorBankPrimary}`);
}
