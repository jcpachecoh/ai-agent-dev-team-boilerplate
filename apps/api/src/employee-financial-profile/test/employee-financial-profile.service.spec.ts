import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { BankAccountType, PaymentMethod } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { EmployeeFinancialProfileRepository } from '../repository/employee-financial-profile.repository';
import { EmployeeFinancialProfileService } from '../service/employee-financial-profile.service';

const TENANT_ID = 'tenant-001';
const OTHER_TENANT_ID = 'tenant-002';
const EMPLOYEE_ID = 'emp-001';
const PROFILE_ID = 'profile-001';
const ACCOUNT_ID = 'account-001';
const ACTOR_ID = 'user-admin-001';

const mockEmployee = {
  id: EMPLOYEE_ID,
  tenantId: TENANT_ID,
  isActive: true,
  deletedAt: null,
};

const mockProfile = {
  id: PROFILE_ID,
  tenantId: TENANT_ID,
  employeeDetailsId: EMPLOYEE_ID,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  primaryBankAccountId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockAccount = {
  id: ACCOUNT_ID,
  tenantId: TENANT_ID,
  financialProfileId: PROFILE_ID,
  bankName: 'Bancolombia',
  bankCode: '1007',
  accountType: BankAccountType.SAVINGS,
  accountNumberEncrypted: 'iv:tag:data',
  accountLast4: '1234',
  isPrimary: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockTaxInfo = {
  id: 'tax-001',
  tenantId: TENANT_ID,
  financialProfileId: PROFILE_ID,
  taxIdEncrypted: 'iv:tag:data',
  taxIdLast4: '5678',
  taxRegime: null,
  withholdingApplicable: false,
  withholdingRate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EmployeeFinancialProfileService', () => {
  let service: EmployeeFinancialProfileService;
  let repository: jest.Mocked<EmployeeFinancialProfileRepository>;
  let encryption: jest.Mocked<EncryptionService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeFinancialProfileService,
        {
          provide: EmployeeFinancialProfileRepository,
          useValue: {
            findEmployee: jest.fn(),
            findProfileByEmployee: jest.fn(),
            findProfileById: jest.fn(),
            createProfile: jest.fn(),
            updateProfile: jest.fn(),
            softDeleteProfile: jest.fn(),
            findBankAccounts: jest.fn(),
            findBankAccountById: jest.fn(),
            createBankAccount: jest.fn(),
            updateBankAccount: jest.fn(),
            softDeleteBankAccount: jest.fn(),
            clearPrimaryBankAccounts: jest.fn(),
            setBankAccountPrimary: jest.fn(),
            findTaxInformation: jest.fn(),
            upsertTaxInformation: jest.fn(),
            findPaymentHistory: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn().mockReturnValue('iv:tag:encrypted'),
            decrypt: jest.fn().mockReturnValue('decrypted'),
            mask: jest.fn().mockReturnValue('****1234'),
            last: jest.fn().mockReturnValue('1234'),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeFinancialProfileService>(EmployeeFinancialProfileService);
    repository = module.get(
      EmployeeFinancialProfileRepository,
    ) as jest.Mocked<EmployeeFinancialProfileRepository>;
    encryption = module.get(EncryptionService) as jest.Mocked<EncryptionService>;
    auditService = module.get(AuditService) as jest.Mocked<AuditService>;
  });

  // ── getOrCreateProfile ──────────────────────────────────────────────────────

  describe('getOrCreateProfile', () => {
    it('crea perfil cuando no existe', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(null);
      repository.createProfile.mockResolvedValue(mockProfile);

      // Act
      const result = await service.getOrCreateProfile(TENANT_ID, EMPLOYEE_ID, ACTOR_ID);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(repository.createProfile).toHaveBeenCalledWith(
        TENANT_ID,
        EMPLOYEE_ID,
        expect.any(Object),
      );
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }));
    });

    it('retorna el perfil existente sin crear uno nuevo', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(mockProfile);

      // Act
      const result = await service.getOrCreateProfile(TENANT_ID, EMPLOYEE_ID, ACTOR_ID);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(repository.createProfile).not.toHaveBeenCalled();
    });

    it('rechaza si el empleado no existe en el tenant (tenant isolation)', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getOrCreateProfile(TENANT_ID, EMPLOYEE_ID, ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si el empleado pertenece a otro tenant', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue({ ...mockEmployee, tenantId: OTHER_TENANT_ID });

      // Act & Assert
      await expect(service.getOrCreateProfile(TENANT_ID, EMPLOYEE_ID, ACTOR_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si el empleado está inactivo', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue({ ...mockEmployee, isActive: false });

      // Act & Assert
      await expect(service.getOrCreateProfile(TENANT_ID, EMPLOYEE_ID, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza si el empleado tiene deletedAt', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue({ ...mockEmployee, deletedAt: new Date() });

      // Act & Assert
      await expect(service.getOrCreateProfile(TENANT_ID, EMPLOYEE_ID, ACTOR_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('propaga ConflictException en race condition (P2002)', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(null);
      const prismaError = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
      });
      repository.createProfile.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.getOrCreateProfile(TENANT_ID, EMPLOYEE_ID, ACTOR_ID)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ── createBankAccount ───────────────────────────────────────────────────────

  describe('createBankAccount', () => {
    const validInput = {
      bankName: 'Bancolombia',
      bankCode: '1007',
      accountType: BankAccountType.SAVINGS,
      accountNumber: '1234567890',
      isPrimary: false,
    };

    beforeEach(() => {
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(mockProfile);
    });

    it('cifra el número de cuenta antes de persistir', async () => {
      // Arrange
      repository.createBankAccount.mockResolvedValue(mockAccount);

      // Act
      await service.createBankAccount(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, validInput);

      // Assert
      expect(encryption.encrypt).toHaveBeenCalledWith('1234567890');
      expect(repository.createBankAccount).toHaveBeenCalledWith(
        TENANT_ID,
        PROFILE_ID,
        expect.objectContaining({ accountNumberEncrypted: 'iv:tag:encrypted' }),
      );
    });

    it('guarda accountLast4 desde el número en claro', async () => {
      // Arrange
      repository.createBankAccount.mockResolvedValue(mockAccount);
      encryption.last.mockReturnValue('7890');

      // Act
      await service.createBankAccount(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, validInput);

      // Assert
      expect(repository.createBankAccount).toHaveBeenCalledWith(
        TENANT_ID,
        PROFILE_ID,
        expect.objectContaining({ accountLast4: '7890' }),
      );
    });

    it('lanza BadRequestException si el número de cuenta tiene caracteres no numéricos', async () => {
      // Act & Assert
      await expect(
        service.createBankAccount(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, {
          ...validInput,
          accountNumber: 'abc123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza BadRequestException si el número de cuenta es muy corto', async () => {
      // Act & Assert
      await expect(
        service.createBankAccount(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, {
          ...validInput,
          accountNumber: '12345', // 5 dígitos — mínimo es 6
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('limpia cuentas primarias anteriores cuando isPrimary=true', async () => {
      // Arrange
      repository.createBankAccount.mockResolvedValue({ ...mockAccount, isPrimary: true });
      repository.updateProfile.mockResolvedValue(mockProfile);

      // Act
      await service.createBankAccount(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, {
        ...validInput,
        isPrimary: true,
      });

      // Assert
      expect(repository.clearPrimaryBankAccounts).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID);
    });

    it('registra auditoría al crear cuenta bancaria', async () => {
      // Arrange
      repository.createBankAccount.mockResolvedValue(mockAccount);

      // Act
      await service.createBankAccount(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, validInput);

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'EmployeeBankAccount',
          action: 'CREATE',
        }),
      );
    });
  });

  // ── softDeleteBankAccount ───────────────────────────────────────────────────

  describe('softDeleteBankAccount', () => {
    beforeEach(() => {
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(mockProfile);
    });

    it('hace soft delete de la cuenta bancaria (no hard delete)', async () => {
      // Arrange
      repository.findBankAccountById.mockResolvedValue(mockAccount);

      // Act
      await service.softDeleteBankAccount(TENANT_ID, ACCOUNT_ID, EMPLOYEE_ID, ACTOR_ID);

      // Assert
      expect(repository.softDeleteBankAccount).toHaveBeenCalledWith(TENANT_ID, ACCOUNT_ID);
    });

    it('lanza NotFoundException si la cuenta no existe', async () => {
      // Arrange
      repository.findBankAccountById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.softDeleteBankAccount(TENANT_ID, 'ghost-id', EMPLOYEE_ID, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('limpia primaryBankAccountId del perfil si se borra la cuenta primaria', async () => {
      // Arrange
      repository.findBankAccountById.mockResolvedValue({ ...mockAccount, isPrimary: true });
      repository.updateProfile.mockResolvedValue(mockProfile);

      // Act
      await service.softDeleteBankAccount(TENANT_ID, ACCOUNT_ID, EMPLOYEE_ID, ACTOR_ID);

      // Assert
      expect(repository.updateProfile).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID, {
        primaryBankAccountId: null,
      });
    });
  });

  // ── setPrimaryBankAccount ───────────────────────────────────────────────────

  describe('setPrimaryBankAccount', () => {
    beforeEach(() => {
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(mockProfile);
    });

    it('establece la cuenta como primaria limpiando las anteriores', async () => {
      // Arrange
      repository.findBankAccountById.mockResolvedValue(mockAccount);
      repository.updateProfile.mockResolvedValue({
        ...mockProfile,
        primaryBankAccountId: ACCOUNT_ID,
      });

      // Act
      await service.setPrimaryBankAccount(TENANT_ID, ACCOUNT_ID, EMPLOYEE_ID, ACTOR_ID);

      // Assert
      expect(repository.clearPrimaryBankAccounts).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID);
      expect(repository.setBankAccountPrimary).toHaveBeenCalledWith(TENANT_ID, ACCOUNT_ID);
    });

    it('lanza NotFoundException si la cuenta no existe', async () => {
      // Arrange
      repository.findBankAccountById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.setPrimaryBankAccount(TENANT_ID, 'ghost-id', EMPLOYEE_ID, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si la cuenta está inactiva', async () => {
      // Arrange
      repository.findBankAccountById.mockResolvedValue({ ...mockAccount, isActive: false });

      // Act & Assert
      await expect(
        service.setPrimaryBankAccount(TENANT_ID, ACCOUNT_ID, EMPLOYEE_ID, ACTOR_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── upsertTaxInformation ────────────────────────────────────────────────────

  describe('upsertTaxInformation', () => {
    beforeEach(() => {
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(mockProfile);
      repository.findTaxInformation.mockResolvedValue(null);
    });

    it('cifra el taxId antes de persistir', async () => {
      // Arrange
      repository.upsertTaxInformation.mockResolvedValue(mockTaxInfo);

      // Act
      await service.upsertTaxInformation(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, {
        taxId: '900123456',
      });

      // Assert
      expect(encryption.encrypt).toHaveBeenCalledWith('900123456');
      expect(repository.upsertTaxInformation).toHaveBeenCalledWith(
        TENANT_ID,
        PROFILE_ID,
        expect.objectContaining({ taxIdEncrypted: 'iv:tag:encrypted' }),
      );
    });

    it('guarda taxIdLast4 desde el valor en claro', async () => {
      // Arrange
      repository.upsertTaxInformation.mockResolvedValue(mockTaxInfo);
      encryption.last.mockReturnValue('3456');

      // Act
      await service.upsertTaxInformation(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, {
        taxId: '900123456',
      });

      // Assert
      expect(repository.upsertTaxInformation).toHaveBeenCalledWith(
        TENANT_ID,
        PROFILE_ID,
        expect.objectContaining({ taxIdLast4: '3456' }),
      );
    });

    it('lanza BadRequestException si taxId está vacío', async () => {
      // Act & Assert
      await expect(
        service.upsertTaxInformation(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, { taxId: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('registra auditoría con action CREATE en primer upsert', async () => {
      // Arrange
      repository.upsertTaxInformation.mockResolvedValue(mockTaxInfo);

      // Act
      await service.upsertTaxInformation(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, {
        taxId: '900123456',
      });

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'EmployeeTaxInformation' }),
      );
    });

    it('registra auditoría con action UPDATE en actualizaciones', async () => {
      // Arrange
      repository.findTaxInformation.mockResolvedValue(mockTaxInfo);
      repository.upsertTaxInformation.mockResolvedValue(mockTaxInfo);

      // Act
      await service.upsertTaxInformation(TENANT_ID, EMPLOYEE_ID, ACTOR_ID, {
        taxId: '900123456',
      });

      // Assert
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE', entityType: 'EmployeeTaxInformation' }),
      );
    });
  });

  // ── getPaymentHistory (read-only) ───────────────────────────────────────────

  describe('getPaymentHistory', () => {
    it('retorna el historial paginado del perfil', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(mockProfile);
      const mockPage = {
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      };
      repository.findPaymentHistory.mockResolvedValue(mockPage);

      // Act
      const result = await service.getPaymentHistory(TENANT_ID, EMPLOYEE_ID);

      // Assert
      expect(result).toEqual(mockPage);
      expect(repository.findPaymentHistory).toHaveBeenCalledWith(
        TENANT_ID,
        PROFILE_ID,
        undefined,
        20,
      );
    });

    it('rechaza si no existe perfil para el empleado', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findProfileByEmployee.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPaymentHistory(TENANT_ID, EMPLOYEE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
