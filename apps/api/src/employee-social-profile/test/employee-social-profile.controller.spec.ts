import { BadRequestException, type CanActivate, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EmployeeRelationshipType } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeSocialProfileController } from '../controller/employee-social-profile.controller';
import { EmployeeSocialProfileService } from '../service/employee-social-profile.service';

const allowGuard: CanActivate = { canActivate: () => true };

const TENANT_ID = 'tenant-001';
const EMPLOYEE_ID = 'emp-001';
const PROFILE_ID = 'prof-001';

const mockUser = { sub: 'user-001', tenantId: TENANT_ID };

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

describe('EmployeeSocialProfileController', () => {
  let controller: EmployeeSocialProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeSocialProfileController],
      providers: [{ provide: EmployeeSocialProfileService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get<EmployeeSocialProfileController>(EmployeeSocialProfileController);
    jest.clearAllMocks();
  });

  // ── findMyProfiles ────────────────────────────────────────────────────────

  describe('findMyProfiles', () => {
    it('delega al service y retorna los perfiles mapeados', async () => {
      // Arrange
      serviceMock.findMyProfiles.mockResolvedValue([mockProfile]);

      // Act
      const result = await controller.findMyProfiles(mockUser as never, '');

      // Assert
      expect(serviceMock.findMyProfiles).toHaveBeenCalledWith(mockUser.sub, TENANT_ID);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(PROFILE_ID);
    });

    it('lanza BadRequestException si no hay tenantId en JWT ni header', async () => {
      // Act & Assert
      await expect(
        controller.findMyProfiles({ sub: 'u', tenantId: '' } as never, ''),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('delega al service con tenantId y employeeId', async () => {
      // Arrange
      serviceMock.findAllByEmployee.mockResolvedValue([mockProfile]);

      // Act
      const result = await controller.findAll(mockUser as never, '', EMPLOYEE_ID);

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
      await expect(controller.findAll(mockUser as never, '', 'ghost-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      fullName: 'Ana García',
      relationshipType: EmployeeRelationshipType.SPOUSE,
      birthDate: new Date('1990-05-10'),
      isDependent: false,
    };

    it('crea un familiar y retorna el dto de respuesta', async () => {
      // Arrange
      serviceMock.create.mockResolvedValue(mockProfile);

      // Act
      const result = await controller.create(mockUser as never, '', EMPLOYEE_ID, dto as never);

      // Assert
      expect(serviceMock.create).toHaveBeenCalledWith(TENANT_ID, EMPLOYEE_ID, {
        fullName: dto.fullName.trim(),
        relationshipType: dto.relationshipType,
        birthDate: dto.birthDate,
        isDependent: false,
      });
      expect(result.id).toBe(PROFILE_ID);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('actualiza y retorna el dto de respuesta', async () => {
      // Arrange
      serviceMock.update.mockResolvedValue({ ...mockProfile, fullName: 'Ana García Ruiz' });

      // Act
      const result = await controller.update(mockUser as never, '', EMPLOYEE_ID, PROFILE_ID, {
        fullName: 'Ana García Ruiz',
      } as never);

      // Assert
      expect(serviceMock.update).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID, EMPLOYEE_ID, {
        fullName: 'Ana García Ruiz',
        relationshipType: undefined,
        birthDate: undefined,
        isDependent: undefined,
      });
      expect(result.fullName).toBe('Ana García Ruiz');
    });

    it('propaga NotFoundException si el familiar no existe', async () => {
      // Arrange
      serviceMock.update.mockRejectedValue(new NotFoundException('Familiar no encontrado'));

      // Act & Assert
      await expect(
        controller.update(mockUser as never, '', EMPLOYEE_ID, 'ghost-id', {} as never),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('elimina y retorna true', async () => {
      // Arrange
      serviceMock.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(mockUser as never, '', EMPLOYEE_ID, PROFILE_ID);

      // Assert
      expect(serviceMock.remove).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID, EMPLOYEE_ID);
      expect(result).toBe(true);
    });
  });
});
