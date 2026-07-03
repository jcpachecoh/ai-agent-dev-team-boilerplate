import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeSocialProfile, Prisma } from '@prisma/client';

import type {
  CreateSocialProfileData,
  EmployeeRecord,
  IEmployeeSocialProfileService,
  UpdateSocialProfileData,
} from '../interfaces/employee-social-profile.interfaces';
import { EmployeeSocialProfileRepository } from '../repository/employee-social-profile.repository';

@Injectable()
export class EmployeeSocialProfileService implements IEmployeeSocialProfileService {
  constructor(private readonly repository: EmployeeSocialProfileRepository) {}

  async create(
    tenantId: string,
    employeeDetailsId: string,
    data: CreateSocialProfileData,
  ): Promise<EmployeeSocialProfile> {
    await this.resolveEmployee(tenantId, employeeDetailsId);
    try {
      return await this.repository.create(tenantId, employeeDetailsId, data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un registro de familiar con estos datos (nombre, parentesco y fecha de nacimiento) para este empleado',
        );
      }
      throw error;
    }
  }

  async findAllByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSocialProfile[]> {
    await this.resolveEmployee(tenantId, employeeDetailsId);
    return this.repository.findAllByEmployee(tenantId, employeeDetailsId);
  }

  async findOne(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSocialProfile> {
    await this.resolveEmployee(tenantId, employeeDetailsId);
    const profile = await this.repository.findById(tenantId, id, employeeDetailsId);
    if (!profile) {
      throw new NotFoundException(`Familiar ${id} no encontrado`);
    }
    return profile;
  }

  async update(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    data: UpdateSocialProfileData,
  ): Promise<EmployeeSocialProfile> {
    await this.findOne(tenantId, id, employeeDetailsId);
    try {
      return await this.repository.update(tenantId, id, employeeDetailsId, data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un registro de familiar con estos datos (nombre, parentesco y fecha de nacimiento) para este empleado',
        );
      }
      throw error;
    }
  }

  async remove(tenantId: string, id: string, employeeDetailsId: string): Promise<void> {
    await this.findOne(tenantId, id, employeeDetailsId);
    await this.repository.softDelete(tenantId, id, employeeDetailsId);
  }

  async findMyProfiles(userId: string, tenantId: string): Promise<EmployeeSocialProfile[]> {
    const employee = await this.repository.findEmployeeByUserId(userId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException('No se encontró un registro de empleado para este usuario');
    }
    if (!employee.isActive || employee.deletedAt !== null) {
      throw new ForbiddenException('El empleado está inactivo');
    }
    return this.repository.findAllByEmployee(tenantId, employee.id);
  }

  private async resolveEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeRecord> {
    const employee = await this.repository.findEmployee(employeeDetailsId);
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Empleado ${employeeDetailsId} no encontrado`);
    }
    if (!employee.isActive || employee.deletedAt !== null) {
      throw new BadRequestException('El empleado está inactivo o eliminado');
    }
    return employee;
  }
}
