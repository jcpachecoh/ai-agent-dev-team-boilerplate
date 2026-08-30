import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateEmployeeData,
  IPayrollRepository,
  LinkedUserRecord,
  ListEmployeesFilters,
  UpdateEmployeeData,
  UpdateEmployeePayload,
} from '../interfaces/payroll.interfaces';
import { EmployeeDetails, User } from '@prisma/client';

@Injectable()
export class PayrollRepository implements IPayrollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateEmployeeData & { hasTransportSubsidy: boolean },
  ): Promise<EmployeeDetails & { user: User }> {
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: data.userId },
        data: { roleId: data.roleId },
      });

      const employeeDetails = await tx.employeeDetails.create({
        data: {
          userId: data.userId,
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
    payload: UpdateEmployeePayload,
  ): Promise<EmployeeDetails & { user: User; location?: { id: string; name: string } }> {
    const employeeData = this.normalizeEmployeeUpdate(payload.employee);

    return this.prisma.$transaction(async (tx) => {
      if (payload.user && Object.keys(payload.user).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: payload.user,
        });
      }

      if (Object.keys(employeeData).length === 0) {
        return tx.employeeDetails.findUniqueOrThrow({
          where: { userId },
          include: { user: true, location: { select: { id: true, name: true } } },
        });
      }

      return tx.employeeDetails.update({
        where: { userId },
        data: employeeData,
        include: { user: true, location: { select: { id: true, name: true } } },
      });
    });
  }

  private normalizeEmployeeUpdate(
    data: UpdateEmployeeData & { hasTransportSubsidy?: boolean },
  ): Record<string, unknown> {
    const patch: Record<string, unknown> = {};

    const scalarFields = [
      'locationId',
      'name',
      'position',
      'area',
      'department',
      'contractType',
      'salaryType',
      'salaryAmount',
      'hasTransportSubsidy',
      'epsName',
      'pensionFundName',
      'cesantiasFundName',
      'arlName',
      'arlRiskLevel',
      'cajaCompensacion',
      'isActive',
    ] as const;

    for (const field of scalarFields) {
      if (data[field] !== undefined) {
        patch[field] = data[field];
      }
    }

    if (data.hireDate !== undefined) {
      patch.hireDate = new Date(data.hireDate);
    }

    if (data.contractStart !== undefined) {
      patch.contractStart = new Date(data.contractStart);
    }

    if (data.contractEnd !== undefined) {
      patch.contractEnd = data.contractEnd ? new Date(data.contractEnd) : null;
    }

    if (data.isActive === true) {
      patch.deletedAt = null;
    }

    return patch;
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

  async findUserByEmailAndCedula(
    tenantId: string,
    email: string,
    cedula: string,
  ): Promise<LinkedUserRecord | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, email, cedula, deletedAt: null },
      select: { id: true, email: true, cedula: true },
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
