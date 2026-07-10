import {
  CostCenter,
  EmployeeContractType,
  LaborClassification,
  SalaryType,
  ArlRiskLevel,
} from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import type { EmployeeHistoryRepository } from '../repository/employee-history.repository';
import { PayrollRepository } from '../repository/payroll.repository';

const photoInclude = {
  select: { id: true, key: true, visibility: true, status: true, deletedAt: true },
} as const;

const socialProfileInclude = { where: { deletedAt: null } } as const;

const employeeInclude = {
  user: true,
  location: { select: { id: true, name: true } },
  photoStorageObject: photoInclude,
  socialProfiles: socialProfileInclude,
} as const;

describe('PayrollRepository', (): void => {
  const userCreate = jest.fn();
  const userUpdate = jest.fn();
  const employeeDetailsCreate = jest.fn();
  // Nombradas aparte (en vez de acceder vía prisma.employeeDetails.findMany, etc.) para
  // que su tipo estático sea `jest.Mock` y no el método real de Prisma — evita
  // @typescript-eslint/unbound-method al referenciarlas en expect(...).
  const employeeDetailsFindMany = jest.fn();
  const employeeDetailsFindUnique = jest.fn();
  const employeeDetailsCount = jest.fn();
  const employeeDetailsUpdateMock = jest.fn();
  const userFindFirst = jest.fn();
  const locationFindUnique = jest.fn();
  const roleFindUnique = jest.fn();

  const prisma = {
    $transaction: jest.fn(),
    employeeDetails: {
      findMany: employeeDetailsFindMany,
      findUnique: employeeDetailsFindUnique,
      update: employeeDetailsUpdateMock,
      count: employeeDetailsCount,
    },
    user: {
      findFirst: userFindFirst,
      create: userCreate,
    },
    location: {
      findUnique: locationFindUnique,
    },
    role: {
      findUnique: roleFindUnique,
    },
  } as unknown as PrismaService;

  const syncSalaryHistoryTx = jest.fn();
  const syncFundHistoryTx = jest.fn();
  const employeeHistoryRepository = {
    syncSalaryHistoryTx,
    syncFundHistoryTx,
  } as unknown as EmployeeHistoryRepository;

  const repository = new PayrollRepository(prisma, employeeHistoryRepository);

  const baseCreateData = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    roleId: 'role-1',
    email: 'employee@example.com',
    cedula: '123456',
    documentType: 'CC' as const,
    locationId: 'loc-1',
    name: 'Test User',
    position: 'Operator',
    area: 'Production',
    department: 'Plant',
    contractType: EmployeeContractType.INDEFINIDO,
    hireDate: new Date('2026-01-01'),
    contractStart: new Date('2026-01-01'),
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: 2500000,
    epsName: 'EPS',
    pensionFundName: 'Pension',
    cesantiasFundName: 'Cesantias',
    arlName: 'ARL',
    arlRiskLevel: ArlRiskLevel.RIESGO_I,
    cajaCompensacion: 'Caja',
    costCenter: CostCenter.OPERACIONES,
    laborClassification: LaborClassification.ADMINISTRATIVO,
  };

  beforeEach((): void => {
    jest.clearAllMocks();

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: unknown): Promise<unknown> => {
        const tx = {
          user: { update: userUpdate, create: userCreate },
          employeeDetails: { create: employeeDetailsCreate },
        };

        return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
      },
    );
  });

  it('creates user and employee atomically when userId is omitted', async (): Promise<void> => {
    userCreate.mockResolvedValue({ id: 'user-new' });
    employeeDetailsCreate.mockResolvedValue({
      id: 'emp-new',
      userId: 'user-new',
      user: { id: 'user-new' },
    });

    await repository.create({
      ...baseCreateData,
      userId: undefined,
      passwordHash: 'hashed-password',
      contractEnd: null,
      hasTransportSubsidy: true,
    });

    expect(userCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        email: 'employee@example.com',
        cedula: '123456',
        roleId: 'role-1',
        passwordHash: 'hashed-password',
      }),
    });
    expect(userUpdate).not.toHaveBeenCalled();
    expect(employeeDetailsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-new' }),
      }),
    );
  });

  it('links an existing user and creates employee with null contractEnd when omitted', async (): Promise<void> => {
    employeeDetailsCreate.mockResolvedValue({
      id: 'emp-1',
      userId: 'user-1',
      user: { id: 'user-1' },
    });

    await repository.create({
      ...baseCreateData,
      contractEnd: null,
      hasTransportSubsidy: true,
    });

    expect(userCreate).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
    expect(employeeDetailsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          contractEnd: null,
        }),
        include: { user: true, socialProfiles: socialProfileInclude },
      }),
    );
  });

  it('creates employee with a Date contractEnd when provided', async (): Promise<void> => {
    userUpdate.mockResolvedValue({ id: 'user-2' });
    employeeDetailsCreate.mockResolvedValue({
      id: 'emp-2',
      userId: 'user-2',
      user: { id: 'user-2' },
    });

    await repository.create({
      ...baseCreateData,
      userId: 'user-2',
      contractType: EmployeeContractType.FIJO,
      contractEnd: new Date('2026-12-31'),
      hasTransportSubsidy: false,
      arlRiskLevel: ArlRiskLevel.RIESGO_II,
      salaryAmount: 3200000,
      position: 'Supervisor',
    });

    const calls = employeeDetailsCreate.mock.calls as { data: { contractEnd: unknown } }[][];
    expect(calls[0][0].data.contractEnd).toBeInstanceOf(Date);
  });

  it('seeds salary and fund history in the same transaction on create, using contractStart as effectiveFrom', async (): Promise<void> => {
    const contractStart = new Date('2026-03-01');
    employeeDetailsCreate.mockResolvedValue({
      id: 'emp-3',
      userId: 'user-1',
      user: { id: 'user-1' },
      tenantId: 'tenant-1',
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: 2500000,
      cesantiasFundName: 'Cesantias',
      pensionFundName: 'Pension',
      contractStart,
      hireDate: contractStart,
    });

    await repository.create({
      ...baseCreateData,
      contractEnd: null,
      hasTransportSubsidy: true,
      changedBy: 'user-9',
    });

    expect(syncSalaryHistoryTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-3',
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: 2500000,
        effectiveFrom: contractStart,
        changedBy: 'user-9',
      }),
    );
    expect(syncFundHistoryTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fundType: 'CESANTIAS_FUND',
        fundName: 'Cesantias',
        effectiveFrom: contractStart,
      }),
    );
    expect(syncFundHistoryTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fundType: 'PENSION_FUND',
        fundName: 'Pension',
        effectiveFrom: contractStart,
      }),
    );
  });

  it('propagates a history-sync failure out of create() instead of swallowing it (garantía de rollback)', async (): Promise<void> => {
    employeeDetailsCreate.mockResolvedValue({
      id: 'emp-4',
      userId: 'user-1',
      user: { id: 'user-1' },
      tenantId: 'tenant-1',
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: 2500000,
      cesantiasFundName: 'Cesantias',
      pensionFundName: 'Pension',
    });
    const dbError = new Error('CHECK constraint violated');
    syncSalaryHistoryTx.mockRejectedValueOnce(dbError);

    await expect(
      repository.create({
        ...baseCreateData,
        contractEnd: null,
        hasTransportSubsidy: true,
      }),
    ).rejects.toThrow(dbError);
  });

  it('findAll applies default active filters and pagination defaults', async (): Promise<void> => {
    employeeDetailsFindMany.mockResolvedValue([]);

    await repository.findAll({ tenantId: 'tenant-1' });

    expect(employeeDetailsFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        isActive: true,
        deletedAt: null,
      },
      include: employeeInclude,
      take: 50,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findAll applies location, contractType and includeInactive with explicit isActive', async (): Promise<void> => {
    employeeDetailsFindMany.mockResolvedValue([]);

    await repository.findAll({
      tenantId: 'tenant-1',
      locationId: 'loc-1',
      contractType: EmployeeContractType.FIJO,
      includeInactive: true,
      isActive: false,
      limit: 20,
      offset: 10,
    });

    expect(employeeDetailsFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        contractType: EmployeeContractType.FIJO,
        isActive: false,
      },
      include: employeeInclude,
      take: 20,
      skip: 10,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findAll with includeInactive true and no isActive omits active/deleted filters', async (): Promise<void> => {
    employeeDetailsFindMany.mockResolvedValue([]);

    await repository.findAll({ tenantId: 'tenant-1', includeInactive: true });

    expect(employeeDetailsFindMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
      },
      include: employeeInclude,
      take: 50,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findById and findByUserId include user relation', async (): Promise<void> => {
    employeeDetailsFindUnique.mockResolvedValue(null);

    await repository.findById('emp-1');
    await repository.findByUserId('user-1');

    expect(employeeDetailsFindUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'emp-1' },
      include: employeeInclude,
    });
    expect(employeeDetailsFindUnique).toHaveBeenNthCalledWith(2, {
      where: { userId: 'user-1' },
      include: {
        user: true,
        photoStorageObject: photoInclude,
        socialProfiles: socialProfileInclude,
      },
    });
  });

  it('update applies user changes only when employee patch is empty', async (): Promise<void> => {
    const userUpdate = jest.fn();
    const findUniqueOrThrow = jest.fn().mockResolvedValue({
      userId: 'user-1',
      user: { id: 'user-1' },
      location: { id: 'loc-1', name: 'Sede 1' },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: unknown): Promise<unknown> => {
        const tx = {
          user: { update: userUpdate },
          employeeDetails: {
            update: jest.fn(),
            findUniqueOrThrow,
          },
        };

        return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
      },
    );

    await repository.update('user-1', {
      employee: {},
      user: { roleId: 'role-1' },
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { roleId: 'role-1' },
    });
    expect(findUniqueOrThrow).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: {
        user: true,
        location: { select: { id: true, name: true } },
        photoStorageObject: photoInclude,
        socialProfiles: socialProfileInclude,
      },
    });
  });

  it('update and softDelete call employeeDetails.update with expected data', async (): Promise<void> => {
    const employeeDetailsUpdate = jest.fn().mockResolvedValue({
      userId: 'user-1',
      user: { id: 'user-1' },
      location: { id: 'loc-1', name: 'Sede 1' },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: unknown): Promise<unknown> => {
        const tx = {
          user: { update: jest.fn() },
          employeeDetails: {
            update: employeeDetailsUpdate,
            findUniqueOrThrow: jest.fn(),
          },
        };

        return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
      },
    );

    await repository.update('user-1', { employee: { position: 'Lead' } });
    await repository.softDelete('user-1');

    expect(employeeDetailsUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { position: 'Lead' },
      include: {
        user: true,
        location: { select: { id: true, name: true } },
        photoStorageObject: photoInclude,
        socialProfiles: socialProfileInclude,
      },
    });

    expect(employeeDetailsUpdateMock).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        isActive: false,
        deletedAt: expect.any(Date),
      },
    });
  });

  it('update syncs salary and fund history in the same transaction when those fields change', async (): Promise<void> => {
    const updatedRow = {
      id: 'emp-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      user: { id: 'user-1' },
      location: { id: 'loc-1', name: 'Sede 1' },
      salaryType: SalaryType.INTEGRAL,
      salaryAmount: 5000000,
      cesantiasFundName: 'Protección',
      pensionFundName: 'Colpensiones',
    };
    const employeeDetailsUpdate = jest.fn().mockResolvedValue(updatedRow);

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: unknown): Promise<unknown> => {
        const tx = {
          user: { update: jest.fn() },
          employeeDetails: { update: employeeDetailsUpdate, findUniqueOrThrow: jest.fn() },
        };
        return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
      },
    );

    await repository.update('user-1', {
      employee: {
        salaryType: SalaryType.INTEGRAL,
        salaryAmount: 5000000,
        cesantiasFundName: 'Protección',
      },
      changedBy: 'user-9',
    });

    expect(syncSalaryHistoryTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
        salaryType: SalaryType.INTEGRAL,
        salaryAmount: 5000000,
        changedBy: 'user-9',
      }),
    );
    expect(syncFundHistoryTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
        fundType: 'CESANTIAS_FUND',
        fundName: 'Protección',
        changedBy: 'user-9',
      }),
    );
    // pensionFundName no vino en el patch: no debe sincronizarse.
    expect(syncFundHistoryTx).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ fundType: 'PENSION_FUND' }),
    );
  });

  it('update does not touch salary/fund history when unrelated fields change', async (): Promise<void> => {
    const employeeDetailsUpdate = jest.fn().mockResolvedValue({
      id: 'emp-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      user: { id: 'user-1' },
      location: { id: 'loc-1', name: 'Sede 1' },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(
      async (callback: unknown): Promise<unknown> => {
        const tx = {
          user: { update: jest.fn() },
          employeeDetails: { update: employeeDetailsUpdate, findUniqueOrThrow: jest.fn() },
        };
        return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
      },
    );

    await repository.update('user-1', { employee: { area: 'Cocina' } });

    expect(syncSalaryHistoryTx).not.toHaveBeenCalled();
    expect(syncFundHistoryTx).not.toHaveBeenCalled();
  });

  it('count applies active filters by default', async (): Promise<void> => {
    employeeDetailsCount.mockResolvedValue(3);

    await repository.count({ tenantId: 'tenant-1' });

    expect(employeeDetailsCount).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        isActive: true,
        deletedAt: null,
      },
    });
  });

  it('count applies optional filters when provided and includeInactive true', async (): Promise<void> => {
    employeeDetailsCount.mockResolvedValue(1);

    await repository.count({
      tenantId: 'tenant-1',
      locationId: 'loc-1',
      contractType: EmployeeContractType.OBRA,
      includeInactive: true,
    });

    expect(employeeDetailsCount).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        contractType: EmployeeContractType.OBRA,
      },
    });
  });

  it('delegates lookup helpers to prisma with expected query shape', async (): Promise<void> => {
    userFindFirst
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({ id: 'user-1', email: 'employee@example.com', cedula: '123456' });
    locationFindUnique.mockResolvedValue({
      id: 'loc-1',
      tenantId: 'tenant-1',
    });
    roleFindUnique.mockResolvedValue({
      id: 'role-1',
      tenantId: 'tenant-1',
    });

    await repository.findExistingUser('tenant-1', 'employee@example.com', '123456');
    await repository.findUserByEmailAndCedula('tenant-1', 'employee@example.com', '123456');
    await repository.findLocationById('loc-1');
    await repository.findRoleById('role-1');

    expect(userFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: 'tenant-1',
        OR: [{ email: 'employee@example.com' }, { cedula: '123456' }],
      },
      select: { id: true },
    });

    expect(userFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: 'tenant-1',
        email: 'employee@example.com',
        cedula: '123456',
        deletedAt: null,
      },
      select: { id: true, email: true, cedula: true },
    });

    expect(locationFindUnique).toHaveBeenCalledWith({
      where: { id: 'loc-1' },
      select: { id: true, tenantId: true },
    });

    expect(roleFindUnique).toHaveBeenCalledWith({
      where: { id: 'role-1' },
      select: { id: true, tenantId: true },
    });
  });
});
