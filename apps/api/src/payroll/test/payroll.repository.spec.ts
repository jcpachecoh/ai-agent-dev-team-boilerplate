import { EmployeeContractType, SalaryType, ArlRiskLevel, DocumentType } from '@prisma/client';
import { PayrollRepository } from '../repository/payroll.repository';
import { PrismaService } from '../../prisma/prisma.service';

const employeeInclude = {
  user: true,
  location: { select: { id: true, name: true } },
} as const;

describe('PayrollRepository', () => {
  const userCreate = jest.fn();
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
    },
    location: {
      findUnique: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new PayrollRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: unknown) => {
      const tx = {
        user: { create: userCreate },
        employeeDetails: { create: employeeDetailsCreate },
      };

      return (callback as (arg: typeof tx) => Promise<unknown>)(tx);
    });
  });

  it('creates employee with null contractEnd when omitted', async () => {
    userCreate.mockResolvedValue({ id: 'user-1' });
    employeeDetailsCreate.mockResolvedValue({
      id: 'emp-1',
      userId: 'user-1',
      user: { id: 'user-1' },
    });

    await repository.create({
      tenantId: 'tenant-1',
      cedula: '123456',
      documentType: DocumentType.CC,
      email: 'employee@example.com',
      passwordHash: 'hash',
      roleId: 'role-1',
      locationId: 'loc-1',
      name: 'Test User',
      position: 'Operator',
      area: 'Production',
      department: 'Plant',
      contractType: EmployeeContractType.INDEFINIDO,
      hireDate: new Date('2026-01-01'),
      contractStart: new Date('2026-01-01'),
      contractEnd: null,
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: 2500000,
      hasTransportSubsidy: true,
      epsName: 'EPS',
      pensionFundName: 'Pension',
      cesantiasFundName: 'Cesantias',
      arlName: 'ARL',
      arlRiskLevel: ArlRiskLevel.RIESGO_I,
      cajaCompensacion: 'Caja',
    });

    expect(userCreate).toHaveBeenCalledTimes(1);
    expect(employeeDetailsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          contractEnd: null,
        }),
        include: { user: true },
      }),
    );
  });

  it('creates employee with a Date contractEnd when provided', async () => {
    userCreate.mockResolvedValue({ id: 'user-2' });
    employeeDetailsCreate.mockResolvedValue({
      id: 'emp-2',
      userId: 'user-2',
      user: { id: 'user-2' },
    });

    await repository.create({
      tenantId: 'tenant-1',
      cedula: '654321',
      documentType: DocumentType.CC,
      email: 'employee2@example.com',
      passwordHash: 'hash',
      roleId: 'role-1',
      locationId: 'loc-1',
      name: 'Test User 2',
      position: 'Supervisor',
      area: 'Production',
      department: 'Plant',
      contractType: EmployeeContractType.FIJO,
      hireDate: new Date('2026-01-01'),
      contractStart: new Date('2026-01-01'),
      contractEnd: new Date('2026-12-31'),
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: 3200000,
      hasTransportSubsidy: false,
      epsName: 'EPS',
      pensionFundName: 'Pension',
      cesantiasFundName: 'Cesantias',
      arlName: 'ARL',
      arlRiskLevel: ArlRiskLevel.RIESGO_II,
      cajaCompensacion: 'Caja',
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
      include: { user: true },
    });
  });

  it('update and softDelete call employeeDetails.update with expected data', async () => {
    (prisma.employeeDetails.update as jest.Mock).mockResolvedValue({});

    await repository.update('user-1', { position: 'Lead' });
    await repository.softDelete('user-1');

    expect(prisma.employeeDetails.update).toHaveBeenNthCalledWith(1, {
      where: { userId: 'user-1' },
      data: { position: 'Lead' },
    });

    expect(prisma.employeeDetails.update).toHaveBeenNthCalledWith(2, {
      where: { userId: 'user-1' },
      data: {
        isActive: false,
        deletedAt: expect.any(Date),
      },
    });
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
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (prisma.location.findUnique as jest.Mock).mockResolvedValue({
      id: 'loc-1',
      tenantId: 'tenant-1',
    });
    (prisma.role.findUnique as jest.Mock).mockResolvedValue({
      id: 'role-1',
      tenantId: 'tenant-1',
    });

    await repository.findExistingUser('tenant-1', 'employee@example.com', '123456');
    await repository.findLocationById('loc-1');
    await repository.findRoleById('role-1');

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        OR: [{ email: 'employee@example.com' }, { cedula: '123456' }],
      },
      select: { id: true },
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
