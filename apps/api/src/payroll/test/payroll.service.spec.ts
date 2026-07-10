import { Test, TestingModule } from '@nestjs/testing';
import {
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  EmployeeContractType,
  SalaryType,
  ArlRiskLevel,
  DocumentType,
  CostCenter,
  LaborClassification,
  EmployeeRelationshipType,
  Prisma,
} from '@prisma/client';
import { PayrollService } from '../service/payroll.service';
import { PayrollRepository } from '../repository/payroll.repository';
import { EmployeePositionsService } from '../service/employee-positions.service';
import { StorageService } from '../../storage/service/storage.service';
import { AuditService } from '../../audit/service/audit.service';
import { EmployeeSocialProfileService } from '../../employee-social-profile/service/employee-social-profile.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { SMLV_2025 } from '../payroll.constants';
import { StorageDomain } from '../../storage/enums/storage.enums';

describe('PayrollService', () => {
  let service: PayrollService;
  let repository: PayrollRepository;
  let employeePositionsService: EmployeePositionsService;
  let storageService: jest.Mocked<StorageService>;
  let auditService: AuditService;
  let socialProfileService: EmployeeSocialProfileService;

  const mockTenantId = 'tenant-1';
  const mockLocationId = 'loc-1';
  const mockRoleId = 'role-1';
  const mockActor = { userId: 'actor-1', roleCode: 'OWNER' };

  const mockEmployeeData = {
    cedula: '123456',
    documentType: DocumentType.CC,
    email: 'test@example.com',
    roleId: mockRoleId,
    locationId: mockLocationId,
    name: 'Test User',
    position: 'Dev',
    area: 'IT',
    department: 'Software',
    contractType: EmployeeContractType.INDEFINIDO,
    hireDate: new Date(),
    contractStart: new Date(),
    contractEnd: null as Date | null,
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: 2000000,
    epsName: 'EPS',
    pensionFundName: 'Pension',
    cesantiasFundName: 'Cesantias',
    arlName: 'ARL',
    arlRiskLevel: ArlRiskLevel.RIESGO_I,
    cajaCompensacion: 'Caja',
    costCenter: CostCenter.OPERACIONES,
    laborClassification: LaborClassification.ADMINISTRATIVO,
  };

  const mockLinkedUser = {
    id: 'user-1',
    email: 'test@example.com',
    cedula: '123456',
  };

  const setupSuccessfulCreate = (linkedUser: typeof mockLinkedUser | null = mockLinkedUser) => {
    (repository.findUserByEmail as jest.Mock).mockResolvedValue(linkedUser);
    (repository.findUserByCedula as jest.Mock).mockResolvedValue(linkedUser);
    (repository.findByUserId as jest.Mock).mockResolvedValue(null);
    (repository.findLocationById as jest.Mock).mockResolvedValue({
      id: mockLocationId,
      tenantId: mockTenantId,
    });
    (repository.findRoleById as jest.Mock).mockResolvedValue({
      id: mockRoleId,
      tenantId: mockTenantId,
    });
    (repository.findRoleByTenantAndCode as jest.Mock).mockResolvedValue({
      id: 'role-operator',
      tenantId: mockTenantId,
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollService,
        {
          provide: PayrollRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            findExistingUser: jest.fn(),
            findUserByEmail: jest.fn(),
            findUserByCedula: jest.fn(),
            findUserByEmailAndCedula: jest.fn(),
            findLocationById: jest.fn(),
            findRoleById: jest.fn(),
            findRoleByTenantAndCode: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: EmployeePositionsService,
          useValue: {
            findById: jest.fn(),
            assignPositionToEmployee: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            findById: jest.fn(),
            deleteFile: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: EmployeeSocialProfileService,
          useValue: {
            findAllByEmployee: jest.fn().mockResolvedValue([]),
            remove: jest.fn().mockResolvedValue(undefined),
            create: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: UserLocationsService,
          useValue: {
            resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
            assertLocationAllowed: jest.fn(),
          },
        },
        {
          provide: LaborLegalParametersService,
          useValue: {
            // Reproduces the pre-OS-585 hardcoded SMLV_2025 constant so existing
            // salary-validation and transport-subsidy assertions keep passing unchanged.
            getValueAt: jest.fn().mockResolvedValue(SMLV_2025),
          },
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    repository = module.get<PayrollRepository>(PayrollRepository);
    employeePositionsService = module.get<EmployeePositionsService>(EmployeePositionsService);
    storageService = module.get(StorageService);
    auditService = module.get<AuditService>(AuditService);
    socialProfileService = module.get<EmployeeSocialProfileService>(EmployeeSocialProfileService);
  });

  describe('create', () => {
    it('should create an employee when user does not exist yet', async () => {
      setupSuccessfulCreate(null);
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...mockEmployeeData });

      const result = await service.create(mockTenantId, mockEmployeeData);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          userId: undefined,
          roleId: mockRoleId,
          email: mockEmployeeData.email,
          cedula: mockEmployeeData.cedula,
          passwordHash: expect.any(String),
        }),
      );
    });

    it('should create an employee linked to an existing user', async () => {
      setupSuccessfulCreate();
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...mockEmployeeData });

      const result = await service.create(mockTenantId, mockEmployeeData);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          userId: mockLinkedUser.id,
          roleId: undefined,
        }),
      );
    });

    it('should use default OPERATOR role when creating a new user without roleId', async () => {
      setupSuccessfulCreate(null);
      const { roleId: _ignoredRoleId, ...dataWithoutRole } = mockEmployeeData;
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...mockEmployeeData });

      await service.create(mockTenantId, dataWithoutRole);

      expect(repository.findRoleByTenantAndCode).toHaveBeenCalledWith(mockTenantId, 'OPERATOR');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
          roleId: 'role-operator',
        }),
      );
    });

    it('should throw ConflictException if user is already an employee', async () => {
      setupSuccessfulCreate();
      (repository.findByUserId as jest.Mock).mockResolvedValue({ id: 'existing-emp' });

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw UnprocessableEntityException when dates are invalid', async () => {
      const invalidData = {
        ...mockEmployeeData,
        contractType: EmployeeContractType.FIJO,
        contractStart: new Date('2025-01-02'),
        contractEnd: new Date('2025-01-01'),
      };
      await expect(service.create(mockTenantId, invalidData)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException for invalid salary amount', async () => {
      const invalidData = { ...mockEmployeeData, salaryAmount: 0 };
      await expect(service.create(mockTenantId, invalidData)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException if contractEnd is missing for FIJO', async () => {
      const invalidData: any = { ...mockEmployeeData, contractType: EmployeeContractType.FIJO };
      delete invalidData.contractEnd;

      await expect(service.create(mockTenantId, invalidData)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException for PRESTACION below 1 SMLV', async () => {
      const invalidData = {
        ...mockEmployeeData,
        contractType: EmployeeContractType.PRESTACION,
        salaryAmount: SMLV_2025 - 100,
      };

      await expect(service.create(mockTenantId, invalidData)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException for APRENDIZAJE out of range', async () => {
      const invalidData = {
        ...mockEmployeeData,
        contractType: EmployeeContractType.APRENDIZAJE,
        salaryAmount: SMLV_2025 * 0.4,
      };

      await expect(service.create(mockTenantId, invalidData)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException for INTEGRAL below 13 SMLV', async () => {
      const invalidData = {
        ...mockEmployeeData,
        salaryType: SalaryType.INTEGRAL,
        salaryAmount: SMLV_2025 * 12,
      };

      await expect(service.create(mockTenantId, invalidData)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should calculate hasTransportSubsidy correctly', async () => {
      setupSuccessfulCreate();
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1' });

      await service.create(mockTenantId, { ...mockEmployeeData, salaryAmount: SMLV_2025 * 2 });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ hasTransportSubsidy: true }),
      );

      await service.create(mockTenantId, { ...mockEmployeeData, salaryAmount: SMLV_2025 * 2 + 1 });
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ hasTransportSubsidy: false }),
      );
    });

    it('should throw BadRequestException if role is invalid', async () => {
      setupSuccessfulCreate(null);
      (repository.findRoleById as jest.Mock).mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if location is null', async () => {
      setupSuccessfulCreate();
      (repository.findLocationById as jest.Mock).mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if location belongs to a different tenant', async () => {
      setupSuccessfulCreate();
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: 'other-tenant',
      });

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if role belongs to a different tenant', async () => {
      setupSuccessfulCreate(null);
      (repository.findRoleById as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        tenantId: 'other-tenant',
      });

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException when prisma reports duplicate on create', async () => {
      setupSuccessfulCreate();
      (repository.create as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '5.22.0',
        }),
      );

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should pass valid APRENDIZAJE salary', async () => {
      const validData = {
        ...mockEmployeeData,
        contractType: EmployeeContractType.APRENDIZAJE,
        salaryAmount: SMLV_2025 * 0.75,
      };
      setupSuccessfulCreate();
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1' });

      await expect(service.create(mockTenantId, validData)).resolves.toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all employees for a tenant', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([{ tenantId: mockTenantId }]);

      const result = await service.findAll(mockTenantId, {}, mockActor);
      expect(result).toHaveLength(1);
      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        allowedLocationIds: null,
      });
    });

    it('should pass extra filters through to the repository', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([]);

      await service.findAll(mockTenantId, { isActive: true }, mockActor);
      expect(repository.findAll).toHaveBeenCalledWith({
        isActive: true,
        tenantId: mockTenantId,
        allowedLocationIds: null,
      });
    });
  });

  describe('update', () => {
    beforeEach(() => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.INDEFINIDO,
        salaryAmount: 2000000,
        salaryType: SalaryType.ORDINARIO,
        user: { id: 'user-1', email: 'test@example.com', cedula: '123456' },
      });
      (repository.update as jest.Mock).mockResolvedValue({ id: 'emp-1' });
    });

    it('should update without salary or contract changes', async () => {
      const result = await service.update(mockTenantId, 'user-1', { position: 'Senior Dev' });
      expect(result).toBeDefined();
      expect(repository.update).toHaveBeenCalledWith('user-1', {
        employee: { position: 'Senior Dev' },
      });
    });

    it('should recalculate transport subsidy when salary changes', async () => {
      await service.update(mockTenantId, 'user-1', { salaryAmount: 5000000 });
      expect(repository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          employee: expect.objectContaining({ hasTransportSubsidy: expect.any(Boolean) }),
        }),
      );
    });

    it('should validate contract dates when contractType changes', async () => {
      await service.update(mockTenantId, 'user-1', {
        contractType: EmployeeContractType.FIJO,
        contractEnd: new Date('2026-12-31'),
      });
      expect(repository.update).toHaveBeenCalled();
    });

    it('should validate contract dates when contractEnd changes alone', async () => {
      await service.update(mockTenantId, 'user-1', {
        contractEnd: new Date('2026-12-31'),
      });
      expect(repository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when employee does not exist', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue(null);

      await expect(service.update(mockTenantId, 'ghost', { position: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when update location is invalid', async () => {
      (repository.findLocationById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'user-1', { locationId: 'bad-loc' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when update role is invalid', async () => {
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: mockTenantId,
      });
      (repository.findRoleById as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        tenantId: 'other-tenant',
      });

      await expect(
        service.update(mockTenantId, 'user-1', { roleId: mockRoleId, locationId: mockLocationId }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when email or cedula already exists on update', async () => {
      (repository.findExistingUser as jest.Mock).mockResolvedValue({ id: 'other-user' });

      await expect(
        service.update(mockTenantId, 'user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException when prisma reports duplicate on update', async () => {
      (repository.update as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '5.22.0',
        }),
      );

      await expect(service.update(mockTenantId, 'user-1', { position: 'Lead' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should split user fields from employee fields on full update payload', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.FIJO,
        salaryAmount: 2000000,
        salaryType: SalaryType.ORDINARIO,
        contractStart: new Date('2026-06-17'),
        contractEnd: new Date('2026-08-17'),
        user: {
          id: 'cmqh8dntr005chm8m2ws33rt9',
          email: 'rociogaravito@gmail.com',
          cedula: '1234588954',
        },
      });
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: 'cmq9xc3ut002t5zos8tkf2s95',
        tenantId: mockTenantId,
      });
      (repository.findRoleById as jest.Mock).mockResolvedValue({
        id: 'aaaaaaaa-0000-0000-0000-000000000002',
        tenantId: mockTenantId,
      });
      (repository.findExistingUser as jest.Mock).mockResolvedValue(null);

      await service.update(mockTenantId, 'cmqh8dntr005chm8m2ws33rt9', {
        cedula: '1234588954',
        documentType: DocumentType.CC,
        email: 'rociogaravito@gmail.com',
        roleId: 'aaaaaaaa-0000-0000-0000-000000000002',
        locationId: 'cmq9xc3ut002t5zos8tkf2s95',
        name: 'Rocío Garavito',
        position: 'Por definir',
        area: 'Por definir',
        department: 'Por definir',
        contractType: EmployeeContractType.FIJO,
        hireDate: '2026-06-16',
        contractStart: '2026-06-17',
        contractEnd: '2026-08-17',
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: 2589995,
        epsName: 'Por definir',
        pensionFundName: 'Por definir',
        cesantiasFundName: 'Por definir',
        arlName: 'Por definir',
        arlRiskLevel: ArlRiskLevel.RIESGO_I,
        cajaCompensacion: 'Por definir',
      });

      expect(repository.update).toHaveBeenCalledWith(
        'cmqh8dntr005chm8m2ws33rt9',
        expect.objectContaining({
          user: {
            cedula: '1234588954',
            documentType: DocumentType.CC,
            email: 'rociogaravito@gmail.com',
            roleId: 'aaaaaaaa-0000-0000-0000-000000000002',
          },
          employee: expect.not.objectContaining({
            cedula: expect.anything(),
            email: expect.anything(),
            roleId: expect.anything(),
            documentType: expect.anything(),
          }),
        }),
      );
    });

    it('updates employee and recalculates transport subsidy when salary changes', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.INDEFINIDO,
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: SMLV_2025,
        contractStart: new Date('2025-01-01'),
        contractEnd: null,
        user: { id: 'user-1', email: 'test@example.com', cedula: '123456' },
      });
      (repository.update as jest.Mock).mockResolvedValue({ id: 'emp-1' });

      await service.update(mockTenantId, 'user-1', { salaryAmount: SMLV_2025 * 2 + 5 });

      expect(repository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          employee: expect.objectContaining({
            salaryAmount: SMLV_2025 * 2 + 5,
            hasTransportSubsidy: false,
          }),
        }),
      );
    });

    describe('photo update', () => {
      const mockStorageObject = {
        id: 'storage-1',
        tenantId: mockTenantId,
        domain: StorageDomain.USERS,
        entityType: 'EmployeeDetails',
        entityId: 'emp-details-1',
        publicUrl: 'https://cdn.opssynk.com/tenants/t1/users/photo.webp',
      };

      beforeEach(() => {
        (repository.findByUserId as jest.Mock).mockResolvedValue({
          id: 'emp-details-1',
          tenantId: mockTenantId,
          contractType: EmployeeContractType.INDEFINIDO,
          salaryAmount: 2000000,
          salaryType: SalaryType.ORDINARIO,
          photoStorageObjectId: null,
          user: { id: 'user-1', email: 'test@example.com', cedula: '123456' },
        });
        (repository.update as jest.Mock).mockResolvedValue({ id: 'emp-1' });
      });

      it('acepta un photoStorageObjectId válido y lo persiste', async () => {
        // Arrange
        storageService.findById.mockResolvedValue(mockStorageObject as any);

        // Act
        await service.update(mockTenantId, 'user-1', { photoStorageObjectId: 'storage-1' });

        // Assert
        expect(storageService.findById).toHaveBeenCalledWith('storage-1', mockTenantId);
        expect(repository.update).toHaveBeenCalledWith(
          'user-1',
          expect.objectContaining({
            employee: expect.objectContaining({ photoStorageObjectId: 'storage-1' }),
          }),
        );
      });

      it('rechaza si el StorageObject no pertenece al tenant (NotFoundException)', async () => {
        // Arrange
        storageService.findById.mockRejectedValue(
          new NotFoundException('StorageObject no encontrado'),
        );

        // Act & Assert
        await expect(
          service.update(mockTenantId, 'user-1', { photoStorageObjectId: 'bad-id' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('rechaza si el dominio del StorageObject no es USERS', async () => {
        // Arrange
        storageService.findById.mockResolvedValue({
          ...mockStorageObject,
          domain: 'INVENTORY',
        } as any);

        // Act & Assert
        await expect(
          service.update(mockTenantId, 'user-1', { photoStorageObjectId: 'storage-1' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('rechaza si entityType del StorageObject no corresponde a EmployeeDetails', async () => {
        // Arrange
        storageService.findById.mockResolvedValue({
          ...mockStorageObject,
          entityType: 'ProductionRecipe',
          entityId: 'recipe-99',
        } as any);

        // Act & Assert
        await expect(
          service.update(mockTenantId, 'user-1', { photoStorageObjectId: 'storage-1' }),
        ).rejects.toThrow(BadRequestException);
      });

      it('hace soft-delete del StorageObject anterior al actualizar con uno nuevo', async () => {
        // Arrange
        (repository.findByUserId as jest.Mock).mockResolvedValue({
          id: 'emp-details-1',
          tenantId: mockTenantId,
          contractType: EmployeeContractType.INDEFINIDO,
          salaryAmount: 2000000,
          salaryType: SalaryType.ORDINARIO,
          photoStorageObjectId: 'old-storage-id',
          user: { id: 'user-1', email: 'test@example.com', cedula: '123456' },
        });
        storageService.findById.mockResolvedValue(mockStorageObject as any);
        storageService.deleteFile.mockResolvedValue(undefined);

        // Act
        await service.update(mockTenantId, 'user-1', { photoStorageObjectId: 'storage-1' });

        // Assert
        expect(storageService.deleteFile).toHaveBeenCalledWith('old-storage-id', mockTenantId);
      });

      it('acepta photoStorageObjectId null para quitar la foto', async () => {
        // Arrange
        (repository.findByUserId as jest.Mock).mockResolvedValue({
          id: 'emp-details-1',
          tenantId: mockTenantId,
          contractType: EmployeeContractType.INDEFINIDO,
          salaryAmount: 2000000,
          salaryType: SalaryType.ORDINARIO,
          photoStorageObjectId: 'old-storage-id',
          user: { id: 'user-1', email: 'test@example.com', cedula: '123456' },
        });
        storageService.deleteFile.mockResolvedValue(undefined);

        // Act
        await service.update(mockTenantId, 'user-1', { photoStorageObjectId: null });

        // Assert — se elimina la foto anterior, no se llama findById
        expect(storageService.findById).not.toHaveBeenCalled();
        expect(storageService.deleteFile).toHaveBeenCalledWith('old-storage-id', mockTenantId);
        expect(repository.update).toHaveBeenCalledWith(
          'user-1',
          expect.objectContaining({
            employee: expect.objectContaining({ photoStorageObjectId: null }),
          }),
        );
      });

      it('no llama deleteFile si no había foto previa', async () => {
        // Arrange
        storageService.findById.mockResolvedValue(mockStorageObject as any);

        // Act
        await service.update(mockTenantId, 'user-1', { photoStorageObjectId: 'storage-1' });

        // Assert
        expect(storageService.deleteFile).not.toHaveBeenCalled();
      });

      it('rechaza si entityId del StorageObject no coincide con el empleado indicado', async () => {
        // Arrange — mismo tenant, entityType correcto, pero entityId apunta a otro empleado
        storageService.findById.mockResolvedValue({
          ...mockStorageObject,
          entityType: 'EmployeeDetails',
          entityId: 'other-employee-id',
        } as any);

        // Act & Assert
        await expect(
          service.update(mockTenantId, 'user-1', { photoStorageObjectId: 'storage-1' }),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('findByLocation', () => {
    it('should return employees at a given location', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([{ tenantId: mockTenantId }]);

      const result = await service.findByLocation(mockTenantId, mockLocationId, mockActor);
      expect(result).toHaveLength(1);
      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        locationId: mockLocationId,
      });
    });
  });

  describe('findByContractType', () => {
    it('should return employees with a given contract type', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([{ tenantId: mockTenantId }]);

      const result = await service.findByContractType(
        mockTenantId,
        EmployeeContractType.INDEFINIDO,
        mockActor,
      );
      expect(result).toHaveLength(1);
      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.INDEFINIDO,
        allowedLocationIds: null,
      });
    });
  });

  describe('findOne', () => {
    it('should return an employee', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({ tenantId: mockTenantId });
      const result = await service.findOne(mockTenantId, 'user-1', mockActor);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found or different tenant', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({ tenantId: 'other' });
      await expect(service.findOne(mockTenantId, 'user-1', mockActor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should perform soft delete on employee details only and return the deactivated employee', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({ tenantId: mockTenantId });
      const deactivatedEmployee = {
        tenantId: mockTenantId,
        userId: 'user-1',
        isActive: false,
        deletedAt: new Date('2026-07-09T00:00:00.000Z'),
      };
      (repository.softDelete as jest.Mock).mockResolvedValue(deactivatedEmployee);

      const result = await service.remove(mockTenantId, 'user-1');

      expect(repository.softDelete).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(deactivatedEmployee);
    });
  });

  describe('query helpers', () => {
    it('findByLocation delegates to repository', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([]);

      await service.findByLocation(mockTenantId, mockLocationId, mockActor);

      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        locationId: mockLocationId,
      });
    });

    it('findByContractType delegates to repository', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([]);

      await service.findByContractType(mockTenantId, EmployeeContractType.OBRA, mockActor);

      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.OBRA,
        allowedLocationIds: null,
      });
    });
  });

  describe('positionId integration', () => {
    it('assigns catalog position on create when positionId is provided', async () => {
      setupSuccessfulCreate(null);
      (employeePositionsService.findById as jest.Mock).mockResolvedValue({
        id: 'pos-1',
        title: 'Contador',
        area: 'Finanzas',
      });
      (repository.create as jest.Mock).mockResolvedValue({
        id: 'emp-details-1',
        userId: 'user-new',
        tenantId: mockTenantId,
      });
      (repository.findByUserId as jest.Mock).mockResolvedValue({
        id: 'emp-details-1',
        userId: 'user-new',
        tenantId: mockTenantId,
        positionId: 'pos-1',
        position: 'Contador',
      });

      await service.create(
        mockTenantId,
        { ...mockEmployeeData, positionId: 'pos-1' },
        'requester-1',
      );

      expect(employeePositionsService.assignPositionToEmployee).toHaveBeenCalledWith(
        mockTenantId,
        'emp-details-1',
        'pos-1',
        'requester-1',
      );
    });

    it('assigns catalog position on update when positionId changes', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({
        id: 'emp-details-1',
        userId: 'user-1',
        tenantId: mockTenantId,
        positionId: 'pos-old',
        user: { email: 'test@example.com', cedula: '123456' },
      });
      (employeePositionsService.findById as jest.Mock).mockResolvedValue({
        id: 'pos-1',
        title: 'Contador',
        area: 'Finanzas',
      });
      (repository.update as jest.Mock).mockResolvedValue({
        id: 'emp-details-1',
        userId: 'user-1',
        tenantId: mockTenantId,
      });
      (repository.findByUserId as jest.Mock)
        .mockResolvedValueOnce({
          id: 'emp-details-1',
          userId: 'user-1',
          tenantId: mockTenantId,
          positionId: 'pos-old',
          user: { email: 'test@example.com', cedula: '123456' },
        })
        .mockResolvedValueOnce({
          id: 'emp-details-1',
          userId: 'user-1',
          tenantId: mockTenantId,
          positionId: 'pos-1',
        });

      await service.update(mockTenantId, 'user-1', { positionId: 'pos-1' }, 'requester-1');

      expect(employeePositionsService.assignPositionToEmployee).toHaveBeenCalledWith(
        mockTenantId,
        'emp-details-1',
        'pos-1',
        'requester-1',
      );
    });

    it('rejects create without position or positionId', async () => {
      setupSuccessfulCreate(null);

      await expect(
        service.create(mockTenantId, { ...mockEmployeeData, position: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('OS-563 — new employee fields', () => {
    const makeEmployee = (overrides: object = {}) => ({
      tenantId: mockTenantId,
      contractType: EmployeeContractType.INDEFINIDO,
      salaryAmount: 2000000,
      salaryType: SalaryType.ORDINARIO,
      user: { id: 'user-1', email: 'test@example.com', cedula: '123456' },
      ...overrides,
    });

    describe('create — costCenter & laborClassification', () => {
      it('passes costCenter and laborClassification to repository.create', async () => {
        // Arrange
        setupSuccessfulCreate(null);
        (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', tenantId: mockTenantId });

        // Act
        await service.create(mockTenantId, {
          ...mockEmployeeData,
          costCenter: CostCenter.GERENCIA,
          laborClassification: LaborClassification.COCINA,
        });

        // Assert
        expect(repository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            costCenter: CostCenter.GERENCIA,
            laborClassification: LaborClassification.COCINA,
          }),
        );
      });

      it('passes barrio and localidad to repository.create', async () => {
        // Arrange
        setupSuccessfulCreate(null);
        (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', tenantId: mockTenantId });

        // Act
        await service.create(mockTenantId, {
          ...mockEmployeeData,
          barrio: 'Chapinero',
          localidad: 'Chapinero',
        });

        // Assert
        expect(repository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            barrio: 'Chapinero',
            localidad: 'Chapinero',
          }),
        );
      });

      it('passes nonSalaryAmount to repository.create when provided', async () => {
        // Arrange
        setupSuccessfulCreate(null);
        (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', tenantId: mockTenantId });

        // Act
        await service.create(mockTenantId, {
          ...mockEmployeeData,
          nonSalaryAmount: 500000,
        });

        // Assert
        expect(repository.create).toHaveBeenCalledWith(
          expect.objectContaining({ nonSalaryAmount: 500000 }),
        );
      });
    });

    describe('beneficiaries sync', () => {
      const makeEmployee2 = () => ({
        id: 'emp-details-1',
        tenantId: mockTenantId,
        contractType: EmployeeContractType.INDEFINIDO,
        salaryAmount: 2000000,
        salaryType: SalaryType.ORDINARIO,
        user: { id: 'user-1', email: 'test@example.com', cedula: '123456' },
      });

      it('creates beneficiaries on create when beneficiaries array is provided', async () => {
        // Arrange
        setupSuccessfulCreate(null);
        (repository.create as jest.Mock).mockResolvedValue(makeEmployee2());
        (repository.findByUserId as jest.Mock).mockResolvedValue(makeEmployee2());
        (socialProfileService.findAllByEmployee as jest.Mock).mockResolvedValue([]);

        // Act
        await service.create(mockTenantId, {
          ...mockEmployeeData,
          beneficiaries: [
            {
              primerNombre: 'Ana',
              primerApellido: 'López',
              relationshipType: EmployeeRelationshipType.CHILD,
              disability: 'NOT_APPLICABLE',
              fechaNacimiento: '2019-01-01',
            },
          ],
        });

        // Assert
        expect(socialProfileService.create).toHaveBeenCalledWith(
          mockTenantId,
          'emp-details-1',
          expect.objectContaining({
            primerNombre: 'Ana',
            primerApellido: 'López',
            relationshipType: EmployeeRelationshipType.CHILD,
          }),
        );
      });

      it('soft-deletes existing beneficiaries before recreating on update', async () => {
        // Arrange
        const existingProfile = {
          id: 'profile-old',
          fullName: 'Old Person',
          relationshipType: EmployeeRelationshipType.SPOUSE,
        };
        (repository.findByUserId as jest.Mock).mockResolvedValue(makeEmployee2());
        (repository.update as jest.Mock).mockResolvedValue(makeEmployee2());
        (socialProfileService.findAllByEmployee as jest.Mock).mockResolvedValue([existingProfile]);

        // Act
        await service.update(mockTenantId, 'user-1', {
          beneficiaries: [
            {
              primerNombre: 'New',
              primerApellido: 'Person',
              relationshipType: EmployeeRelationshipType.MINOR_IN_CHARGE,
              disability: 'NOT_APPLICABLE',
              fechaNacimiento: '1965-01-01',
            },
          ],
        });

        // Assert
        expect(socialProfileService.remove).toHaveBeenCalledWith(
          mockTenantId,
          'profile-old',
          'emp-details-1',
        );
        expect(socialProfileService.create).toHaveBeenCalledWith(
          mockTenantId,
          'emp-details-1',
          expect.objectContaining({
            primerNombre: 'New',
            primerApellido: 'Person',
            relationshipType: EmployeeRelationshipType.MINOR_IN_CHARGE,
          }),
        );
      });

      it('skips beneficiary sync on update when beneficiaries is not in payload', async () => {
        // Arrange
        (repository.findByUserId as jest.Mock).mockResolvedValue(makeEmployee2());
        (repository.update as jest.Mock).mockResolvedValue(makeEmployee2());

        // Act
        await service.update(mockTenantId, 'user-1', { position: 'Chef' });

        // Assert
        expect(socialProfileService.findAllByEmployee).not.toHaveBeenCalled();
      });
    });

    describe('audit log', () => {
      it('calls auditService.log with CREATE action after successful create', async () => {
        // Arrange
        setupSuccessfulCreate(null);
        (repository.create as jest.Mock).mockResolvedValue({
          id: 'emp-1',
          tenantId: mockTenantId,
        });

        // Act
        await service.create(mockTenantId, mockEmployeeData, 'requester-1');

        // Assert
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'CREATE',
            tenantId: mockTenantId,
          }),
        );
      });

      it('calls auditService.log with UPDATE action after successful update', async () => {
        // Arrange
        (repository.findByUserId as jest.Mock).mockResolvedValue(
          makeEmployee({ id: 'emp-details-1' }),
        );
        (repository.update as jest.Mock).mockResolvedValue({
          id: 'emp-details-1',
          tenantId: mockTenantId,
        });

        // Act
        await service.update(mockTenantId, 'user-1', { position: 'Senior Chef' }, 'requester-1');

        // Assert
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'UPDATE',
            tenantId: mockTenantId,
          }),
        );
      });
    });
  });
});
