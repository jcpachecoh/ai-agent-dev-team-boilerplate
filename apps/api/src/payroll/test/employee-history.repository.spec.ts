import { EmployeeCatalogType, Prisma, SalaryType } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import { EmployeeHistoryRepository } from '../repository/employee-history.repository';

describe('EmployeeHistoryRepository', (): void => {
  let repository: EmployeeHistoryRepository;
  let salaryFindFirst: jest.Mock;
  let salaryFindMany: jest.Mock;
  let salaryUpdate: jest.Mock;
  let salaryCreate: jest.Mock;
  let fundFindFirst: jest.Mock;
  let fundFindMany: jest.Mock;
  let fundUpdate: jest.Mock;
  let fundCreate: jest.Mock;
  let tx: {
    employeeSalaryHistory: {
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
    employeeFundHistory: {
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };

  const tenantId = 'tenant-1';
  const otherTenantId = 'tenant-2';
  const employeeDetailsId = 'emp-1';

  beforeEach((): void => {
    salaryFindFirst = jest.fn().mockResolvedValue(null);
    salaryFindMany = jest.fn().mockResolvedValue([]);
    salaryUpdate = jest.fn();
    salaryCreate = jest.fn();
    fundFindFirst = jest.fn().mockResolvedValue(null);
    fundFindMany = jest.fn().mockResolvedValue([]);
    fundUpdate = jest.fn();
    fundCreate = jest.fn();

    tx = {
      employeeSalaryHistory: {
        findFirst: salaryFindFirst,
        update: salaryUpdate,
        create: salaryCreate,
      },
      employeeFundHistory: { findFirst: fundFindFirst, update: fundUpdate, create: fundCreate },
    };

    const prisma = {
      employeeSalaryHistory: { findMany: salaryFindMany },
      employeeFundHistory: { findMany: fundFindMany },
    } as unknown as PrismaService;

    repository = new EmployeeHistoryRepository(prisma);
  });

  describe('syncSalaryHistoryTx', (): void => {
    it('creates the first history entry when none is open (creación)', async (): Promise<void> => {
      const effectiveFrom = new Date('2026-01-01');

      await repository.syncSalaryHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: 2500000,
        effectiveFrom,
        changedBy: 'user-1',
      });

      expect(salaryFindFirst).toHaveBeenCalledWith({
        where: { tenantId, employeeDetailsId, effectiveTo: null },
      });
      expect(salaryUpdate).not.toHaveBeenCalled();
      expect(salaryCreate).toHaveBeenCalledWith({
        data: {
          tenantId,
          employeeDetailsId,
          salaryType: SalaryType.ORDINARIO,
          salaryAmount: new Prisma.Decimal(2500000),
          effectiveFrom,
          changedBy: 'user-1',
        },
      });
    });

    it('closes the previous open entry and creates a new one when the amount changes (cambio de salario)', async (): Promise<void> => {
      const previousEntry = {
        id: 'hist-1',
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2500000),
      };
      salaryFindFirst.mockResolvedValue(previousEntry);
      const effectiveFrom = new Date('2026-06-01');

      await repository.syncSalaryHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: 3000000,
        effectiveFrom,
      });

      // Cierre automático de la vigencia anterior (effectiveTo = fecha del cambio).
      expect(salaryUpdate).toHaveBeenCalledWith({
        where: { id: 'hist-1' },
        data: { effectiveTo: effectiveFrom },
      });
      expect(salaryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ salaryAmount: new Prisma.Decimal(3000000) }),
      });
    });

    it('closes the previous entry when only salaryType changes, keeping the same amount', async (): Promise<void> => {
      salaryFindFirst.mockResolvedValue({
        id: 'hist-1',
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2500000),
      });

      await repository.syncSalaryHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        salaryType: SalaryType.INTEGRAL,
        salaryAmount: 2500000,
        effectiveFrom: new Date('2026-06-01'),
      });

      expect(salaryUpdate).toHaveBeenCalled();
      expect(salaryCreate).toHaveBeenCalled();
    });

    it('does not write anything when the value did not change (prevención de traslapes / no-op)', async (): Promise<void> => {
      salaryFindFirst.mockResolvedValue({
        id: 'hist-1',
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2500000),
      });

      await repository.syncSalaryHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: 2500000,
        effectiveFrom: new Date('2026-06-01'),
      });

      expect(salaryUpdate).not.toHaveBeenCalled();
      expect(salaryCreate).not.toHaveBeenCalled();
    });

    it('scopes the open-entry lookup by tenantId (aislamiento por tenant)', async (): Promise<void> => {
      await repository.syncSalaryHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId: otherTenantId,
        employeeDetailsId,
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: 1000000,
        effectiveFrom: new Date('2026-01-01'),
      });

      expect(salaryFindFirst).toHaveBeenCalledWith({
        where: { tenantId: otherTenantId, employeeDetailsId, effectiveTo: null },
      });
    });

    it('propagates a write failure instead of swallowing it (garantía de rollback transaccional)', async (): Promise<void> => {
      salaryFindFirst.mockResolvedValue({
        id: 'hist-1',
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2500000),
      });
      const dbError = new Error('CHECK constraint violated');
      salaryCreate.mockRejectedValue(dbError);

      await expect(
        repository.syncSalaryHistoryTx(tx as unknown as Prisma.TransactionClient, {
          tenantId,
          employeeDetailsId,
          salaryType: SalaryType.ORDINARIO,
          salaryAmount: 3000000,
          effectiveFrom: new Date('2026-06-01'),
        }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('syncFundHistoryTx', (): void => {
    it('creates the first fund history entry when none is open (creación)', async (): Promise<void> => {
      const effectiveFrom = new Date('2026-01-01');

      await repository.syncFundHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        fundType: EmployeeCatalogType.CESANTIAS_FUND,
        fundName: 'Porvenir',
        effectiveFrom,
      });

      expect(fundFindFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          employeeDetailsId,
          fundType: EmployeeCatalogType.CESANTIAS_FUND,
          effectiveTo: null,
        },
      });
      expect(fundUpdate).not.toHaveBeenCalled();
      expect(fundCreate).toHaveBeenCalledWith({
        data: {
          tenantId,
          employeeDetailsId,
          fundType: EmployeeCatalogType.CESANTIAS_FUND,
          fundName: 'Porvenir',
          effectiveFrom,
          changedBy: null,
        },
      });
    });

    it('closes the previous entry and opens a new one on cesantías fund change (cambio de fondo de cesantías)', async (): Promise<void> => {
      fundFindFirst.mockResolvedValue({ id: 'fund-hist-1', fundName: 'Porvenir' });
      const effectiveFrom = new Date('2026-06-01');

      await repository.syncFundHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        fundType: EmployeeCatalogType.CESANTIAS_FUND,
        fundName: 'Protección',
        effectiveFrom,
        changedBy: 'user-2',
      });

      expect(fundUpdate).toHaveBeenCalledWith({
        where: { id: 'fund-hist-1' },
        data: { effectiveTo: effectiveFrom },
      });
      expect(fundCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ fundName: 'Protección', changedBy: 'user-2' }),
      });
    });

    it('closes the previous entry and opens a new one on pension fund change (cambio de fondo de pensión)', async (): Promise<void> => {
      fundFindFirst.mockResolvedValue({ id: 'fund-hist-2', fundName: 'Colpensiones' });
      const effectiveFrom = new Date('2026-06-01');

      await repository.syncFundHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        fundType: EmployeeCatalogType.PENSION_FUND,
        fundName: 'Protección',
        effectiveFrom,
      });

      expect(fundFindFirst).toHaveBeenCalledWith({
        where: {
          tenantId,
          employeeDetailsId,
          fundType: EmployeeCatalogType.PENSION_FUND,
          effectiveTo: null,
        },
      });
      expect(fundUpdate).toHaveBeenCalledWith({
        where: { id: 'fund-hist-2' },
        data: { effectiveTo: effectiveFrom },
      });
      expect(fundCreate).toHaveBeenCalled();
    });

    it('does not write anything when the fund did not change (prevención de traslapes / no-op)', async (): Promise<void> => {
      fundFindFirst.mockResolvedValue({ id: 'fund-hist-1', fundName: 'Porvenir' });

      await repository.syncFundHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        fundType: EmployeeCatalogType.CESANTIAS_FUND,
        fundName: 'Porvenir',
        effectiveFrom: new Date('2026-06-01'),
      });

      expect(fundUpdate).not.toHaveBeenCalled();
      expect(fundCreate).not.toHaveBeenCalled();
    });

    it('keeps cesantías and pensión fund timelines independent (mismo empleado, distinto fundType)', async (): Promise<void> => {
      await repository.syncFundHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        fundType: EmployeeCatalogType.CESANTIAS_FUND,
        fundName: 'Porvenir',
        effectiveFrom: new Date('2026-01-01'),
      });
      await repository.syncFundHistoryTx(tx as unknown as Prisma.TransactionClient, {
        tenantId,
        employeeDetailsId,
        fundType: EmployeeCatalogType.PENSION_FUND,
        fundName: 'Colpensiones',
        effectiveFrom: new Date('2026-01-01'),
      });

      expect(fundFindFirst).toHaveBeenNthCalledWith(1, {
        where: {
          tenantId,
          employeeDetailsId,
          fundType: EmployeeCatalogType.CESANTIAS_FUND,
          effectiveTo: null,
        },
      });
      expect(fundFindFirst).toHaveBeenNthCalledWith(2, {
        where: {
          tenantId,
          employeeDetailsId,
          fundType: EmployeeCatalogType.PENSION_FUND,
          effectiveTo: null,
        },
      });
      expect(fundCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('findSalaryHistoryByEmployee', (): void => {
    it('scopes by tenantId and employeeDetailsId, ordered by effectiveFrom desc', async (): Promise<void> => {
      await repository.findSalaryHistoryByEmployee(tenantId, employeeDetailsId);

      expect(salaryFindMany).toHaveBeenCalledWith({
        where: { tenantId, employeeDetailsId },
        orderBy: { effectiveFrom: 'desc' },
      });
    });

    it('maps rows to plain records with salaryAmount serialized as a string', async (): Promise<void> => {
      const effectiveFrom = new Date('2026-01-01');
      const createdAt = new Date('2026-01-01T10:00:00Z');
      salaryFindMany.mockResolvedValue([
        {
          id: 'hist-1',
          tenantId,
          employeeDetailsId,
          salaryType: SalaryType.ORDINARIO,
          salaryAmount: new Prisma.Decimal(2500000),
          effectiveFrom,
          effectiveTo: null,
          changedBy: 'user-1',
          createdAt,
        },
      ]);

      const result = await repository.findSalaryHistoryByEmployee(tenantId, employeeDetailsId);

      expect(result).toEqual([
        {
          id: 'hist-1',
          tenantId,
          employeeDetailsId,
          salaryType: SalaryType.ORDINARIO,
          salaryAmount: '2500000',
          effectiveFrom,
          effectiveTo: null,
          changedBy: 'user-1',
          createdAt,
        },
      ]);
    });
  });

  describe('findFundHistoryByEmployee', (): void => {
    it('scopes by tenantId and employeeDetailsId without fundType filter when omitted', async (): Promise<void> => {
      await repository.findFundHistoryByEmployee(tenantId, employeeDetailsId);

      expect(fundFindMany).toHaveBeenCalledWith({
        where: { tenantId, employeeDetailsId },
        orderBy: { effectiveFrom: 'desc' },
      });
    });

    it('maps rows to plain records', async (): Promise<void> => {
      const effectiveFrom = new Date('2026-01-01');
      const createdAt = new Date('2026-01-01T10:00:00Z');
      fundFindMany.mockResolvedValue([
        {
          id: 'fund-hist-1',
          tenantId,
          employeeDetailsId,
          fundType: EmployeeCatalogType.CESANTIAS_FUND,
          fundName: 'Porvenir',
          effectiveFrom,
          effectiveTo: null,
          changedBy: null,
          createdAt,
        },
      ]);

      const result = await repository.findFundHistoryByEmployee(tenantId, employeeDetailsId);

      expect(result).toEqual([
        {
          id: 'fund-hist-1',
          tenantId,
          employeeDetailsId,
          fundType: EmployeeCatalogType.CESANTIAS_FUND,
          fundName: 'Porvenir',
          effectiveFrom,
          effectiveTo: null,
          changedBy: null,
          createdAt,
        },
      ]);
    });

    it('adds the fundType filter when provided', async (): Promise<void> => {
      await repository.findFundHistoryByEmployee(
        tenantId,
        employeeDetailsId,
        EmployeeCatalogType.PENSION_FUND,
      );

      expect(fundFindMany).toHaveBeenCalledWith({
        where: { tenantId, employeeDetailsId, fundType: EmployeeCatalogType.PENSION_FUND },
        orderBy: { effectiveFrom: 'desc' },
      });
    });
  });
});
