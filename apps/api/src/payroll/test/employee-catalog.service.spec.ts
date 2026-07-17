import { ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EmployeeCatalogType, Prisma } from '@prisma/client';

import { EmployeeCatalogRepository } from '../repository/employee-catalog.repository';
import { EmployeeCatalogService } from '../service/employee-catalog.service';

describe('EmployeeCatalogService (OS-606 Task-06A)', () => {
  let service: EmployeeCatalogService;
  let repository: {
    findAll: jest.Mock;
    findById: jest.Mock;
    findByTypeAndNameInsensitive: jest.Mock;
    findActiveByIdAndType: jest.Mock;
    countOvertimeRequestReferences: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const tenantId = 'palos-de-lena';
  const otherTenant = 'other-tenant';

  const activeReason = {
    id: 'seed-catalog-palos-de-lena-overtime_reason-aseo',
    tenantId,
    type: EmployeeCatalogType.OVERTIME_REASON,
    name: 'Aseo',
    pilaCode: null,
    isActive: true,
  };

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByTypeAndNameInsensitive: jest.fn().mockResolvedValue(null),
      findActiveByIdAndType: jest.fn(),
      countOvertimeRequestReferences: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeCatalogService,
        { provide: EmployeeCatalogRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(EmployeeCatalogService);
  });

  describe('findAll', () => {
    it('lista activos por defecto (formularios de solicitud)', async () => {
      repository.findAll.mockResolvedValue([activeReason]);
      await service.findAll(tenantId, { type: EmployeeCatalogType.OVERTIME_REASON });
      expect(repository.findAll).toHaveBeenCalledWith(tenantId, {
        type: EmployeeCatalogType.OVERTIME_REASON,
      });
    });

    it('permite includeInactive para administración', async () => {
      repository.findAll.mockResolvedValue([
        activeReason,
        { ...activeReason, id: 'x', name: 'Viejo', isActive: false },
      ]);
      const rows = await service.findAll(tenantId, {
        type: EmployeeCatalogType.OVERTIME_REASON,
        includeInactive: true,
      });
      expect(rows).toHaveLength(2);
      expect(repository.findAll).toHaveBeenCalledWith(tenantId, {
        type: EmployeeCatalogType.OVERTIME_REASON,
        includeInactive: true,
      });
    });
  });

  describe('create', () => {
    it('crea OVERTIME_REASON con pilaCode null y nombre normalizado', async () => {
      repository.create.mockResolvedValue(activeReason);
      await service.create(tenantId, {
        type: EmployeeCatalogType.OVERTIME_REASON,
        name: '  Inventario   físico  ',
        pilaCode: 'XX',
      });
      expect(repository.create).toHaveBeenCalledWith(tenantId, {
        type: EmployeeCatalogType.OVERTIME_REASON,
        name: 'Inventario físico',
        pilaCode: null,
      });
    });

    it('rechaza duplicado case-insensitive en mismo tenant/type', async () => {
      repository.findByTypeAndNameInsensitive.mockResolvedValue(activeReason);
      await expect(
        service.create(tenantId, {
          type: EmployeeCatalogType.OVERTIME_REASON,
          name: 'aseo',
        }),
      ).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('mapea P2002 a ConflictException', async () => {
      repository.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      await expect(
        service.create(tenantId, {
          type: EmployeeCatalogType.OVERTIME_REASON,
          name: 'Nuevo',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update / deactivate', () => {
    it('renombra sin cambiar type ni tenant', async () => {
      repository.findById.mockResolvedValue(activeReason);
      repository.update.mockResolvedValue({ ...activeReason, name: 'Aseo profundo' });
      const updated = await service.update(tenantId, activeReason.id, {
        name: 'Aseo profundo',
      });
      expect(updated.name).toBe('Aseo profundo');
      expect(repository.update).toHaveBeenCalledWith(tenantId, activeReason.id, {
        name: 'Aseo profundo',
      });
    });

    it('desactiva motivo referenciado (conserva historial)', async () => {
      repository.findById.mockResolvedValue(activeReason);
      repository.countOvertimeRequestReferences.mockResolvedValue(3);
      repository.update.mockResolvedValue({ ...activeReason, isActive: false });
      const result = await service.deactivate(tenantId, activeReason.id);
      expect(result.isActive).toBe(false);
      expect(repository.update).toHaveBeenCalledWith(tenantId, activeReason.id, {
        isActive: false,
      });
    });

    it('no encuentra opción de otro tenant', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update(otherTenant, activeReason.id, { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('reactiva con isActive true', async () => {
      repository.findById.mockResolvedValue({ ...activeReason, isActive: false });
      repository.update.mockResolvedValue(activeReason);
      await service.update(tenantId, activeReason.id, { isActive: true });
      expect(repository.update).toHaveBeenCalledWith(tenantId, activeReason.id, {
        isActive: true,
      });
    });
  });

  describe('seeds conservation contract', () => {
    it('los tres nombres seed OVERTIME_REASON siguen siendo válidos para listado', async () => {
      const seedNames = ['Inventario físico semana', 'Inventario físico mensual', 'Aseo'];
      repository.findAll.mockResolvedValue(
        seedNames.map((name, index) => ({
          ...activeReason,
          id: `seed-${index}`,
          name,
        })),
      );
      const rows = await service.findAll(tenantId, {
        type: EmployeeCatalogType.OVERTIME_REASON,
        includeInactive: true,
      });
      expect(rows.map((r) => r.name).sort()).toEqual([...seedNames].sort());
    });
  });

  describe('edge cases', () => {
    it('findActiveByIdAndType delega al repository', async () => {
      repository.findActiveByIdAndType.mockResolvedValue(activeReason);
      await expect(
        service.findActiveByIdAndType(
          tenantId,
          activeReason.id,
          EmployeeCatalogType.OVERTIME_REASON,
        ),
      ).resolves.toEqual(activeReason);
    });

    it('update vacío no llama repository.update', async () => {
      repository.findById.mockResolvedValue(activeReason);
      const result = await service.update(tenantId, activeReason.id, {});
      expect(result).toEqual(activeReason);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rechaza nombre vacío tras normalize', async () => {
      await expect(
        service.create(tenantId, {
          type: EmployeeCatalogType.OVERTIME_REASON,
          name: '   ',
        }),
      ).rejects.toThrow('El nombre del catálogo no puede estar vacío');
    });

    it('permite pilaCode en tipos PILA', async () => {
      repository.create.mockResolvedValue({
        ...activeReason,
        type: EmployeeCatalogType.EPS,
        name: 'Sura',
        pilaCode: 'EPS001',
      });
      await service.create(tenantId, {
        type: EmployeeCatalogType.EPS,
        name: 'Sura',
        pilaCode: ' EPS001 ',
      });
      expect(repository.create).toHaveBeenCalledWith(tenantId, {
        type: EmployeeCatalogType.EPS,
        name: 'Sura',
        pilaCode: 'EPS001',
      });
    });

    it('update NotFound si updateMany no afecta filas', async () => {
      repository.findById.mockResolvedValue(activeReason);
      repository.update.mockResolvedValue(null);
      await expect(service.update(tenantId, activeReason.id, { name: 'Otro' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('update mapea P2002 a ConflictException', async () => {
      repository.findById.mockResolvedValue(activeReason);
      repository.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      await expect(service.update(tenantId, activeReason.id, { name: 'Otro' })).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
