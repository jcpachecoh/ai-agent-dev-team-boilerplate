import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PayrollController } from '../controller/payroll.controller';
import { PayrollService } from '../service/payroll.service';
import { EmployeeContractType, SalaryType, ArlRiskLevel, DocumentType } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';

function makeJwtUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    roleId: 'role-1',
    roleCode: 'OWNER',
    ...overrides,
  };
}

describe('PayrollController', () => {
  let controller: PayrollController;
  let service: PayrollService;

  const mockTenantId = 'tenant-1';
  const mockUser = makeJwtUser();
  const mockEmployee = {
    id: 'emp-1',
    userId: 'user-1',
    tenantId: mockTenantId,
    salaryAmount: { toString: () => '2000000' },
    user: {
      email: 'test@example.com',
      cedula: '123456',
      documentType: DocumentType.CC,
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      providers: [
        {
          provide: PayrollService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            listPaginated: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findByLocation: jest.fn(),
            findByContractType: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PayrollController>(PayrollController);
    service = module.get<PayrollService>(PayrollService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service.create', async () => {
      (service.create as jest.Mock).mockResolvedValue(mockEmployee);
      const dto = {} as any;
      await controller.create(mockUser, mockTenantId, dto);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, dto);
    });

    it('should throw BadRequestException when no tenant id', async () => {
      await expect(controller.create({} as unknown as JwtPayload, '', {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should delegate to service.listPaginated and wrap response', async () => {
      (service.listPaginated as jest.Mock).mockResolvedValue({
        items: [mockEmployee],
        total: 1,
        limit: 50,
        offset: 0,
        summary: { total: 1, active: 1, inactive: 0 },
      });
      const result = await controller.findAll(mockUser, mockTenantId, {} as any);
      expect(service.listPaginated).toHaveBeenCalledWith(
        mockTenantId,
        {},
        {
          userId: 'user-1',
          roleCode: 'OWNER',
        },
      );
      expect(result).toEqual(
        expect.objectContaining({
          total: 1,
          limit: 50,
          offset: 0,
          summary: { total: 1, active: 1, inactive: 0 },
          items: expect.any(Array),
        }),
      );
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne', async () => {
      (service.findOne as jest.Mock).mockResolvedValue(mockEmployee);
      await controller.findOne(mockUser, mockTenantId, 'user-1');
      expect(service.findOne).toHaveBeenCalledWith(mockTenantId, 'user-1', {
        userId: 'user-1',
        roleCode: 'OWNER',
      });
    });

    it('should propagate NotFoundException from service', async () => {
      (service.findOne as jest.Mock).mockRejectedValue(new NotFoundException());
      await expect(controller.findOne(mockUser, mockTenantId, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should delegate to service.update', async () => {
      (service.update as jest.Mock).mockResolvedValue(mockEmployee);
      await controller.update(mockUser, mockTenantId, 'user-1', {} as any);
      expect(service.update).toHaveBeenCalledWith(mockTenantId, 'user-1', {});
    });
  });

  describe('remove', () => {
    it('should delegate to service.remove and return true', async () => {
      (service.remove as jest.Mock).mockResolvedValue(undefined);
      const result = await controller.remove(mockUser, mockTenantId, 'user-1');
      expect(service.remove).toHaveBeenCalledWith(mockTenantId, 'user-1', 'user-1');
      expect(result).toBe(true);
    });
  });
});
