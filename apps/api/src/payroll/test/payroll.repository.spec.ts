import {
  CostCenter,
  EmployeeContractType,
  LaborClassification,
  SalaryType,
  ArlRiskLevel,
} from '@prisma/client';
import { PayrollRepository } from '../repository/payroll.repository';
import { PrismaService } from '../../prisma/prisma.service';

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

describe('PayrollRepository', () => {
  const userCreate = jest.fn();
  const userUpdate = jest.fn();
  const employeeDetailsCreate = jest.fn();

  const prisma = {
    $transaction: jest.fn(),
    employeeDetails: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      create: userCreate,
    },
    location: {
      findUnique: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new PayrollRepository(prisma);

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

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: unknown) => {
      const tx = {
        user: { update: userUpdate, create: userCreate },
        employeeDetails: { create: employeeDetailsCreate },
      };

      return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
    });
  });

  it('creates user and employee atomically when userId is omitted', async () => {
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

  it('links an existing user and creates employee with null contractEnd when omitted', async () => {
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

  it('creates employee with a Date contractEnd when provided', async () => {
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

    const createArg = employeeDetailsCreate.mock.calls[0][0];
    expect(createArg.data.contractEnd).toBeInstanceOf(Date);
  });

  it('findAll applies default active filters and pagination defaults', async () => {
    (prisma.employeeDetails.findMany as jest.Mock).mockResolvedValue([]);

    await repository.findAll({ tenantId: 'tenant-1' });

    expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith({
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

  it('findAll applies location, contractType and includeInactive with explicit isActive', async () => {
    (prisma.employeeDetails.findMany as jest.Mock).mockResolvedValue([]);

    await repository.findAll({
      tenantId: 'tenant-1',
      locationId: 'loc-1',
      contractType: EmployeeContractType.FIJO,
      includeInactive: true,
      isActive: false,
      limit: 20,
      offset: 10,
    });

    expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith({
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

  it('findAll with includeInactive true and no isActive omits active/deleted filters', async () => {
    (prisma.employeeDetails.findMany as jest.Mock).mockResolvedValue([]);

    await repository.findAll({ tenantId: 'tenant-1', includeInactive: true });

    expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
      },
      include: employeeInclude,
      take: 50,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findById and findByUserId include user relation', async () => {
    (prisma.employeeDetails.findUnique as jest.Mock).mockResolvedValue(null);

    await repository.findById('emp-1');
    await repository.findByUserId('user-1');

    expect(prisma.employeeDetails.findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'emp-1' },
      include: employeeInclude,
    });
    expect(prisma.employeeDetails.findUnique).toHaveBeenNthCalledWith(2, {
      where: { userId: 'user-1' },
      include: {
        user: true,
        photoStorageObject: photoInclude,
        socialProfiles: socialProfileInclude,
      },
    });
  });

  it('update applies user changes only when employee patch is empty', async () => {
    const userUpdate = jest.fn();
    const findUniqueOrThrow = jest.fn().mockResolvedValue({
      userId: 'user-1',
      user: { id: 'user-1' },
      location: { id: 'loc-1', name: 'Sede 1' },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: unknown) => {
      const tx = {
        user: { update: userUpdate },
        employeeDetails: {
          update: jest.fn(),
          findUniqueOrThrow,
        },
      };

      return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
    });

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

  it('update and softDelete call employeeDetails.update with expected data', async () => {
    const employeeDetailsUpdate = jest.fn().mockResolvedValue({
      userId: 'user-1',
      user: { id: 'user-1' },
      location: { id: 'loc-1', name: 'Sede 1' },
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: unknown) => {
      const tx = {
        user: { update: jest.fn() },
        employeeDetails: {
          update: employeeDetailsUpdate,
          findUniqueOrThrow: jest.fn(),
        },
      };

      return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
    });

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

    expect(prisma.employeeDetails.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        isActive: false,
        deletedAt: expect.any(Date),
      },
      include: {
        user: true,
      },
    });
  });

  it('softDelete returns the deactivated employee record', async () => {
    (prisma.employeeDetails.update as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      isActive: false,
      deletedAt: new Date('2026-07-09T00:00:00.000Z'),
      user: { id: 'user-1' },
    });

    const result = await repository.softDelete('user-1');

    expect(result).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        isActive: false,
        deletedAt: expect.any(Date),
      }),
    );
  });

  it('count applies active filters by default', async () => {
    (prisma.employeeDetails.count as jest.Mock).mockResolvedValue(3);

    await repository.count({ tenantId: 'tenant-1' });

    expect(prisma.employeeDetails.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        isActive: true,
        deletedAt: null,
      },
    });
  });

  it('count applies optional filters when provided and includeInactive true', async () => {
    (prisma.employeeDetails.count as jest.Mock).mockResolvedValue(1);

    await repository.count({
      tenantId: 'tenant-1',
      locationId: 'loc-1',
      contractType: EmployeeContractType.OBRA,
      includeInactive: true,
    });

    expect(prisma.employeeDetails.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        locationId: 'loc-1',
        contractType: EmployeeContractType.OBRA,
      },
    });
  });

  it('delegates lookup helpers to prisma with expected query shape', async () => {
    (prisma.user.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 'user-1' })
      .mockResolvedValueOnce({ id: 'user-1', email: 'employee@example.com', cedula: '123456' });
    (prisma.location.findUnique as jest.Mock).mockResolvedValue({
      id: 'loc-1',
      tenantId: 'tenant-1',
    });
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({
      id: 'role-1',
      tenantId: 'tenant-1',
    });

    await repository.findExistingUser('tenant-1', 'employee@example.com', '123456');
    await repository.findUserByEmailAndCedula('tenant-1', 'employee@example.com', '123456');
    await repository.findLocationById('loc-1');
    await repository.findRoleById('role-1');

    expect(prisma.user.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: 'tenant-1',
        OR: [{ email: 'employee@example.com' }, { cedula: '123456' }],
      },
      select: { id: true },
    });

    expect(prisma.user.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: 'tenant-1',
        email: 'employee@example.com',
        cedula: '123456',
        deletedAt: null,
      },
      select: { id: true, email: true, cedula: true },
    });

    expect(prisma.location.findUnique).toHaveBeenCalledWith({
      where: { id: 'loc-1' },
      select: { id: true, tenantId: true },
    });

    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { id: 'role-1' },
      select: { id: true, tenantId: true },
    });
  });
});
