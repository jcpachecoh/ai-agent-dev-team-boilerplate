import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEmployeeData,
  IPayrollRepository,
  ListEmployeesFilters,
  UpdateEmployeeData,
} from '../interfaces/payroll.interfaces';
import { EmployeeDetails, User } from '@prisma/client';

@Injectable()
export class PayrollRepository implements IPayrollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateEmployeeData & { hasTransportSubsidy: boolean },
  ): Promise<EmployeeDetails & { user: User }> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId: data.tenantId,
          cedula: data.cedula,
          documentType: data.documentType,
          email: data.email,
          passwordHash: data.passwordHash,
          roleId: data.roleId,
          isActive: true,
        },
      });

      const employeeDetails = await tx.employeeDetails.create({
        data: {
          userId: user.id,
          tenantId: data.tenantId,
          name: data.name,
          locationId: data.locationId,
          position: data.position,
          area: data.area,
          department: data.department,
          contractType: data.contractType,
          hireDate: new Date(data.hireDate),
          contractStart: new Date(data.contractStart),
          contractEnd: data.contractEnd ? new Date(data.contractEnd) : null,
          salaryType: data.salaryType,
          salaryAmount: data.salaryAmount,
          hasTransportSubsidy: data.hasTransportSubsidy,
          epsName: data.epsName,
          pensionFundName: data.pensionFundName,
          cesantiasFundName: data.cesantiasFundName,
          arlName: data.arlName,
          arlRiskLevel: data.arlRiskLevel,
          cajaCompensacion: data.cajaCompensacion,
          isActive: true,
        },
        include: { user: true },
      });

      return employeeDetails as EmployeeDetails & { user: User };
    });
  }

  async findAll(
    filters: ListEmployeesFilters,
  ): Promise<(EmployeeDetails & { user: User; location?: { id: string; name: string } })[]> {
    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters.contractType) {
      where.contractType = filters.contractType;
    }

    if (!filters.includeInactive) {
      where.isActive = true;
      where.deletedAt = null;
    } else if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.employeeDetails.findMany({
      where,
      include: { user: true, location: { select: { id: true, name: true } } },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(
    id: string,
  ): Promise<(EmployeeDetails & { user: User; location?: { id: string; name: string } }) | null> {
    return this.prisma.employeeDetails.findUnique({
      where: { id },
      include: { user: true, location: { select: { id: true, name: true } } },
    });
  }

  async findByUserId(userId: string): Promise<(EmployeeDetails & { user: User }) | null> {
    return this.prisma.employeeDetails.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async update(
    userId: string,
    data: UpdateEmployeeData & { hasTransportSubsidy?: boolean },
  ): Promise<EmployeeDetails> {
    return this.prisma.employeeDetails.update({
      where: { userId },
      data,
    });
  }

  async softDelete(userId: string): Promise<void> {
    await this.prisma.employeeDetails.update({
      where: { userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  async count(filters: ListEmployeesFilters): Promise<number> {
    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    if (filters.contractType) {
      where.contractType = filters.contractType;
    }

    if (!filters.includeInactive) {
      where.isActive = true;
      where.deletedAt = null;
    }

    return this.prisma.employeeDetails.count({ where });
  }

  async findExistingUser(
    tenantId: string,
    email: string,
    cedula: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, OR: [{ email }, { cedula }] },
      select: { id: true },
    });
  }

  async findLocationById(locationId: string): Promise<{ id: string; tenantId: string } | null> {
    return this.prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true, tenantId: true },
    });
  }

  async findRoleById(roleId: string): Promise<{ id: string; tenantId: string } | null> {
    return this.prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, tenantId: true },
    });
  }
}
