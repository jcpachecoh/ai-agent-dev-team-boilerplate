import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { EmployeeRelationshipType } from '@prisma/client';

import { EmployeeSocialProfileRepository } from '../repository/employee-social-profile.repository';
import { EmployeeSocialProfileService } from '../service/employee-social-profile.service';

const TENANT_ID = 'tenant-001';
const OTHER_TENANT_ID = 'tenant-002';
const EMPLOYEE_ID = 'emp-001';
const USER_ID = 'user-001';
const PROFILE_ID = 'prof-001';

const mockEmployee = {
  id: EMPLOYEE_ID,
  tenantId: TENANT_ID,
  isActive: true,
  deletedAt: null,
};

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

const validCreateData = {
  fullName: 'Ana García',
  relationshipType: EmployeeRelationshipType.SPOUSE,
  birthDate: new Date('1990-05-10'),
  isDependent: false,
};

describe('EmployeeSocialProfileService', () => {
  let service: EmployeeSocialProfileService;
  let repository: jest.Mocked<EmployeeSocialProfileRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeSocialProfileService,
        {
          provide: EmployeeSocialProfileRepository,
          useValue: {
            findEmployee: jest.fn(),
            findEmployeeByUserId: jest.fn(),
            create: jest.fn(),
            findAllByEmployee: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeSocialProfileService>(EmployeeSocialProfileService);
    repository = module.get<EmployeeSocialProfileRepository>(
      EmployeeSocialProfileRepository,
    ) as jest.Mocked<EmployeeSocialProfileRepository>;
  });

  describe('create', () => {
    it('crea un familiar válido', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.create.mockResolvedValue(mockProfile);

      // Act
      const result = await service.create(TENANT_ID, EMPLOYEE_ID, validCreateData);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(repository.create).toHaveBeenCalledWith(TENANT_ID, EMPLOYEE_ID, validCreateData);
    });

    it('rechaza si el employee no existe', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(TENANT_ID, EMPLOYEE_ID, validCreateData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si el employee pertenece a otro tenant', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue({
        ...mockEmployee,
        tenantId: OTHER_TENANT_ID,
      });

      // Act & Assert
      await expect(service.create(TENANT_ID, EMPLOYEE_ID, validCreateData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si el employee está inactivo', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue({
        ...mockEmployee,
        isActive: false,
      });

      // Act & Assert
      await expect(service.create(TENANT_ID, EMPLOYEE_ID, validCreateData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza si el employee tiene deletedAt', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue({
        ...mockEmployee,
        deletedAt: new Date(),
      });

      // Act & Assert
      await expect(service.create(TENANT_ID, EMPLOYEE_ID, validCreateData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('propaga ConflictException del repositorio (duplicate familiar)', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.create.mockRejectedValue(
        new ConflictException('Ya existe un registro de familiar'),
      );

      // Act & Assert
      await expect(service.create(TENANT_ID, EMPLOYEE_ID, validCreateData)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllByEmployee', () => {
    it('lista solo familiares activos del employee', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findAllByEmployee.mockResolvedValue([mockProfile]);

      // Act
      const result = await service.findAllByEmployee(TENANT_ID, EMPLOYEE_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(repository.findAllByEmployee).toHaveBeenCalledWith(TENANT_ID, EMPLOYEE_ID);
    });

    it('rechaza si el employee no existe en el tenant', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findAllByEmployee(TENANT_ID, EMPLOYEE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('actualiza un familiar válido', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findById.mockResolvedValue(mockProfile);
      repository.update.mockResolvedValue({ ...mockProfile, fullName: 'Ana García Ruiz' });

      // Act
      const result = await service.update(TENANT_ID, PROFILE_ID, EMPLOYEE_ID, {
        fullName: 'Ana García Ruiz',
      });

      // Assert
      expect(result.fullName).toBe('Ana García Ruiz');
      expect(repository.update).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID, EMPLOYEE_ID, {
        fullName: 'Ana García Ruiz',
      });
    });

    it('lanza NotFoundException si el familiar no existe', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.update(TENANT_ID, 'ghost-id', EMPLOYEE_ID, { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('hace soft delete del familiar', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findById.mockResolvedValue(mockProfile);

      // Act
      await service.remove(TENANT_ID, PROFILE_ID, EMPLOYEE_ID);

      // Assert
      expect(repository.softDelete).toHaveBeenCalledWith(TENANT_ID, PROFILE_ID, EMPLOYEE_ID);
    });

    it('no puede operar un familiar ya eliminado (no encontrado en repo)', async () => {
      // Arrange
      repository.findEmployee.mockResolvedValue(mockEmployee);
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(TENANT_ID, 'deleted-id', EMPLOYEE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMyProfiles (self-service)', () => {
    it('retorna solo los familiares del usuario autenticado', async () => {
      // Arrange
      repository.findEmployeeByUserId.mockResolvedValue(mockEmployee);
      repository.findAllByEmployee.mockResolvedValue([mockProfile]);

      // Act
      const result = await service.findMyProfiles(USER_ID, TENANT_ID);

      // Assert
      expect(result).toHaveLength(1);
      expect(repository.findEmployeeByUserId).toHaveBeenCalledWith(USER_ID);
      expect(repository.findAllByEmployee).toHaveBeenCalledWith(TENANT_ID, EMPLOYEE_ID);
    });

    it('falla si el usuario no tiene EmployeeDetails', async () => {
      // Arrange
      repository.findEmployeeByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findMyProfiles(USER_ID, TENANT_ID)).rejects.toThrow(NotFoundException);
    });

    it('falla si el EmployeeDetails pertenece a otro tenant (aislamiento)', async () => {
      // Arrange
      repository.findEmployeeByUserId.mockResolvedValue({
        ...mockEmployee,
        tenantId: OTHER_TENANT_ID,
      });

      // Act & Assert
      await expect(service.findMyProfiles(USER_ID, TENANT_ID)).rejects.toThrow(NotFoundException);
    });

    it('falla si el empleado está inactivo', async () => {
      // Arrange
      repository.findEmployeeByUserId.mockResolvedValue({
        ...mockEmployee,
        isActive: false,
      });

      // Act & Assert
      await expect(service.findMyProfiles(USER_ID, TENANT_ID)).rejects.toThrow(ForbiddenException);
    });
  });
});
