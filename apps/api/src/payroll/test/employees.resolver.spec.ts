import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesResolver } from '../resolver/employees.resolver';
import { PayrollService } from '../service/payroll.service';
import { EmployeeContractType, SalaryType, ArlRiskLevel, DocumentType } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';

function makeJwtUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-id',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    roleId: 'role-1',
    roleCode: 'OWNER',
    ...overrides,
  };
}

describe('EmployeesResolver', () => {
  let resolver: EmployeesResolver;
  let service: PayrollService;

  const mockTenantId = 'tenant-1';
  const mockUser = makeJwtUser();
  const mockContext = { req: { headers: { 'x-tenant-id': mockTenantId } } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesResolver,
        {
          provide: PayrollService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<EmployeesResolver>(EmployeesResolver);
    service = module.get<PayrollService>(PayrollService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('employees', () => {
    it('should delegate to service.findAll', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([]);
      const result = await resolver.employees(mockUser, mockContext, 'loc-1');
      expect(result.items).toEqual([]);
      expect(service.findAll).toHaveBeenCalledWith(
        mockTenantId,
        expect.objectContaining({ locationId: 'loc-1' }),
        { userId: 'user-id', roleCode: 'OWNER' },
      );
    });
  });

  describe('employee', () => {
    it('should delegate to service.findOne', async () => {
      (service.findOne as jest.Mock).mockResolvedValue({ id: 'emp-1', salaryAmount: '1000' });
      const result = await resolver.employee(mockUser, mockContext, 'user-1');
      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith(mockTenantId, 'user-1', {
        userId: 'user-id',
        roleCode: 'OWNER',
      });
    });
  });

  describe('createEmployee', () => {
    it('should delegate to service.create', async () => {
      const input = { email: 'test@test.com' } as any;
      (service.create as jest.Mock).mockResolvedValue({ id: 'emp-1', salaryAmount: '1000' });
      await resolver.createEmployee(mockUser, mockContext, input);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, input, 'user-id');
    });
  });

  describe('updateEmployee', () => {
    it('should delegate to service.update', async () => {
      const input = { position: 'New Position' } as any;
      (service.update as jest.Mock).mockResolvedValue({ id: 'emp-1', salaryAmount: '1000' });
      await resolver.updateEmployee(mockUser, mockContext, 'user-1', input);
      expect(service.update).toHaveBeenCalledWith(mockTenantId, 'user-1', input, 'user-id');
    });
  });

  describe('deactivateEmployee', () => {
    it('should delegate to service.remove and return the deactivated employee', async () => {
      const deactivatedEmployee = {
        id: 'emp-1',
        userId: 'user-1',
        salaryAmount: '1000',
        isActive: false,
        deletedAt: new Date('2026-07-09T00:00:00.000Z'),
      };
      (service.remove as jest.Mock).mockResolvedValue(deactivatedEmployee);
      const result = await resolver.deactivateEmployee(mockUser, mockContext, 'user-1');
      expect(result).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          isActive: false,
          deletedAt: deactivatedEmployee.deletedAt,
        }),
      );
      expect(service.remove).toHaveBeenCalledWith(mockTenantId, 'user-1');
    });
  });
});
