import { Injectable } from '@nestjs/common';
import { EmployeeSocialProfile } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateSocialProfileData,
  EmployeeRecord,
  IEmployeeSocialProfileRepository,
  UpdateSocialProfileData,
} from '../interfaces/employee-social-profile.interfaces';

const EMPLOYEE_SELECT = {
  id: true,
  tenantId: true,
  isActive: true,
  deletedAt: true,
} as const;

@Injectable()
export class EmployeeSocialProfileRepository implements IEmployeeSocialProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEmployee(employeeDetailsId: string): Promise<EmployeeRecord | null> {
    return this.prisma.employeeDetails.findUnique({
      where: { id: employeeDetailsId },
      select: EMPLOYEE_SELECT,
    });
  }

  async findEmployeeByUserId(userId: string): Promise<EmployeeRecord | null> {
    return this.prisma.employeeDetails.findUnique({
      where: { userId },
      select: EMPLOYEE_SELECT,
    });
  }

  async create(
    tenantId: string,
    employeeDetailsId: string,
    data: CreateSocialProfileData,
  ): Promise<EmployeeSocialProfile> {
    return this.prisma.employeeSocialProfile.create({
      data: {
        tenantId,
        employeeDetailsId,
        fullName: data.fullName,
        relationshipType: data.relationshipType,
        birthDate: data.birthDate,
        isDependent: data.isDependent,
      },
    });
  }

  async findAllByEmployee(
    tenantId: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSocialProfile[]> {
    return this.prisma.employeeSocialProfile.findMany({
      where: { tenantId, employeeDetailsId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
  ): Promise<EmployeeSocialProfile | null> {
    return this.prisma.employeeSocialProfile.findFirst({
      where: { id, tenantId, employeeDetailsId, deletedAt: null },
    });
  }

  async update(
    tenantId: string,
    id: string,
    employeeDetailsId: string,
    data: UpdateSocialProfileData,
  ): Promise<EmployeeSocialProfile> {
    return this.prisma.employeeSocialProfile.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.relationshipType !== undefined && { relationshipType: data.relationshipType }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.isDependent !== undefined && { isDependent: data.isDependent }),
      },
    });
  }

  async softDelete(_tenantId: string, id: string, _employeeDetailsId: string): Promise<void> {
    await this.prisma.employeeSocialProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
