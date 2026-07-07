import { type CanActivate, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BankAccountType, FinancialPaymentStatus, PaymentMethod } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeFinancialProfileResolver } from '../resolver/employee-financial-profile.resolver';
import { EmployeeFinancialProfileService } from '../service/employee-financial-profile.service';

const allowGuard: CanActivate = { canActivate: () => true };

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT = 'tenant-001';
const EMPLOYEE_ID = 'emp-001';
const USER = { sub: 'user-001', tenantId: TENANT, email: 'user@test.com' } as any;

const GQL_CONTEXT = {
  req: { headers: { 'x-tenant-id': TENANT } },
} as any;

const NOW = new Date('2026-06-26T00:00:00Z');

const profileFixture = {
  id: 'prof-001',
  tenantId: TENANT,
  employeeDetailsId: EMPLOYEE_ID,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  primaryBankAccountId: null,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

const bankAccountFixture = {
  id: 'bank-001',
  tenantId: TENANT,
  financialProfileId: 'prof-001',
  bankName: 'Bancolombia',
  bankCode: '007',
  accountType: BankAccountType.SAVINGS,
  accountNumberEncrypted: '<encrypted>',
  accountLast4: '1234',
  isPrimary: true,
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

const taxFixture = {
  id: 'tax-001',
  tenantId: TENANT,
  financialProfileId: 'prof-001',
  taxIdEncrypted: '<encrypted>',
  taxIdLast4: '5678',
  taxRegime: 'ORDINARIO',
  withholdingApplicable: false,
  withholdingRate: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const paymentHistoryFixture = {
  id: 'ph-001',
  tenantId: TENANT,
  financialProfileId: 'prof-001',
  bankAccountId: 'bank-001',
  periodYear: 2026,
  periodMonth: 6,
  grossAmount: 5000000,
  totalDeductions: 500000,
  netAmount: 4500000,
  deductionBreakdown: null,
  paymentDate: NOW,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  status: FinancialPaymentStatus.PAID,
  transactionReference: 'TX-001',
  createdAt: NOW,
  updatedAt: NOW,
};

// ── Service mock ──────────────────────────────────────────────────────────────

const serviceMock = {
  getProfile: jest.fn(),
  getOrCreateProfile: jest.fn(),
  updateProfile: jest.fn(),
  getBankAccounts: jest.fn(),
  createBankAccount: jest.fn(),
  updateBankAccount: jest.fn(),
  softDeleteBankAccount: jest.fn(),
  setPrimaryBankAccount: jest.fn(),
  getTaxInformation: jest.fn(),
  upsertTaxInformation: jest.fn(),
  getPaymentHistory: jest.fn(),
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('EmployeeFinancialProfileResolver', () => {
  let resolver: EmployeeFinancialProfileResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeFinancialProfileResolver,
        { provide: EmployeeFinancialProfileService, useValue: serviceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    resolver = module.get<EmployeeFinancialProfileResolver>(EmployeeFinancialProfileResolver);
    jest.clearAllMocks();
  });

  // ── Profile queries ───────────────────────────────────────────────────────

  describe('employeeFinancialProfile', () => {
    it('retorna el perfil del empleado', async () => {
      // Arrange
      serviceMock.getProfile.mockResolvedValue(profileFixture);

      // Act
      const result = await resolver.employeeFinancialProfile(USER, GQL_CONTEXT, EMPLOYEE_ID);

      // Assert
      expect(serviceMock.getProfile).toHaveBeenCalledWith(TENANT, EMPLOYEE_ID);
      expect(result?.id).toBe(profileFixture.id);
    });

    it('retorna null cuando el perfil no existe (captura NotFoundException)', async () => {
      // Arrange
      serviceMock.getProfile.mockRejectedValue(new NotFoundException());

      // Act
      const result = await resolver.employeeFinancialProfile(USER, GQL_CONTEXT, EMPLOYEE_ID);

      // Assert
      expect(result).toBeNull();
    });

    it('usa tenantId del JWT cuando está disponible (no necesita contexto GQL)', async () => {
      // Arrange
      serviceMock.getProfile.mockResolvedValue(profileFixture);

      // Act
      await resolver.employeeFinancialProfile(USER, GQL_CONTEXT, EMPLOYEE_ID);

      // Assert
      expect(serviceMock.getProfile).toHaveBeenCalledWith(TENANT, EMPLOYEE_ID);
    });
  });

  // ── Profile mutations ─────────────────────────────────────────────────────

  describe('createEmployeeFinancialProfile', () => {
    it('delega al service con tenantId y actorUserId', async () => {
      // Arrange
      serviceMock.getOrCreateProfile.mockResolvedValue(profileFixture);

      // Act
      const result = await resolver.createEmployeeFinancialProfile(USER, GQL_CONTEXT, EMPLOYEE_ID);

      // Assert
      expect(serviceMock.getOrCreateProfile).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        USER.sub,
        {},
      );
      expect(result.id).toBe(profileFixture.id);
    });

    it('pasa el paymentMethod del input al service', async () => {
      // Arrange
      serviceMock.getOrCreateProfile.mockResolvedValue(profileFixture);
      const input = { paymentMethod: PaymentMethod.CASH };

      // Act
      await resolver.createEmployeeFinancialProfile(USER, GQL_CONTEXT, EMPLOYEE_ID, input);

      // Assert
      expect(serviceMock.getOrCreateProfile).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        USER.sub,
        input,
      );
    });
  });

  describe('updateEmployeeFinancialProfile', () => {
    it('delega la actualización al service', async () => {
      // Arrange
      serviceMock.updateProfile.mockResolvedValue(profileFixture);
      const input = { paymentMethod: PaymentMethod.CASH };

      // Act
      await resolver.updateEmployeeFinancialProfile(USER, GQL_CONTEXT, EMPLOYEE_ID, input);

      // Assert
      expect(serviceMock.updateProfile).toHaveBeenCalledWith(TENANT, EMPLOYEE_ID, USER.sub, {
        paymentMethod: PaymentMethod.CASH,
      });
    });
  });

  // ── Bank Account queries/mutations ────────────────────────────────────────

  describe('employeeBankAccounts', () => {
    it('retorna maskedAccountNumber, nunca accountNumberEncrypted', async () => {
      // Arrange
      serviceMock.getBankAccounts.mockResolvedValue([bankAccountFixture]);

      // Act
      const result = await resolver.employeeBankAccounts(USER, GQL_CONTEXT, EMPLOYEE_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].maskedAccountNumber).toBe('****1234');
      expect(result[0]).not.toHaveProperty('accountNumberEncrypted');
    });
  });

  describe('createEmployeeBankAccount', () => {
    it('trimea bankName y delega al service', async () => {
      // Arrange
      serviceMock.createBankAccount.mockResolvedValue(bankAccountFixture);
      const input = {
        bankName: '  Bancolombia  ',
        bankCode: '007',
        accountType: BankAccountType.SAVINGS,
        accountNumber: '123456789012',
        isPrimary: true,
      };

      // Act
      const result = await resolver.createEmployeeBankAccount(
        USER,
        GQL_CONTEXT,
        EMPLOYEE_ID,
        input,
      );

      // Assert
      expect(serviceMock.createBankAccount).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        USER.sub,
        expect.objectContaining({ bankName: 'Bancolombia', accountNumber: '123456789012' }),
      );
      expect(result.maskedAccountNumber).toBe('****1234');
    });
  });

  describe('updateEmployeeBankAccount', () => {
    it('delega al service con el id correcto', async () => {
      // Arrange
      serviceMock.updateBankAccount.mockResolvedValue(bankAccountFixture);
      const input = { bankName: 'Davivienda' };

      // Act
      await resolver.updateEmployeeBankAccount(USER, GQL_CONTEXT, EMPLOYEE_ID, 'bank-001', input);

      // Assert
      expect(serviceMock.updateBankAccount).toHaveBeenCalledWith(
        TENANT,
        'bank-001',
        EMPLOYEE_ID,
        USER.sub,
        expect.objectContaining({ bankName: 'Davivienda' }),
      );
    });
  });

  describe('deleteEmployeeBankAccount', () => {
    it('llama softDeleteBankAccount y retorna true', async () => {
      // Arrange
      serviceMock.softDeleteBankAccount.mockResolvedValue(undefined);

      // Act
      const result = await resolver.deleteEmployeeBankAccount(
        USER,
        GQL_CONTEXT,
        EMPLOYEE_ID,
        'bank-001',
      );

      // Assert
      expect(result).toBe(true);
      expect(serviceMock.softDeleteBankAccount).toHaveBeenCalledWith(
        TENANT,
        'bank-001',
        EMPLOYEE_ID,
        USER.sub,
      );
    });
  });

  describe('setPrimaryBankAccount', () => {
    it('retorna el perfil con la cuenta primaria actualizada', async () => {
      // Arrange
      const updated = { ...profileFixture, primaryBankAccountId: 'bank-001' };
      serviceMock.setPrimaryBankAccount.mockResolvedValue(updated);

      // Act
      const result = await resolver.setPrimaryBankAccount(
        USER,
        GQL_CONTEXT,
        EMPLOYEE_ID,
        'bank-001',
      );

      // Assert
      expect(serviceMock.setPrimaryBankAccount).toHaveBeenCalledWith(
        TENANT,
        'bank-001',
        EMPLOYEE_ID,
        USER.sub,
      );
      expect(result.primaryBankAccountId).toBe('bank-001');
    });
  });

  // ── Tax Information queries/mutations ─────────────────────────────────────

  describe('employeeTaxInformation', () => {
    it('retorna maskedTaxId, nunca taxIdEncrypted', async () => {
      // Arrange
      serviceMock.getTaxInformation.mockResolvedValue(taxFixture);

      // Act
      const result = await resolver.employeeTaxInformation(USER, GQL_CONTEXT, EMPLOYEE_ID);

      // Assert
      expect(result?.maskedTaxId).toBe('****5678');
      expect(result).not.toHaveProperty('taxIdEncrypted');
    });

    it('retorna null cuando no hay información fiscal', async () => {
      // Arrange
      serviceMock.getTaxInformation.mockResolvedValue(null);

      // Act
      const result = await resolver.employeeTaxInformation(USER, GQL_CONTEXT, EMPLOYEE_ID);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('upsertEmployeeTaxInformation', () => {
    it('trimea taxId y delega al service', async () => {
      // Arrange
      serviceMock.upsertTaxInformation.mockResolvedValue(taxFixture);
      const input = { taxId: '  9001234567  ', withholdingApplicable: false };

      // Act
      const result = await resolver.upsertEmployeeTaxInformation(
        USER,
        GQL_CONTEXT,
        EMPLOYEE_ID,
        input,
      );

      // Assert
      expect(serviceMock.upsertTaxInformation).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        USER.sub,
        expect.objectContaining({ taxId: '9001234567' }),
      );
      expect(result.maskedTaxId).toBe('****5678');
    });
  });

  // ── Payment History (solo lectura) ────────────────────────────────────────

  describe('employeePaymentHistory', () => {
    it('retorna edges y pageInfo correctamente', async () => {
      // Arrange
      serviceMock.getPaymentHistory.mockResolvedValue({
        edges: [paymentHistoryFixture],
        pageInfo: { hasNextPage: false, endCursor: null },
      });

      // Act
      const result = await resolver.employeePaymentHistory(
        USER,
        GQL_CONTEXT,
        EMPLOYEE_ID,
        undefined,
        20,
      );

      // Assert
      expect(result.edges).toHaveLength(1);
      expect(typeof result.edges[0].grossAmount).toBe('number');
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('delega con cursor y take al service', async () => {
      // Arrange
      serviceMock.getPaymentHistory.mockResolvedValue({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      });

      // Act
      await resolver.employeePaymentHistory(USER, GQL_CONTEXT, EMPLOYEE_ID, 'cursor-xyz', 10);

      // Assert
      expect(serviceMock.getPaymentHistory).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        'cursor-xyz',
        10,
      );
    });
  });
});
