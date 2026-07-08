import { Injectable } from '@nestjs/common';
import type {
  BankAccountType,
  EmployeeBankAccount,
  EmployeeFinancialProfile,
  EmployeePaymentHistory,
  EmployeeTaxInformation,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateFinancialProfileData,
  EmployeeRecord,
  IEmployeeFinancialProfileRepository,
  PaymentHistoryPage,
  UpdateFinancialProfileData,
} from '../interfaces/employee-financial-profile.interfaces';

const EMPLOYEE_SELECT = {
  id: true,
  tenantId: true,
  isActive: true,
  deletedAt: true,
} as const;

@Injectable()
export class EmployeeFinancialProfileRepository implements IEmployeeFinancialProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Employee resolution ─────────────────────────────────────────────────────

  async findEmployee(employeeDetailsId: string): Promise<EmployeeRecord | null> {
    return this.prisma.employeeDetails.findUnique({
      where: { id: employeeDetailsId },
      select: EMPLOYEE_SELECT,
    });
  }

  // ── Financial Profile ───────────────────────────────────────────────────────

  async findProfileByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeFinancialProfile | null> {
    return this.prisma.employeeFinancialProfile.findFirst({
      where: { tenantId, employeeDetailsId, deletedAt: null },
    });
  }

  async findProfileById(tenantId: string, id: string): Promise<EmployeeFinancialProfile | null> {
    return this.prisma.employeeFinancialProfile.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
  }

  async createProfile(
    tenantId: string,
    employeeDetailsId: string,
    data: CreateFinancialProfileData,
  ): Promise<EmployeeFinancialProfile> {
    return this.prisma.employeeFinancialProfile.create({
      data: {
        tenantId,
        employeeDetailsId,
        paymentMethod: data.paymentMethod ?? 'BANK_TRANSFER',
      },
    });
  }

  async updateProfile(
    tenantId: string,
    id: string,
    data: UpdateFinancialProfileData,
  ): Promise<EmployeeFinancialProfile> {
    return this.prisma.employeeFinancialProfile.update({
      where: { id },
      data: {
        ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod }),
        ...(data.primaryBankAccountId !== undefined && {
          primaryBankAccountId: data.primaryBankAccountId,
        }),
      },
    });
  }

  async softDeleteProfile(tenantId: string, id: string): Promise<void> {
    await this.prisma.employeeFinancialProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Bank Accounts ───────────────────────────────────────────────────────────

  async findBankAccounts(
    tenantId: string,
    financialProfileId: string,
  ): Promise<EmployeeBankAccount[]> {
    return this.prisma.employeeBankAccount.findMany({
      where: { tenantId, financialProfileId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findBankAccountById(
    tenantId: string,
    id: string,
    financialProfileId: string,
  ): Promise<EmployeeBankAccount | null> {
    return this.prisma.employeeBankAccount.findFirst({
      where: { id, tenantId, financialProfileId, deletedAt: null },
    });
  }

  async createBankAccount(
    tenantId: string,
    financialProfileId: string,
    data: {
      bankName: string;
      bankCode?: string;
      accountType: BankAccountType;
      accountNumberEncrypted: string;
      accountLast4: string;
      isPrimary: boolean;
    },
  ): Promise<EmployeeBankAccount> {
    return this.prisma.employeeBankAccount.create({
      data: {
        tenantId,
        financialProfileId,
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountType: data.accountType,
        accountNumberEncrypted: data.accountNumberEncrypted,
        accountLast4: data.accountLast4,
        isPrimary: data.isPrimary,
      },
    });
  }

  async updateBankAccount(
    tenantId: string,
    id: string,
    data: {
      bankName?: string;
      bankCode?: string;
      accountType?: BankAccountType;
      accountNumberEncrypted?: string;
      accountLast4?: string;
    },
  ): Promise<EmployeeBankAccount> {
    return this.prisma.employeeBankAccount.update({
      where: { id },
      data: {
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.bankCode !== undefined && { bankCode: data.bankCode }),
        ...(data.accountType !== undefined && { accountType: data.accountType }),
        ...(data.accountNumberEncrypted !== undefined && {
          accountNumberEncrypted: data.accountNumberEncrypted,
        }),
        ...(data.accountLast4 !== undefined && { accountLast4: data.accountLast4 }),
      },
    });
  }

  async softDeleteBankAccount(tenantId: string, id: string): Promise<void> {
    await this.prisma.employeeBankAccount.update({
      where: { id },
      data: { deletedAt: new Date(), isPrimary: false },
    });
  }

  async clearPrimaryBankAccounts(tenantId: string, financialProfileId: string): Promise<void> {
    await this.prisma.employeeBankAccount.updateMany({
      where: { tenantId, financialProfileId, isPrimary: true, deletedAt: null },
      data: { isPrimary: false },
    });
  }

  async setBankAccountPrimary(tenantId: string, id: string): Promise<void> {
    await this.prisma.employeeBankAccount.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  // ── Tax Information ─────────────────────────────────────────────────────────

  async findTaxInformation(
    tenantId: string,
    financialProfileId: string,
  ): Promise<EmployeeTaxInformation | null> {
    return this.prisma.employeeTaxInformation.findFirst({
      where: { tenantId, financialProfileId },
    });
  }

  async upsertTaxInformation(
    tenantId: string,
    financialProfileId: string,
    data: {
      taxIdEncrypted: string;
      taxIdLast4: string;
      taxRegime?: string;
      withholdingApplicable: boolean;
      withholdingRate?: number;
    },
  ): Promise<EmployeeTaxInformation> {
    return this.prisma.employeeTaxInformation.upsert({
      where: { financialProfileId },
      update: {
        taxIdEncrypted: data.taxIdEncrypted,
        taxIdLast4: data.taxIdLast4,
        ...(data.taxRegime !== undefined && { taxRegime: data.taxRegime }),
        withholdingApplicable: data.withholdingApplicable,
        ...(data.withholdingRate !== undefined && { withholdingRate: data.withholdingRate }),
      },
      create: {
        tenantId,
        financialProfileId,
        taxIdEncrypted: data.taxIdEncrypted,
        taxIdLast4: data.taxIdLast4,
        taxRegime: data.taxRegime,
        withholdingApplicable: data.withholdingApplicable,
        withholdingRate: data.withholdingRate,
      },
    });
  }

  // ── Payment History ─────────────────────────────────────────────────────────

  async findPaymentHistory(
    tenantId: string,
    financialProfileId: string,
    cursor?: string,
    take = 20,
  ): Promise<PaymentHistoryPage> {
    const items: EmployeePaymentHistory[] = await this.prisma.employeePaymentHistory.findMany({
      where: { tenantId, financialProfileId },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });

    const hasNextPage = items.length > take;
    const edges = hasNextPage ? items.slice(0, -1) : items;
    const endCursor = edges.at(-1)?.id ?? null;

    return { edges, pageInfo: { hasNextPage, endCursor } };
  }
}
