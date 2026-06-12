import { Test, TestingModule } from '@nestjs/testing';
import {
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EmployeeContractType, SalaryType, ArlRiskLevel, DocumentType } from '@prisma/client';
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
    password: 'password123',
    roleId: mockRoleId,
    locationId: mockLocationId,
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
      (repository.findExistingUser as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: mockTenantId,
      });
      (repository.findRoleById as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        tenantId: mockTenantId,
      });
      (repository.create as jest.Mock).mockResolvedValue({ id: 'emp-1', ...mockEmployeeData });

      const result = await service.create(mockTenantId, mockEmployeeData);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email/cedula already exists', async () => {
      (repository.findExistingUser as jest.Mock).mockResolvedValue({ id: 'existing' });

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
      (repository.findExistingUser as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: mockTenantId,
      });
      (repository.findRoleById as jest.Mock).mockResolvedValue({
        id: mockRoleId,
        tenantId: mockTenantId,
      });
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
      (repository.findExistingUser as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: mockTenantId,
      });
      (repository.findRoleById as jest.Mock).mockResolvedValue(null);

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if location is invalid for tenant', async () => {
      (repository.findExistingUser as jest.Mock).mockResolvedValue(null);
      (repository.findLocationById as jest.Mock).mockResolvedValue({
        id: mockLocationId,
        tenantId: 'other-tenant',
      });

      await expect(service.create(mockTenantId, mockEmployeeData)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findRoleById).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should forward tenant-scoped filters to repository', async () => {
      (repository.findAll as jest.Mock).mockResolvedValue([{ id: 'emp-1' }]);

      const result = await service.findAll(mockTenantId, { locationId: mockLocationId, limit: 5 });

      expect(result).toEqual([{ id: 'emp-1' }]);
      expect(repository.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        locationId: mockLocationId,
        limit: 5,
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

  describe('update', () => {
    it('updates employee and recalculates transport subsidy when salary changes', async () => {
      (repository.findByUserId as jest.Mock).mockResolvedValue({
        tenantId: mockTenantId,
        contractType: EmployeeContractType.INDEFINIDO,
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: SMLV_2025,
        contractStart: new Date('2025-01-01'),
        contractEnd: null,
      });
      (repository.update as jest.Mock).mockResolvedValue({ id: 'emp-1' });

      await service.update(mockTenantId, 'user-1', { salaryAmount: SMLV_2025 * 2 + 5 });

      expect(repository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          salaryAmount: SMLV_2025 * 2 + 5,
          hasTransportSubsidy: false,
        }),
      );
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
