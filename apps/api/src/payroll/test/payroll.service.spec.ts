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
  Prisma,
} from '@prisma/client';
import { PayrollService } from '../service/payroll.service';
import { PayrollRepository } from '../repository/payroll.repository';
import { SMLV_2025 } from '../payroll.constants';

describe('PayrollService', () => {
  let service: PayrollService;
  let repository: PayrollRepository;

  const mockTenantId = 'tenant-1';
  const mockLocationId = 'loc-1';
  const mockRoleId = 'role-1';

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
  };

  const mockLinkedUser = {
    id: 'user-1',
    email: 'test@example.com',
    cedula: '123456',
  };

  const setupSuccessfulCreate = () => {
    (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(mockLinkedUser);
    (repository.findByUserId as jest.Mock).mockResolvedValue(null);
    (repository.findLocationById as jest.Mock).mockResolvedValue({
      id: mockLocationId,
      tenantId: mockTenantId,
    });
    (repository.findRoleById as jest.Mock).mockResolvedValue({
      id: mockRoleId,
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
            findUserByEmailAndCedula: jest.fn(),
            findLocationById: jest.fn(),
            findRoleById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PayrollService>(PayrollService);
    repository = module.get<PayrollRepository>(PayrollRepository);
  });

  describe('create', () => {
    it('should create an employee successfully', async () => {
      setupSuccessfulCreate();
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...mockEmployeeData });

      const result = await service.create(mockTenantId, mockEmployeeData);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          userId: mockLinkedUser.id,
          roleId: mockRoleId,
        }),
      );
    });

    it('should throw BadRequestException when user is not registered in Usuarios', async () => {
      (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if user is already an employee', async () => {
      (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(mockLinkedUser);
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
      (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(mockLinkedUser);
      (repository.findByUserId as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: mockTenantId,
      });
      (repository.findRoleById as jest.Mock).mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if location is null', async () => {
      (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(mockLinkedUser);
      (repository.findByUserId as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if location belongs to a different tenant', async () => {
      (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(mockLinkedUser);
      (repository.findByUserId as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: 'other-tenant',
      });

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if role belongs to a different tenant', async () => {
      (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(mockLinkedUser);
      (repository.findByUserId as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: mockTenantId,
      });
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
      (repository.findUserByEmailAndCedula as jest.Mock).mockResolvedValue(mockLinkedUser);
      (repository.findByUserId as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: mockTenantId,
      });
      (repository.findRoleById as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        tenantId: mockTenantId,
      });
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1' });

      await expect(service.create(mockTenantId, validData)).resolves.toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all employees for a tenant', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([{ tenantId: mockTenantId }]);

      const result = await service.findAll(mockTenantId, {});
      expect(result).toHaveLength(1);
      expect(repository.findAll).toHaveBeenCalledWith({ tenantId: mockTenantId });
    });

    it('should pass extra filters through to the repository', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([]);

      await service.findAll(mockTenantId, { isActive: true });
      expect(repository.findAll).toHaveBeenCalledWith({ isActive: true, tenantId: mockTenantId });
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
  });

  describe('findByLocation', () => {
    it('should return employees at a given location', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([{ tenantId: mockTenantId }]);

      const result = await service.findByLocation(mockTenantId, mockLocationId);
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
      );
      expect(result).toHaveLength(1);
      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.INDEFINIDO,
      });
    });
  });

  describe('findOne', () => {
    it('should return an employee', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({ tenantId: mockTenantId });
      const result = await service.findOne(mockTenantId, 'user-1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found or different tenant', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({ tenantId: 'other' });
      await expect(service.findOne(mockTenantId, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should perform soft delete on employee details only', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({ tenantId: mockTenantId });
      await service.remove(mockTenantId, 'user-1');
      expect(repository.softDelete).toHaveBeenCalledWith('user-1');
    });
  });

  describe('query helpers', () => {
    it('findByLocation delegates to repository', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([]);

      await service.findByLocation(mockTenantId, mockLocationId);

      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        locationId: mockLocationId,
      });
    });

    it('findByContractType delegates to repository', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([]);

      await service.findByContractType(mockTenantId, EmployeeContractType.OBRA);

      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.OBRA,
      });
    });
  });
});
