import { PrismaService } from '../../prisma/prisma.service';
import { EmployeePersonalDataRepository } from '../repository/employee-personal-data.repository';

describe('EmployeePersonalDataRepository', () => {
  const prisma = {
    employeeDetails: {
      findFirst: jest.fn(),
    },
    employeePersonalData: {
      upsert: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new EmployeePersonalDataRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findEmployeeByUserId incluye usuario, datos personales y foto', async () => {
    const employee = { id: 'emp-1', userId: 'user-1' };
    (prisma.employeeDetails.findFirst as jest.Mock).mockResolvedValue(employee);

    const result = await repository.findEmployeeByUserId('user-1', 'tenant-1');

    expect(prisma.employeeDetails.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', tenantId: 'tenant-1', deletedAt: null },
      include: {
        user: true,
        personalData: true,
        photoStorageObject: {
          select: { id: true, key: true, visibility: true, status: true, deletedAt: true },
        },
      },
    });
    expect(result).toBe(employee);
  });

  it('upsertPersonalData crea o actualiza el registro', async () => {
    const personalData = { id: 'pd-1', telefono: '3001112233' };
    (prisma.employeePersonalData.upsert as jest.Mock).mockResolvedValue(personalData);

    const result = await repository.upsertPersonalData('tenant-1', 'emp-1', {
      telefono: '3001112233',
    });

    expect(prisma.employeePersonalData.upsert).toHaveBeenCalledWith({
      where: { employeeDetailsId: 'emp-1' },
      create: {
        tenantId: 'tenant-1',
        employeeDetailsId: 'emp-1',
        telefono: '3001112233',
      },
      update: { telefono: '3001112233' },
    });
    expect(result).toBe(personalData);
  });

  it('updateUserIdentity actualiza documento y correo', async () => {
    const user = { id: 'user-1', email: 'nuevo@test.com' };
    (prisma.user.update as jest.Mock).mockResolvedValue(user);

    const result = await repository.updateUserIdentity('tenant-1', 'user-1', {
      cedula: '123',
      documentType: 'CC',
      email: 'nuevo@test.com',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1', tenantId: 'tenant-1' },
      data: {
        cedula: '123',
        documentType: 'CC',
        email: 'nuevo@test.com',
      },
    });
    expect(result).toBe(user);
  });
});
