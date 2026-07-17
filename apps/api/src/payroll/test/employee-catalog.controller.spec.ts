import { BadRequestException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EmployeeCatalogType } from '@prisma/client';

import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { EmployeeCatalogController } from '../controller/employee-catalog.controller';
import { EmployeeCatalogService } from '../service/employee-catalog.service';

describe('EmployeeCatalogController (OS-606 Task-06A)', () => {
  let controller: EmployeeCatalogController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    deactivate: jest.Mock;
  };

  const mockTenantId = 'tenant-1';
  const mockUser = { tenantId: mockTenantId };
  const mockOption = {
    id: 'opt-1',
    tenantId: mockTenantId,
    type: EmployeeCatalogType.OVERTIME_REASON,
    name: 'Aseo',
    pilaCode: null,
    isActive: true,
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deactivate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeCatalogController],
      providers: [{ provide: EmployeeCatalogService, useValue: service }],
    }).compile();

    controller = module.get(EmployeeCatalogController);
  });

  it('documenta roles de lectura vs escritura de catálogo (no overtime.request)', () => {
    expect(PAYROLL_MODULE_ROLES).toEqual(
      expect.arrayContaining(['OWNER', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGER', 'NOMINA']),
    );
    expect(PAYROLL_WRITE_ROLES).toEqual(
      expect.arrayContaining(['OWNER', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGER']),
    );
    expect(PAYROLL_WRITE_ROLES).not.toContain('NOMINA');
    expect(PAYROLL_WRITE_ROLES as readonly string[]).not.toContain('OPERATOR');
    expect(PAYROLL_MODULE_ROLES as readonly string[]).not.toContain('attendance.overtime.request');
  });

  it('lista con includeInactive para admin', async () => {
    service.findAll.mockResolvedValue([
      mockOption,
      { ...mockOption, id: 'opt-2', isActive: false },
    ]);
    const result = await controller.findAll(mockUser, mockTenantId, {
      type: EmployeeCatalogType.OVERTIME_REASON,
      includeInactive: true,
    });
    expect(service.findAll).toHaveBeenCalledWith(mockTenantId, {
      type: EmployeeCatalogType.OVERTIME_REASON,
      includeInactive: true,
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'opt-1',
      type: EmployeeCatalogType.OVERTIME_REASON,
      name: 'Aseo',
      pilaCode: null,
      isActive: true,
    });
  });

  it('lista activa por defecto (solicitud)', async () => {
    service.findAll.mockResolvedValue([mockOption]);
    await controller.findAll(mockUser, mockTenantId, {
      type: EmployeeCatalogType.OVERTIME_REASON,
    });
    expect(service.findAll).toHaveBeenCalledWith(mockTenantId, {
      type: EmployeeCatalogType.OVERTIME_REASON,
      includeInactive: undefined,
    });
  });

  it('crea opción', async () => {
    service.create.mockResolvedValue(mockOption);
    const result = await controller.create(mockUser, mockTenantId, {
      type: EmployeeCatalogType.OVERTIME_REASON,
      name: 'Aseo',
    });
    expect(service.create).toHaveBeenCalledWith(mockTenantId, {
      type: EmployeeCatalogType.OVERTIME_REASON,
      name: 'Aseo',
      pilaCode: undefined,
    });
    expect(result.isActive).toBe(true);
  });

  it('actualiza label / activa', async () => {
    service.update.mockResolvedValue({ ...mockOption, name: 'Aseo 2' });
    await controller.update(mockUser, mockTenantId, 'opt-1', { name: 'Aseo 2' });
    expect(service.update).toHaveBeenCalledWith(mockTenantId, 'opt-1', {
      name: 'Aseo 2',
      isActive: undefined,
      pilaCode: undefined,
    });
  });

  it('desactiva', async () => {
    service.deactivate.mockResolvedValue({ ...mockOption, isActive: false });
    const result = await controller.deactivate(mockUser, mockTenantId, 'opt-1');
    expect(service.deactivate).toHaveBeenCalledWith(mockTenantId, 'opt-1');
    expect(result.isActive).toBe(false);
  });

  it('exige tenant', async () => {
    await expect(controller.findAll({}, '', {})).rejects.toThrow(BadRequestException);
  });
});
