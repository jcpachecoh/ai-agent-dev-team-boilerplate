import { ConflictException } from '@nestjs/common';
import { EmployeeContractType, Prisma } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import { EmployeeContractRepository } from '../repository/employee-contract.repository';

function baseRow(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'contract-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    contractType: EmployeeContractType.INDEFINIDO,
    startDate: new Date('2024-01-01'),
    agreedEndDate: null,
    status: 'ACTIVO',
    terminationDate: null,
    terminationReason: null,
    terminationNotes: null,
    activeSlot: true,
    changedBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('EmployeeContractRepository', (): void => {
  let repository: EmployeeContractRepository;
  let findFirst: jest.Mock;
  let findMany: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let employeeDetailsUpdate: jest.Mock;
  let prisma: PrismaService;

  beforeEach((): void => {
    findFirst = jest.fn();
    findMany = jest.fn();
    create = jest.fn();
    update = jest.fn();
    employeeDetailsUpdate = jest.fn().mockResolvedValue({});

    prisma = {
      employmentContract: { findFirst, findMany, create, update },
      employeeDetails: { update: employeeDetailsUpdate },
    } as unknown as PrismaService;

    repository = new EmployeeContractRepository(prisma);
  });

  // Mismo objeto sirve de "tx" en los métodos *Tx — duck-typing, igual que el resto de
  // repositorios de este dominio (CesantiasRepository, EmployeeHistoryRepository).
  const tx = (): Prisma.TransactionClient =>
    ({
      employmentContract: { findFirst, findMany, create, update },
      employeeDetails: { update: employeeDetailsUpdate },
    }) as unknown as Prisma.TransactionClient;

  describe('createInitialContractTx', (): void => {
    it('crea el contrato inicial en estado ACTIVO con activeSlot=true', async (): Promise<void> => {
      create.mockResolvedValue(baseRow());

      await repository.createInitialContractTx(tx(), {
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
        contractType: EmployeeContractType.INDEFINIDO,
        startDate: new Date('2024-01-01'),
        agreedEndDate: null,
      });

      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: 'ACTIVO', activeSlot: true }),
      });
    });
  });

  describe('syncActiveContractTx', (): void => {
    it('no hace nada si ningún campo de contrato viene en el patch', async (): Promise<void> => {
      await repository.syncActiveContractTx(tx(), {
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
      });

      expect(findFirst).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    });

    it('actualiza el contrato ACTIVO existente (no crea uno nuevo)', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());

      await repository.syncActiveContractTx(tx(), {
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
        agreedEndDate: new Date('2026-12-31'),
      });

      expect(update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: expect.objectContaining({ agreedEndDate: new Date('2026-12-31') }),
      });
      expect(create).not.toHaveBeenCalled();
    });

    it('self-heal: crea un contrato ACTIVO si el empleado legado no tenía ninguno', async (): Promise<void> => {
      findFirst.mockResolvedValue(null);

      await repository.syncActiveContractTx(tx(), {
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-legacy',
        contractType: EmployeeContractType.FIJO,
        startDate: new Date('2024-05-01'),
      });

      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeDetailsId: 'emp-legacy',
          status: 'ACTIVO',
          activeSlot: true,
        }),
      });
    });
  });

  describe('terminateActiveContractTx', (): void => {
    it('cierra el contrato ACTIVO con fecha y causal, activeSlot=null', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());
      update.mockResolvedValue(
        baseRow({ status: 'TERMINADO', activeSlot: null, terminationReason: 'RENUNCIA' }),
      );

      const result = await repository.terminateActiveContractTx(tx(), {
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
        terminationDate: new Date('2026-07-14'),
        terminationReason: 'RENUNCIA',
      });

      expect(update).toHaveBeenCalledWith({
        where: { id: 'contract-1' },
        data: expect.objectContaining({
          status: 'TERMINADO',
          activeSlot: null,
          terminationReason: 'RENUNCIA',
        }),
      });
      expect(result.status).toBe('TERMINADO');

      // OS-591 (fase 3) — isActive es consecuencia del estado del contrato (§15.4).
      expect(employeeDetailsUpdate).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { isActive: false, deletedAt: expect.any(Date) },
      });
    });

    it('lanza ConflictException si el empleado no tiene contrato ACTIVO para terminar', async (): Promise<void> => {
      findFirst.mockResolvedValue(null);

      await expect(
        repository.terminateActiveContractTx(tx(), {
          tenantId: 'tenant-1',
          employeeDetailsId: 'emp-1',
          terminationDate: new Date('2026-07-14'),
          terminationReason: 'RENUNCIA',
        }),
      ).rejects.toThrow(ConflictException);
      expect(update).not.toHaveBeenCalled();
      expect(employeeDetailsUpdate).not.toHaveBeenCalled();
    });
  });

  describe('startNewContractTx', (): void => {
    it('crea un nuevo contrato ACTIVO cuando no hay ninguno vigente (recontratación)', async (): Promise<void> => {
      findFirst.mockResolvedValue(null);
      create.mockResolvedValue(baseRow({ id: 'contract-2' }));

      const result = await repository.startNewContractTx(tx(), {
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
        contractType: EmployeeContractType.OBRA,
        startDate: new Date('2026-06-16'),
      });

      expect(create).toHaveBeenCalled();
      expect(result.id).toBe('contract-2');

      // OS-591 (fase 3) — contraparte de terminateActiveContractTx: recontratar reactiva.
      expect(employeeDetailsUpdate).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: { isActive: true, deletedAt: null },
      });
    });

    it('lanza ConflictException si ya existe un contrato ACTIVO — no permite dos activos simultáneos', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());

      await expect(
        repository.startNewContractTx(tx(), {
          tenantId: 'tenant-1',
          employeeDetailsId: 'emp-1',
          contractType: EmployeeContractType.OBRA,
          startDate: new Date('2026-06-16'),
        }),
      ).rejects.toThrow(ConflictException);
      expect(create).not.toHaveBeenCalled();
      expect(employeeDetailsUpdate).not.toHaveBeenCalled();
    });

    it('traduce una violación del índice único (P2002) en ConflictException (defensa en profundidad)', async (): Promise<void> => {
      findFirst.mockResolvedValue(null);
      create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique constraint', {
          code: 'P2002',
          clientVersion: '5.22.0',
        }),
      );

      await expect(
        repository.startNewContractTx(tx(), {
          tenantId: 'tenant-1',
          employeeDetailsId: 'emp-1',
          contractType: EmployeeContractType.OBRA,
          startDate: new Date('2026-06-16'),
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findActiveContract', (): void => {
    it('consulta el contrato en estado ACTIVO del empleado', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());

      const result = await repository.findActiveContract('tenant-1', 'emp-1');

      expect(findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', employeeDetailsId: 'emp-1', status: 'ACTIVO' },
      });
      expect(result?.status).toBe('ACTIVO');
    });

    it('devuelve null si no hay contrato ACTIVO', async (): Promise<void> => {
      findFirst.mockResolvedValue(null);

      const result = await repository.findActiveContract('tenant-1', 'emp-1');

      expect(result).toBeNull();
    });
  });

  describe('findAllByEmployee', (): void => {
    it('trae todos los contratos del empleado ordenados por fecha de inicio', async (): Promise<void> => {
      findMany.mockResolvedValue([baseRow(), baseRow({ id: 'contract-2' })]);

      const result = await repository.findAllByEmployee('tenant-1', 'emp-1');

      expect(findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', employeeDetailsId: 'emp-1' },
        orderBy: { startDate: 'asc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findById', (): void => {
    it('consulta por tenant+id', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());

      await repository.findById('tenant-1', 'contract-1');

      expect(findFirst).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1', id: 'contract-1' } });
    });
  });

  describe('findContractAt', (): void => {
    it('consulta el contrato vigente (ACTIVO o TERMINADO cuya ventana cubra la fecha)', async (): Promise<void> => {
      findFirst.mockResolvedValue(baseRow());

      await repository.findContractAt('tenant-1', 'emp-1', new Date('2025-01-01'));

      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            employeeDetailsId: 'emp-1',
            startDate: { lte: new Date('2025-01-01') },
          }),
        }),
      );
    });
  });

  describe('findContractsAsOfForTenant (OS-599)', (): void => {
    it('deduplica por empleado quedándose con el startDate más reciente', async (): Promise<void> => {
      const asOf = new Date('2026-06-30T23:59:59.999Z');
      const older = {
        ...baseRow(),
        id: 'c-old',
        employeeDetailsId: 'emp-1',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
      };
      const newer = {
        ...baseRow(),
        id: 'c-new',
        employeeDetailsId: 'emp-1',
        startDate: new Date('2025-06-01T00:00:00.000Z'),
      };
      const other = {
        ...baseRow(),
        id: 'c-2',
        employeeDetailsId: 'emp-2',
        startDate: new Date('2025-01-01T00:00:00.000Z'),
      };
      // Repo ordena desc; simulamos el orden que Prisma devolvería.
      findMany.mockResolvedValue([newer, older, other]);

      const result = await repository.findContractsAsOfForTenant('tenant-1', asOf);

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            startDate: { lte: asOf },
          }),
          orderBy: { startDate: 'desc' },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id).sort()).toEqual(['c-2', 'c-new']);
    });
  });
});
