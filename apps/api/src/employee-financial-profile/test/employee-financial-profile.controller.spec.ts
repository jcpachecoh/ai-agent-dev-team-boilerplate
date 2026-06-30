import { BadRequestException, type CanActivate, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BankAccountType, FinancialPaymentStatus, PaymentMethod } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeFinancialProfileController } from '../controller/employee-financial-profile.controller';
import { EmployeeFinancialProfileService } from '../service/employee-financial-profile.service';

const allowGuard: CanActivate = { canActivate: () => true };

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT = 'tenant-001';
const EMPLOYEE_ID = 'emp-001';
const USER = { sub: 'user-001', tenantId: TENANT, email: 'user@test.com' } as any;
const USER_NO_TENANT = { sub: 'user-001', email: 'user@test.com' } as any;

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

describe('EmployeeFinancialProfileController', () => {
  let controller: EmployeeFinancialProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeFinancialProfileController],
      providers: [{ provide: EmployeeFinancialProfileService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get<EmployeeFinancialProfileController>(EmployeeFinancialProfileController);
    jest.clearAllMocks();
  });

  // ── resolveTenantId ───────────────────────────────────────────────────────

  describe('resolveTenantId (via getProfile)', () => {
    it('usa tenantId del JWT cuando está disponible', async () => {
      // Arrange
      serviceMock.getProfile.mockResolvedValue(profileFixture);

      // Act
      await controller.getProfile(USER, '', EMPLOYEE_ID);

      // Assert
      expect(serviceMock.getProfile).toHaveBeenCalledWith(TENANT, EMPLOYEE_ID);
    });

    it('cae al header x-tenant-id cuando el JWT no tiene tenantId', async () => {
      // Arrange
      serviceMock.getProfile.mockResolvedValue(profileFixture);

      // Act
      await controller.getProfile(USER_NO_TENANT, TENANT, EMPLOYEE_ID);

      // Assert
      expect(serviceMock.getProfile).toHaveBeenCalledWith(TENANT, EMPLOYEE_ID);
    });

    it('lanza BadRequestException cuando no hay tenantId en JWT ni en header', async () => {
      await expect(controller.getProfile(USER_NO_TENANT, '', EMPLOYEE_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(serviceMock.getProfile).not.toHaveBeenCalled();
    });
  });

  // ── Financial Profile ─────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('retorna el perfil mapeado', async () => {
      // Arrange
      serviceMock.getProfile.mockResolvedValue(profileFixture);

      // Act
      const result = await controller.getProfile(USER, '', EMPLOYEE_ID);

      // Assert
      expect(result.id).toBe(profileFixture.id);
      expect(result.tenantId).toBe(TENANT);
      expect(result.paymentMethod).toBe(PaymentMethod.BANK_TRANSFER);
    });

    it('propaga NotFoundException del service', async () => {
      // Arrange
      serviceMock.getProfile.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(controller.getProfile(USER, '', EMPLOYEE_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createProfile', () => {
    it('delega al service y retorna el perfil', async () => {
      // Arrange
      serviceMock.getOrCreateProfile.mockResolvedValue(profileFixture);
      const body = { paymentMethod: PaymentMethod.BANK_TRANSFER } as any;

      // Act
      const result = await controller.createProfile(USER, '', EMPLOYEE_ID, body);

      // Assert
      expect(serviceMock.getOrCreateProfile).toHaveBeenCalledWith(TENANT, EMPLOYEE_ID, USER.sub, {
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      });
      expect(result.id).toBe(profileFixture.id);
    });
  });

  describe('updateProfile', () => {
    it('delega al service con los datos correctos', async () => {
      // Arrange
      serviceMock.updateProfile.mockResolvedValue(profileFixture);
      const body = { paymentMethod: PaymentMethod.CASH } as any;

      // Act
      await controller.updateProfile(USER, '', EMPLOYEE_ID, body);

      // Assert
      expect(serviceMock.updateProfile).toHaveBeenCalledWith(TENANT, EMPLOYEE_ID, USER.sub, {
        paymentMethod: PaymentMethod.CASH,
      });
    });
  });

  // ── Bank Accounts ─────────────────────────────────────────────────────────

  describe('getBankAccounts', () => {
    it('retorna cuentas con maskedAccountNumber, nunca el número completo', async () => {
      // Arrange
      serviceMock.getBankAccounts.mockResolvedValue([bankAccountFixture]);

      // Act
      const result = await controller.getBankAccounts(USER, '', EMPLOYEE_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].maskedAccountNumber).toBe('****1234');
      expect(result[0]).not.toHaveProperty('accountNumberEncrypted');
    });
  });

  describe('createBankAccount', () => {
    it('trimea el nombre del banco y delega al service', async () => {
      // Arrange
      serviceMock.createBankAccount.mockResolvedValue(bankAccountFixture);
      const body = {
        bankName: '  Bancolombia  ',
        bankCode: '007',
        accountType: BankAccountType.SAVINGS,
        accountNumber: '123456789012',
        isPrimary: true,
      } as any;

      // Act
      const result = await controller.createBankAccount(USER, '', EMPLOYEE_ID, body);

      // Assert
      expect(serviceMock.createBankAccount).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        USER.sub,
        expect.objectContaining({ bankName: 'Bancolombia', accountNumber: '123456789012' }),
      );
      expect(result.maskedAccountNumber).toBe('****1234');
      expect(result).not.toHaveProperty('accountNumberEncrypted');
    });
  });

  describe('updateBankAccount', () => {
    it('delega al service con el id correcto', async () => {
      // Arrange
      serviceMock.updateBankAccount.mockResolvedValue(bankAccountFixture);
      const body = { bankName: 'Davivienda' } as any;

      // Act
      await controller.updateBankAccount(USER, '', EMPLOYEE_ID, 'bank-001', body);

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

  describe('deleteBankAccount', () => {
    it('llama softDeleteBankAccount y retorna true', async () => {
      // Arrange
      serviceMock.softDeleteBankAccount.mockResolvedValue(undefined);

      // Act
      const result = await controller.deleteBankAccount(USER, '', EMPLOYEE_ID, 'bank-001');

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
    it('retorna el perfil actualizado', async () => {
      // Arrange
      const updatedProfile = { ...profileFixture, primaryBankAccountId: 'bank-001' };
      serviceMock.setPrimaryBankAccount.mockResolvedValue(updatedProfile);

      // Act
      const result = await controller.setPrimaryBankAccount(USER, '', EMPLOYEE_ID, 'bank-001');

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

  // ── Tax Information ───────────────────────────────────────────────────────

  describe('getTaxInformation', () => {
    it('retorna maskedTaxId, nunca taxIdEncrypted', async () => {
      // Arrange
      serviceMock.getTaxInformation.mockResolvedValue(taxFixture);

      // Act
      const result = await controller.getTaxInformation(USER, '', EMPLOYEE_ID);

      // Assert
      expect(result?.maskedTaxId).toBe('****5678');
      expect(result).not.toHaveProperty('taxIdEncrypted');
    });

    it('retorna null cuando no hay información fiscal', async () => {
      // Arrange
      serviceMock.getTaxInformation.mockResolvedValue(null);

      // Act
      const result = await controller.getTaxInformation(USER, '', EMPLOYEE_ID);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('upsertTaxInformation', () => {
    it('trimea el taxId y delega al service', async () => {
      // Arrange
      serviceMock.upsertTaxInformation.mockResolvedValue(taxFixture);
      const body = { taxId: '  9001234567  ', withholdingApplicable: false } as any;

      // Act
      const result = await controller.upsertTaxInformation(USER, '', EMPLOYEE_ID, body);

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

  // ── Payment History (read-only) ───────────────────────────────────────────

  describe('getPaymentHistory', () => {
    it('retorna edges y pageInfo con montos como número', async () => {
      // Arrange
      serviceMock.getPaymentHistory.mockResolvedValue({
        edges: [paymentHistoryFixture],
        pageInfo: { hasNextPage: false, endCursor: null },
      });

      // Act
      const result = await controller.getPaymentHistory(
        USER,
        '',
        EMPLOYEE_ID,
        undefined,
        undefined,
      );

      // Assert
      expect(result.edges).toHaveLength(1);
      expect(typeof result.edges[0].grossAmount).toBe('number');
      expect(result.pageInfo.hasNextPage).toBe(false);
    });

    it('parsea el parámetro take como número', async () => {
      // Arrange
      serviceMock.getPaymentHistory.mockResolvedValue({
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      });

      // Act
      await controller.getPaymentHistory(USER, '', EMPLOYEE_ID, 'cursor-abc', '10');

      // Assert
      expect(serviceMock.getPaymentHistory).toHaveBeenCalledWith(
        TENANT,
        EMPLOYEE_ID,
        'cursor-abc',
        10,
      );
    });
  });
});
