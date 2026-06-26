import { type CanActivate, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EmployeeRelationshipType } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeSocialProfileResolver } from '../resolver/employee-social-profile.resolver';
import { EmployeeSocialProfileService } from '../service/employee-social-profile.service';

const allowGuard: CanActivate = { canActivate: () => true };

const TENANT_ID = 'tenant-001';
const EMPLOYEE_ID = 'emp-001';
const PROFILE_ID = 'prof-001';

const mockUser = { sub: 'user-001', tenantId: TENANT_ID };

const gqlCtx = (tenantHeader?: string): never =>
  ({ req: { headers: { 'x-tenant-id': tenantHeader ?? TENANT_ID } } }) as never;

const mockProfile = {
  id: PROFILE_ID,
  tenantId: TENANT_ID,
  employeeDetailsId: EMPLOYEE_ID,
  fullName: 'Ana García',
  relationshipType: EmployeeRelationshipType.SPOUSE,
  birthDate: new Date('1990-05-10'),
  isDependent: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const serviceMock = {
  findMyProfiles: jest.fn(),
  findAllByEmployee: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findOne: jest.fn(),
};

describe('EmployeeSocialProfileResolver', () => {
  let resolver: EmployeeSocialProfileResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeSocialProfileResolver,
        { provide: EmployeeSocialProfileService, useValue: serviceMock },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    resolver = module.get<EmployeeSocialProfileResolver>(EmployeeSocialProfileResolver);
    jest.clearAllMocks();
  });

  // ── myEmployeeSocialProfiles ──────────────────────────────────────────────

  describe('myEmployeeSocialProfiles', () => {
    it('delega al service usando tenantId del JWT', async () => {
      // Arrange
      serviceMock.findMyProfiles.mockResolvedValue([mockProfile]);

      // Act
      const result = await resolver.myEmployeeSocialProfiles(mockUser as never, gqlCtx());

      // Assert
      expect(serviceMock.findMyProfiles).toHaveBeenCalledWith(mockUser.sub, TENANT_ID);
      expect(result).toHaveLength(1);
    });
  });

  // ── employeeSocialProfiles ────────────────────────────────────────────────

  describe('employeeSocialProfiles', () => {
    it('delega al service con tenantId y employeeId', async () => {
      // Arrange
      serviceMock.findAllByEmployee.mockResolvedValue([mockProfile]);

      // Act
      const result = await resolver.employeeSocialProfiles(
        mockUser as never,
        gqlCtx(),
        EMPLOYEE_ID,
      );

      // Assert
      expect(serviceMock.findAllByEmployee).toHaveBeenCalledWith(TENANT_ID, EMPLOYEE_ID);
      expect(result).toHaveLength(1);
    });

    it('propaga NotFoundException del service', async () => {
      // Arrange
      serviceMock.findAllByEmployee.mockRejectedValue(
        new NotFoundException('Empleado no encontrado'),
      );

      // Act & Assert
      await expect(
        resolver.employeeSocialProfiles(mockUser as never, gqlCtx(), 'ghost-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── createEmployeeSocialProfile ───────────────────────────────────────────

  describe('createEmployeeSocialProfile', () => {
    const input = {
      fullName: 'Ana García',
      relationshipType: EmployeeRelationshipType.SPOUSE,
      birthDate: new Date('1990-05-10'),
      isDependent: false,
    };

    it('crea un familiar y lo retorna', async () => {
      // Arrange
      serviceMock.create.mockResolvedValue(mockProfile);

      // Act
      const result = await resolver.createEmployeeSocialProfile(
        mockUser as never,
        gqlCtx(),
        EMPLOYEE_ID,
        input as never,
      );

      // Assert
      expect(serviceMock.create).toHaveBeenCalledWith(TENANT_ID, EMPLOYEE_ID, {
        fullName: input.fullName.trim(),
        relationshipType: input.relationshipType,
        birthDate: input.birthDate,
        isDependent: false,
      });
      expect(result).toEqual(mockProfile);
    });
  });

  // ── updateEmployeeSocialProfile ───────────────────────────────────────────

  describe('updateEmployeeSocialProfile', () => {
    it('actualiza y retorna el familiar', async () => {
      // Arrange
      serviceMock.update.mockResolvedValue({ ...mockProfile, fullName: 'Ana García Ruiz' });

      // Act
      const result = await resolver.updateEmployeeSocialProfile(
        mockUser as never,
        gqlCtx(),
        EMPLOYEE_ID,
        PROFILE_ID,
        { fullName: 'Ana García Ruiz' } as never,
      );

      // Assert
      expect(serviceMock.update).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID, EMPLOYEE_ID, {
        fullName: 'Ana García Ruiz',
        relationshipType: undefined,
        birthDate: undefined,
        isDependent: undefined,
      });
      expect(result.fullName).toBe('Ana García Ruiz');
    });
  });

  // ── deleteEmployeeSocialProfile ───────────────────────────────────────────

  describe('deleteEmployeeSocialProfile', () => {
    it('elimina y retorna true', async () => {
      // Arrange
      serviceMock.remove.mockResolvedValue(undefined);

      // Act
      const result = await resolver.deleteEmployeeSocialProfile(
        mockUser as never,
        gqlCtx(),
        EMPLOYEE_ID,
        PROFILE_ID,
      );

      // Assert
      expect(serviceMock.remove).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID, EMPLOYEE_ID);
      expect(result).toBe(true);
    });
  });
});
