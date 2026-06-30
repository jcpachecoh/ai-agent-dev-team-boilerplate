import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  EmployeeBankAccount,
  EmployeeFinancialProfile,
  EmployeeTaxInformation,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import { EncryptionService } from '../../common/services/encryption.service';
import type {
  CreateBankAccountData,
  CreateFinancialProfileData,
  IEmployeeFinancialProfileService,
  PaymentHistoryPage,
  UpdateBankAccountData,
  UpdateFinancialProfileData,
  UpsertTaxInformationData,
} from '../interfaces/employee-financial-profile.interfaces';
import { EmployeeFinancialProfileRepository } from '../repository/employee-financial-profile.repository';

const ACCOUNT_NUMBER_REGEX = /^\d{6,20}$/;

@Injectable()
export class EmployeeFinancialProfileService implements IEmployeeFinancialProfileService {
  constructor(
    private readonly repository: EmployeeFinancialProfileRepository,
    private readonly encryption: EncryptionService,
    private readonly auditService: AuditService,
  ) {}

  // ── Financial Profile ───────────────────────────────────────────────────────

  async getOrCreateProfile(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: CreateFinancialProfileData = {},
  ): Promise<EmployeeFinancialProfile> {
    await this.resolveEmployee(tenantId, employeeDetailsId);

    const existing = await this.repository.findProfileByEmployee(tenantId, employeeDetailsId);
    if (existing) {
      return existing;
    }

    try {
      const profile = await this.repository.createProfile(tenantId, employeeDetailsId, data);
      await this.auditService.log({
        tenantId,
        action: 'CREATE',
        entityType: 'EmployeeFinancialProfile',
        entityId: profile.id,
        actorUserId,
        newValue: { employeeDetailsId, paymentMethod: profile.paymentMethod },
      });
      return profile;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un perfil financiero para este empleado');
      }
      throw error;
    }
  }

  async updateProfile(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: UpdateFinancialProfileData,
  ): Promise<EmployeeFinancialProfile> {
    const profile = await this.getProfile(tenantId, employeeDetailsId);
    const updated = await this.repository.updateProfile(tenantId, profile.id, data);
    await this.auditService.log({
      tenantId,
      action: 'UPDATE',
      entityType: 'EmployeeFinancialProfile',
      entityId: profile.id,
      actorUserId,
      oldValue: {
        paymentMethod: profile.paymentMethod,
        primaryBankAccountId: profile.primaryBankAccountId,
      },
      newValue: {
        paymentMethod: updated.paymentMethod,
        primaryBankAccountId: updated.primaryBankAccountId,
      },
    });
    return updated;
  }

  async getProfile(tenantId: string, employeeDetailsId: string): Promise<EmployeeFinancialProfile> {
    await this.resolveEmployee(tenantId, employeeDetailsId);
    const profile = await this.repository.findProfileByEmployee(tenantId, employeeDetailsId);
    if (!profile) {
      throw new NotFoundException(
        `Perfil financiero del empleado ${employeeDetailsId} no encontrado`,
      );
    }
    return profile;
  }

  // ── Bank Accounts ───────────────────────────────────────────────────────────

  async createBankAccount(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: CreateBankAccountData,
  ): Promise<EmployeeBankAccount> {
    this.validateAccountNumber(data.accountNumber);
    const profile = await this.getProfile(tenantId, employeeDetailsId);

    const accountNumberEncrypted = this.encryption.encrypt(data.accountNumber);
    const accountLast4 = this.encryption.last(data.accountNumber);
    const isPrimary = data.isPrimary ?? false;

    if (isPrimary) {
      await this.repository.clearPrimaryBankAccounts(tenantId, profile.id);
    }

    const account = await this.repository.createBankAccount(tenantId, profile.id, {
      bankName: data.bankName,
      bankCode: data.bankCode,
      accountType: data.accountType,
      accountNumberEncrypted,
      accountLast4,
      isPrimary,
    });

    if (isPrimary) {
      await this.repository.updateProfile(tenantId, profile.id, {
        primaryBankAccountId: account.id,
      });
    }

    await this.auditService.log({
      tenantId,
      action: 'CREATE',
      entityType: 'EmployeeBankAccount',
      entityId: account.id,
      actorUserId,
      newValue: {
        financialProfileId: profile.id,
        bankName: data.bankName,
        accountType: data.accountType,
        accountLast4,
        isPrimary,
      },
    });

    return account;
  }

  async updateBankAccount(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: UpdateBankAccountData,
  ): Promise<EmployeeBankAccount> {
    const profile = await this.getProfile(tenantId, employeeDetailsId);
    const existing = await this.repository.findBankAccountById(tenantId, id, profile.id);
    if (!existing) {
      throw new NotFoundException(`Cuenta bancaria ${id} no encontrada`);
    }

    const updated = await this.repository.updateBankAccount(tenantId, id, data);
    await this.auditService.log({
      tenantId,
      action: 'UPDATE',
      entityType: 'EmployeeBankAccount',
      entityId: id,
      actorUserId,
      oldValue: { bankName: existing.bankName, accountType: existing.accountType },
      newValue: { bankName: updated.bankName, accountType: updated.accountType },
    });
    return updated;
  }

  async softDeleteBankAccount(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    actorUserId: string,
  ): Promise<void> {
    const profile = await this.getProfile(tenantId, employeeDetailsId);
    const existing = await this.repository.findBankAccountById(tenantId, id, profile.id);
    if (!existing) {
      throw new NotFoundException(`Cuenta bancaria ${id} no encontrada`);
    }

    await this.repository.softDeleteBankAccount(tenantId, id);

    // If deleted account was the primary, clear the reference on the profile
    if (existing.isPrimary) {
      await this.repository.updateProfile(tenantId, profile.id, { primaryBankAccountId: null });
    }

    await this.auditService.log({
      tenantId,
      action: 'DELETE',
      entityType: 'EmployeeBankAccount',
      entityId: id,
      actorUserId,
      oldValue: { bankName: existing.bankName, accountLast4: existing.accountLast4 },
    });
  }

  async setPrimaryBankAccount(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    actorUserId: string,
  ): Promise<EmployeeFinancialProfile> {
    const profile = await this.getProfile(tenantId, employeeDetailsId);
    const account = await this.repository.findBankAccountById(tenantId, id, profile.id);
    if (!account) {
      throw new NotFoundException(`Cuenta bancaria ${id} no encontrada`);
    }
    if (!account.isActive) {
      throw new BadRequestException('No se puede establecer una cuenta inactiva como primaria');
    }

    await this.repository.clearPrimaryBankAccounts(tenantId, profile.id);
    await this.repository.setBankAccountPrimary(tenantId, id);
    const updated = await this.repository.updateProfile(tenantId, profile.id, {
      primaryBankAccountId: id,
    });

    await this.auditService.log({
      tenantId,
      action: 'UPDATE',
      entityType: 'EmployeeFinancialProfile',
      entityId: profile.id,
      actorUserId,
      oldValue: { primaryBankAccountId: profile.primaryBankAccountId },
      newValue: { primaryBankAccountId: id },
    });

    return updated;
  }

  async getBankAccounts(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeBankAccount[]> {
    const profile = await this.getProfile(tenantId, employeeDetailsId);
    return this.repository.findBankAccounts(tenantId, profile.id);
  }

  // ── Tax Information ─────────────────────────────────────────────────────────

  async upsertTaxInformation(
    tenantId: string,
    employeeDetailsId: string,
    actorUserId: string,
    data: UpsertTaxInformationData,
  ): Promise<EmployeeTaxInformation> {
    if (!data.taxId || data.taxId.trim().length === 0) {
      throw new BadRequestException('El NIT/RUT es obligatorio');
    }

    const profile = await this.getProfile(tenantId, employeeDetailsId);
    const existing = await this.repository.findTaxInformation(tenantId, profile.id);

    const taxIdEncrypted = this.encryption.encrypt(data.taxId.trim());
    const taxIdLast4 = this.encryption.last(data.taxId.trim());

    const result = await this.repository.upsertTaxInformation(tenantId, profile.id, {
      taxIdEncrypted,
      taxIdLast4,
      taxRegime: data.taxRegime,
      withholdingApplicable: data.withholdingApplicable ?? false,
      withholdingRate: data.withholdingRate,
    });

    await this.auditService.log({
      tenantId,
      action: existing ? 'UPDATE' : 'CREATE',
      entityType: 'EmployeeTaxInformation',
      entityId: result.id,
      actorUserId,
      oldValue: existing
        ? { taxIdLast4: existing.taxIdLast4, withholdingApplicable: existing.withholdingApplicable }
        : null,
      newValue: {
        taxIdLast4,
        taxRegime: data.taxRegime,
        withholdingApplicable: data.withholdingApplicable ?? false,
      },
    });

    return result;
  }

  async getTaxInformation(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeTaxInformation | null> {
    const profile = await this.getProfile(tenantId, employeeDetailsId);
    return this.repository.findTaxInformation(tenantId, profile.id);
  }

  // ── Payment History ─────────────────────────────────────────────────────────

  async getPaymentHistory(
    tenantId: string,
    employeeDetailsId: string,
    cursor?: string,
    take = 20,
  ): Promise<PaymentHistoryPage> {
    const profile = await this.getProfile(tenantId, employeeDetailsId);
    return this.repository.findPaymentHistory(tenantId, profile.id, cursor, take);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async resolveEmployee(tenantId: string, employeeDetailsId: string): Promise<void> {
    const employee = await this.repository.findEmployee(employeeDetailsId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Empleado ${employeeDetailsId} no encontrado`);
    }
    if (!employee.isActive || employee.deletedAt !== null) {
      throw new BadRequestException('El empleado está inactivo o eliminado');
    }
  }

  private validateAccountNumber(accountNumber: string): void {
    if (!ACCOUNT_NUMBER_REGEX.test(accountNumber)) {
      throw new BadRequestException(
        'El número de cuenta debe contener solo dígitos y tener entre 6 y 20 caracteres',
      );
    }
  }
}
