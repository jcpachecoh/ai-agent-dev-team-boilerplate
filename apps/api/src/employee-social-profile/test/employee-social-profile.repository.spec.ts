import { BeneficiaryDisabilityType, DocumentType, EmployeeRelationshipType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeSocialProfileRepository } from '../repository/employee-social-profile.repository';
import type {
  CreateSocialProfileRecord,
  UpdateSocialProfileRecord,
} from '../interfaces/employee-social-profile.interfaces';

describe('EmployeeSocialProfileRepository', () => {
  const prisma = {
    employeeDetails: {
      findUnique: jest.fn(),
    },
    employeeSocialProfile: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const repository = new EmployeeSocialProfileRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const EMPLOYEE_SELECT = {
    id: true,
    tenantId: true,
    isActive: true,
    deletedAt: true,
  };

  describe('findEmployee', () => {
    it('busca el employeeDetails por id con el select esperado', async () => {
      const employee = { id: 'emp-1', tenantId: 'tenant-1', isActive: true, deletedAt: null };
      (prisma.employeeDetails.findUnique as jest.Mock).mockResolvedValue(employee);

      const result = await repository.findEmployee('emp-1');

      expect(prisma.employeeDetails.findUnique).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        select: EMPLOYEE_SELECT,
      });
      expect(result).toBe(employee);
    });
  });

  describe('findEmployeeByUserId', () => {
    it('busca el employeeDetails por userId con el select esperado', async () => {
      const employee = { id: 'emp-1', tenantId: 'tenant-1', isActive: true, deletedAt: null };
      (prisma.employeeDetails.findUnique as jest.Mock).mockResolvedValue(employee);

      const result = await repository.findEmployeeByUserId('user-1');

      expect(prisma.employeeDetails.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: EMPLOYEE_SELECT,
      });
      expect(result).toBe(employee);
    });
  });

  describe('create', () => {
    it('crea un familiar con todos los campos', async () => {
      const data: CreateSocialProfileRecord = {
        fullName: 'Ana García',
        primerNombre: 'Ana',
        segundoNombre: 'Lucia',
        primerApellido: 'García',
        segundoApellido: 'Pérez',
        documentType: DocumentType.TI,
        documentNumber: '123456',
        relationshipType: EmployeeRelationshipType.CHILD,
        disability: BeneficiaryDisabilityType.NOT_APPLICABLE,
        birthDate: new Date('2019-05-10'),
        isDependent: true,
      };
      const created = { id: 'prof-1', ...data };
      (prisma.employeeSocialProfile.create as jest.Mock).mockResolvedValue(created);

      const result = await repository.create('tenant-1', 'emp-1', data);

      expect(prisma.employeeSocialProfile.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          employeeDetailsId: 'emp-1',
          fullName: data.fullName,
          relationshipType: data.relationshipType,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          primerNombre: data.primerNombre,
          segundoNombre: data.segundoNombre,
          primerApellido: data.primerApellido,
          segundoApellido: data.segundoApellido,
          disability: data.disability,
          birthDate: data.birthDate,
          isDependent: data.isDependent,
        },
      });
      expect(result).toBe(created);
    });
  });

  describe('findAllByEmployee', () => {
    it('lista familiares activos ordenados por createdAt', async () => {
      const profiles = [{ id: 'prof-1' }];
      (prisma.employeeSocialProfile.findMany as jest.Mock).mockResolvedValue(profiles);

      const result = await repository.findAllByEmployee('tenant-1', 'emp-1');

      expect(prisma.employeeSocialProfile.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', employeeDetailsId: 'emp-1', deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toBe(profiles);
    });
  });

  describe('findById', () => {
    it('busca un familiar activo por id', async () => {
      const profile = { id: 'prof-1' };
      (prisma.employeeSocialProfile.findFirst as jest.Mock).mockResolvedValue(profile);

      const result = await repository.findById('tenant-1', 'prof-1', 'emp-1');

      expect(prisma.employeeSocialProfile.findFirst).toHaveBeenCalledWith({
        where: { id: 'prof-1', tenantId: 'tenant-1', employeeDetailsId: 'emp-1', deletedAt: null },
      });
      expect(result).toBe(profile);
    });
  });

  describe('update', () => {
    it('incluye únicamente los campos provistos cuando se actualizan todos', async () => {
      const data: UpdateSocialProfileRecord = {
        fullName: 'Ana García Ruiz',
        relationshipType: EmployeeRelationshipType.SPOUSE,
        documentType: DocumentType.CC,
        documentNumber: '987654',
        primerNombre: 'Ana',
        segundoNombre: 'Lucia',
        primerApellido: 'García',
        segundoApellido: 'Ruiz',
        disability: BeneficiaryDisabilityType.PHYSICAL,
        birthDate: new Date('1990-01-01'),
        isDependent: false,
      };
      const updated = { id: 'prof-1', ...data };
      (prisma.employeeSocialProfile.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('tenant-1', 'prof-1', 'emp-1', data);

      expect(prisma.employeeSocialProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: {
          fullName: data.fullName,
          relationshipType: data.relationshipType,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          primerNombre: data.primerNombre,
          segundoNombre: data.segundoNombre,
          primerApellido: data.primerApellido,
          segundoApellido: data.segundoApellido,
          disability: data.disability,
          birthDate: data.birthDate,
          isDependent: data.isDependent,
        },
      });
      expect(result).toBe(updated);
    });

    it('no incluye ningún campo cuando no se provee ninguno', async () => {
      const updated = { id: 'prof-1' };
      (prisma.employeeSocialProfile.update as jest.Mock).mockResolvedValue(updated);

      const result = await repository.update('tenant-1', 'prof-1', 'emp-1', {});

      expect(prisma.employeeSocialProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: {},
      });
      expect(result).toBe(updated);
    });
  });

  describe('softDelete', () => {
    it('marca deletedAt con la fecha actual', async () => {
      (prisma.employeeSocialProfile.update as jest.Mock).mockResolvedValue({});

      await repository.softDelete('tenant-1', 'prof-1', 'emp-1');

      expect(prisma.employeeSocialProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
