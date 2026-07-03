import { Test, TestingModule } from '@nestjs/testing';
import { BankAccountType, FinancialPaymentStatus, PaymentMethod } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeFinancialProfileRepository } from '../repository/employee-financial-profile.repository';

// ── Prisma mock ───────────────────────────────────────────────────────────────

const prismaMock = {
  employeeDetails: { findUnique: jest.fn() },
  employeeFinancialProfile: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  employeeBankAccount: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  employeeTaxInformation: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  employeePaymentHistory: { findMany: jest.fn() },
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT = 'tenant-001';
const EMPLOYEE_ID = 'emp-001';
const PROFILE_ID = 'prof-001';
const BANK_ID = 'bank-001';
const NOW = new Date('2026-06-26T00:00:00Z');

const profileFixture = {
  id: PROFILE_ID,
  tenantId: TENANT,
  employeeDetailsId: EMPLOYEE_ID,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  primaryBankAccountId: null,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

const bankFixture = {
  id: BANK_ID,
  tenantId: TENANT,
  financialProfileId: PROFILE_ID,
  bankName: 'Bancolombia',
  bankCode: '007',
  accountType: BankAccountType.SAVINGS,
  accountNumberEncrypted: '<enc>',
  accountLast4: '1234',
  isPrimary: false,
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
};

const taxFixture = {
  id: 'tax-001',
  tenantId: TENANT,
  financialProfileId: PROFILE_ID,
  taxIdEncrypted: '<enc>',
  taxIdLast4: '5678',
  taxRegime: 'ORDINARIO',
  withholdingApplicable: false,
  withholdingRate: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const paymentFixture = {
  id: 'ph-001',
  tenantId: TENANT,
  financialProfileId: PROFILE_ID,
  bankAccountId: BANK_ID,
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

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('EmployeeFinancialProfileRepository', () => {
  let repository: EmployeeFinancialProfileRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeFinancialProfileRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<EmployeeFinancialProfileRepository>(EmployeeFinancialProfileRepository);
    jest.clearAllMocks();
  });

  // ── Employee resolution ───────────────────────────────────────────────────

  describe('findEmployee', () => {
    it('consulta por id con select reducido', async () => {
      // Arrange
      const employeeRecord = { id: EMPLOYEE_ID, tenantId: TENANT, isActive: true, deletedAt: null };
      prismaMock.employeeDetails.findUnique.mockResolvedValue(employeeRecord);

      // Act
      const result = await repository.findEmployee(EMPLOYEE_ID);

      // Assert
      expect(prismaMock.employeeDetails.findUnique).toHaveBeenCalledWith({
        where: { id: EMPLOYEE_ID },
        select: { id: true, tenantId: true, isActive: true, deletedAt: true },
      });
      expect(result?.id).toBe(EMPLOYEE_ID);
    });

    it('retorna null cuando no existe', async () => {
      // Arrange
      prismaMock.employeeDetails.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findEmployee('no-exist');

      // Assert
      expect(result).toBeNull();
    });
  });

  // ── Financial Profile ─────────────────────────────────────────────────────

  describe('findProfileByEmployee', () => {
    it('filtra por tenantId, employeeDetailsId y deletedAt null', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.findFirst.mockResolvedValue(profileFixture);

      // Act
      await repository.findProfileByEmployee(TENANT, EMPLOYEE_ID);

      // Assert
      expect(prismaMock.employeeFinancialProfile.findFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT, employeeDetailsId: EMPLOYEE_ID, deletedAt: null },
      });
    });
  });

  describe('findProfileById', () => {
    it('filtra por id, tenantId y deletedAt null', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.findFirst.mockResolvedValue(profileFixture);

      // Act
      await repository.findProfileById(TENANT, PROFILE_ID);

      // Assert
      expect(prismaMock.employeeFinancialProfile.findFirst).toHaveBeenCalledWith({
        where: { id: PROFILE_ID, tenantId: TENANT, deletedAt: null },
      });
    });
  });

  describe('createProfile', () => {
    it('crea el perfil con paymentMethod por defecto cuando no se pasa', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.create.mockResolvedValue(profileFixture);

      // Act
      await repository.createProfile(TENANT, EMPLOYEE_ID, {});

      // Assert
      expect(prismaMock.employeeFinancialProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ paymentMethod: 'BANK_TRANSFER' }),
      });
    });

    it('crea el perfil con el paymentMethod indicado', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.create.mockResolvedValue({
        ...profileFixture,
        paymentMethod: PaymentMethod.CASH,
      });

      // Act
      await repository.createProfile(TENANT, EMPLOYEE_ID, { paymentMethod: PaymentMethod.CASH });

      // Assert
      expect(prismaMock.employeeFinancialProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ paymentMethod: PaymentMethod.CASH }),
      });
    });
  });

  describe('updateProfile', () => {
    it('incluye paymentMethod en el update cuando se provee', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.update.mockResolvedValue(profileFixture);

      // Act
      await repository.updateProfile(TENANT, PROFILE_ID, { paymentMethod: PaymentMethod.CASH });

      // Assert
      expect(prismaMock.employeeFinancialProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paymentMethod: PaymentMethod.CASH }),
        }),
      );
    });

    it('incluye primaryBankAccountId en el update cuando se provee (incluso null)', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.update.mockResolvedValue(profileFixture);

      // Act
      await repository.updateProfile(TENANT, PROFILE_ID, { primaryBankAccountId: 'bank-001' });

      // Assert
      expect(prismaMock.employeeFinancialProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ primaryBankAccountId: 'bank-001' }),
        }),
      );
    });

    it('no incluye campos undefined en el data', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.update.mockResolvedValue(profileFixture);

      // Act
      await repository.updateProfile(TENANT, PROFILE_ID, {});

      // Assert
      const callData = prismaMock.employeeFinancialProfile.update.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('paymentMethod');
      expect(callData).not.toHaveProperty('primaryBankAccountId');
    });
  });

  describe('softDeleteProfile', () => {
    it('establece deletedAt al momento actual', async () => {
      // Arrange
      prismaMock.employeeFinancialProfile.update.mockResolvedValue(profileFixture);

      // Act
      await repository.softDeleteProfile(TENANT, PROFILE_ID);

      // Assert
      expect(prismaMock.employeeFinancialProfile.update).toHaveBeenCalledWith({
        where: { id: PROFILE_ID },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  // ── Bank Accounts ─────────────────────────────────────────────────────────

  describe('findBankAccounts', () => {
    it('filtra por tenantId, financialProfileId y deletedAt null', async () => {
      // Arrange
      prismaMock.employeeBankAccount.findMany.mockResolvedValue([bankFixture]);

      // Act
      const result = await repository.findBankAccounts(TENANT, PROFILE_ID);

      // Assert
      expect(prismaMock.employeeBankAccount.findMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT, financialProfileId: PROFILE_ID, deletedAt: null },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findBankAccountById', () => {
    it('filtra por id, tenantId, financialProfileId y deletedAt null', async () => {
      // Arrange
      prismaMock.employeeBankAccount.findFirst.mockResolvedValue(bankFixture);

      // Act
      await repository.findBankAccountById(TENANT, BANK_ID, PROFILE_ID);

      // Assert
      expect(prismaMock.employeeBankAccount.findFirst).toHaveBeenCalledWith({
        where: { id: BANK_ID, tenantId: TENANT, financialProfileId: PROFILE_ID, deletedAt: null },
      });
    });
  });

  describe('createBankAccount', () => {
    it('crea la cuenta con todos los campos', async () => {
      // Arrange
      prismaMock.employeeBankAccount.create.mockResolvedValue(bankFixture);
      const data = {
        bankName: 'Bancolombia',
        bankCode: '007',
        accountType: BankAccountType.SAVINGS,
        accountNumberEncrypted: '<enc>',
        accountLast4: '1234',
        isPrimary: false,
      };

      // Act
      await repository.createBankAccount(TENANT, PROFILE_ID, data);

      // Assert
      expect(prismaMock.employeeBankAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          financialProfileId: PROFILE_ID,
          ...data,
        }),
      });
    });
  });

  describe('updateBankAccount', () => {
    it('incluye bankName, bankCode y accountType cuando se proveen', async () => {
      // Arrange
      prismaMock.employeeBankAccount.update.mockResolvedValue(bankFixture);

      // Act
      await repository.updateBankAccount(TENANT, BANK_ID, {
        bankName: 'Davivienda',
        bankCode: '051',
        accountType: BankAccountType.CHECKING,
      });

      // Assert
      const callData = prismaMock.employeeBankAccount.update.mock.calls[0][0].data;
      expect(callData).toEqual({
        bankName: 'Davivienda',
        bankCode: '051',
        accountType: BankAccountType.CHECKING,
      });
    });

    it('omite campos undefined en el data', async () => {
      // Arrange
      prismaMock.employeeBankAccount.update.mockResolvedValue(bankFixture);

      // Act
      await repository.updateBankAccount(TENANT, BANK_ID, {});

      // Assert
      const callData = prismaMock.employeeBankAccount.update.mock.calls[0][0].data;
      expect(callData).not.toHaveProperty('bankName');
      expect(callData).not.toHaveProperty('bankCode');
      expect(callData).not.toHaveProperty('accountType');
    });
  });

  describe('softDeleteBankAccount', () => {
    it('establece deletedAt e isPrimary false', async () => {
      // Arrange
      prismaMock.employeeBankAccount.update.mockResolvedValue(bankFixture);

      // Act
      await repository.softDeleteBankAccount(TENANT, BANK_ID);

      // Assert
      expect(prismaMock.employeeBankAccount.update).toHaveBeenCalledWith({
        where: { id: BANK_ID },
        data: { deletedAt: expect.any(Date), isPrimary: false },
      });
    });
  });

  describe('clearPrimaryBankAccounts', () => {
    it('limpia isPrimary en todas las cuentas activas del perfil', async () => {
      // Arrange
      prismaMock.employeeBankAccount.updateMany.mockResolvedValue({ count: 1 });

      // Act
      await repository.clearPrimaryBankAccounts(TENANT, PROFILE_ID);

      // Assert
      expect(prismaMock.employeeBankAccount.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT,
          financialProfileId: PROFILE_ID,
          isPrimary: true,
          deletedAt: null,
        },
        data: { isPrimary: false },
      });
    });
  });

  describe('setBankAccountPrimary', () => {
    it('establece isPrimary true en la cuenta indicada', async () => {
      // Arrange
      prismaMock.employeeBankAccount.update.mockResolvedValue({ ...bankFixture, isPrimary: true });

      // Act
      await repository.setBankAccountPrimary(TENANT, BANK_ID);

      // Assert
      expect(prismaMock.employeeBankAccount.update).toHaveBeenCalledWith({
        where: { id: BANK_ID },
        data: { isPrimary: true },
      });
    });
  });

  // ── Tax Information ───────────────────────────────────────────────────────

  describe('findTaxInformation', () => {
    it('filtra por tenantId y financialProfileId', async () => {
      // Arrange
      prismaMock.employeeTaxInformation.findFirst.mockResolvedValue(taxFixture);

      // Act
      await repository.findTaxInformation(TENANT, PROFILE_ID);

      // Assert
      expect(prismaMock.employeeTaxInformation.findFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT, financialProfileId: PROFILE_ID },
      });
    });
  });

  describe('upsertTaxInformation', () => {
    const baseData = {
      taxIdEncrypted: '<enc>',
      taxIdLast4: '5678',
      withholdingApplicable: false,
    };

    it('hace upsert incluyendo taxRegime y withholdingRate cuando se proveen', async () => {
      // Arrange
      prismaMock.employeeTaxInformation.upsert.mockResolvedValue(taxFixture);

      // Act
      await repository.upsertTaxInformation(TENANT, PROFILE_ID, {
        ...baseData,
        taxRegime: 'ORDINARIO',
        withholdingRate: 0.1,
      });

      // Assert
      const call = prismaMock.employeeTaxInformation.upsert.mock.calls[0][0];
      expect(call.update).toMatchObject({ taxRegime: 'ORDINARIO', withholdingRate: 0.1 });
      expect(call.create).toMatchObject({ taxRegime: 'ORDINARIO', withholdingRate: 0.1 });
    });

    it('omite taxRegime y withholdingRate cuando no se proveen', async () => {
      // Arrange
      prismaMock.employeeTaxInformation.upsert.mockResolvedValue(taxFixture);

      // Act
      await repository.upsertTaxInformation(TENANT, PROFILE_ID, baseData);

      // Assert
      const call = prismaMock.employeeTaxInformation.upsert.mock.calls[0][0];
      expect(call.update).not.toHaveProperty('taxRegime');
      expect(call.update).not.toHaveProperty('withholdingRate');
    });
  });

  // ── Payment History ───────────────────────────────────────────────────────

  describe('findPaymentHistory', () => {
    it('usa cursor cuando se provee', async () => {
      // Arrange
      prismaMock.employeePaymentHistory.findMany.mockResolvedValue([paymentFixture]);

      // Act
      await repository.findPaymentHistory(TENANT, PROFILE_ID, 'cursor-abc', 20);

      // Assert
      expect(prismaMock.employeePaymentHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: { id: 'cursor-abc' } }),
      );
    });

    it('omite cursor cuando no se provee', async () => {
      // Arrange
      prismaMock.employeePaymentHistory.findMany.mockResolvedValue([]);

      // Act
      await repository.findPaymentHistory(TENANT, PROFILE_ID, undefined, 20);

      // Assert
      expect(prismaMock.employeePaymentHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: undefined }),
      );
    });

    it('retorna hasNextPage true y recorta edges cuando hay más de take items', async () => {
      // Arrange — take=2, devuelve 3 items (take+1)
      const items = [
        { ...paymentFixture, id: 'ph-1' },
        { ...paymentFixture, id: 'ph-2' },
        { ...paymentFixture, id: 'ph-3' },
      ];
      prismaMock.employeePaymentHistory.findMany.mockResolvedValue(items);

      // Act
      const result = await repository.findPaymentHistory(TENANT, PROFILE_ID, undefined, 2);

      // Assert
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.edges).toHaveLength(2);
      expect(result.pageInfo.endCursor).toBe('ph-2');
    });

    it('retorna hasNextPage false cuando no hay más items', async () => {
      // Arrange — take=20, solo hay 1 item
      prismaMock.employeePaymentHistory.findMany.mockResolvedValue([paymentFixture]);

      // Act
      const result = await repository.findPaymentHistory(TENANT, PROFILE_ID, undefined, 20);

      // Assert
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.edges).toHaveLength(1);
      expect(result.pageInfo.endCursor).toBe(paymentFixture.id);
    });

    it('retorna endCursor null cuando no hay edges', async () => {
      // Arrange
      prismaMock.employeePaymentHistory.findMany.mockResolvedValue([]);

      // Act
      const result = await repository.findPaymentHistory(TENANT, PROFILE_ID);

      // Assert
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.endCursor).toBeNull();
    });
  });
});
