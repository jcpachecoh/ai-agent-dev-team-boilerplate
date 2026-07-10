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

  private buildListWhere(filters: ListEmployeesFilters): Record<string, unknown> {
    const where: Record<string, unknown> = {
      tenantId: filters.tenantId,
    };

    if (filters.locationId) {
      where.locationId = filters.locationId;
    } else if (filters.allowedLocationIds) {
      where.locationId = { in: filters.allowedLocationIds };
    }

    if (filters.contractType) {
      where.contractType = filters.contractType;
    }

    if (filters.positionId) {
      where.positionId = filters.positionId;
    }

    if (filters.area?.trim()) {
      where.area = { contains: filters.area.trim(), mode: 'insensitive' };
    }

    if (filters.department?.trim()) {
      where.department = filters.department.trim();
    }

    if (filters.employeeId) {
      where.id = filters.employeeId;
    }

    if (!filters.includeInactive) {
      where.isActive = true;
      where.deletedAt = null;
    } else if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { user: { cedula: { contains: search } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  async create(
    data: CreateEmployeeData & { hasTransportSubsidy: boolean },
  ): Promise<EmployeeDetails & { user: User }> {
    return this.prisma.$transaction(async (tx) => {
      let userId = data.userId;

      if (!userId) {
        const user = await tx.user.create({
          data: {
            tenantId: data.tenantId,
            email: data.email,
            cedula: data.cedula,
            documentType: data.documentType,
            roleId: data.roleId!,
            passwordHash: data.passwordHash!,
            isActive: true,
          },
        });
        userId = user.id;
      }

      const employeeDetails = await tx.employeeDetails.create({
        data: {
          userId,
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
          barrio: data.barrio ?? null,
          localidad: data.localidad ?? null,
          costCenter: data.costCenter,
          laborClassification: data.laborClassification,
          nonSalaryAmount: data.nonSalaryAmount ?? null,
          isActive: true,
        },
        include: { user: true, socialProfiles: { where: { deletedAt: null } } },
      });

      return employeeDetails as EmployeeDetails & { user: User };
    });
  }

  private static readonly PHOTO_INCLUDE = {
    select: { id: true, key: true, visibility: true, status: true, deletedAt: true },
  } as const;

  async findAll(
    filters: ListEmployeesFilters,
  ): Promise<(EmployeeDetails & { user: User; location?: { id: string; name: string } })[]> {
    return this.prisma.employeeDetails.findMany({
      where: this.buildListWhere(filters),
      include: {
        user: true,
        location: { select: { id: true, name: true } },
        photoStorageObject: PayrollRepository.PHOTO_INCLUDE,
        socialProfiles: { where: { deletedAt: null } },
      },
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
      include: {
        user: true,

        location: { select: { id: true, name: true } },
        photoStorageObject: PayrollRepository.PHOTO_INCLUDE,
        socialProfiles: { where: { deletedAt: null } },
      },
    });
  }

  async findByUserId(userId: string): Promise<(EmployeeDetails & { user: User }) | null> {
    return this.prisma.employeeDetails.findUnique({
      where: { userId },
      include: {
        user: true,
        photoStorageObject: PayrollRepository.PHOTO_INCLUDE,
        socialProfiles: { where: { deletedAt: null } },
      },
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

      const socialProfileInclude = { where: { deletedAt: null } };
      if (Object.keys(employeeData).length === 0) {
        return tx.employeeDetails.findUniqueOrThrow({
          where: { userId },
          include: {
            user: true,

            location: { select: { id: true, name: true } },
            photoStorageObject: PayrollRepository.PHOTO_INCLUDE,
            socialProfiles: socialProfileInclude,
          },
        });
      }

      return tx.employeeDetails.update({
        where: { userId },
        data: employeeData,
        include: {
          user: true,

          location: { select: { id: true, name: true } },
          photoStorageObject: PayrollRepository.PHOTO_INCLUDE,
          socialProfiles: socialProfileInclude,
        },
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
      'positionId',
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
      'barrio',
      'localidad',
      'costCenter',
      'laborClassification',
      'nonSalaryAmount',
      'isActive',
      'photoStorageObjectId',
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

  async softDelete(userId: string): Promise<EmployeeDetails & { user: User }> {
    return this.prisma.employeeDetails.update({
      where: { userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
      include: {
        user: true,
      },
    });
  }

  async count(filters: ListEmployeesFilters): Promise<number> {
    return this.prisma.employeeDetails.count({
      where: this.buildListWhere(filters),
    });
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

  async findUserByEmail(tenantId: string, email: string): Promise<LinkedUserRecord | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, email, deletedAt: null },
      select: { id: true, email: true, cedula: true },
    });
  }

  async findUserByCedula(tenantId: string, cedula: string): Promise<LinkedUserRecord | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, cedula, deletedAt: null },
      select: { id: true, email: true, cedula: true },
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

  async findRoleByTenantAndCode(
    tenantId: string,
    code: string,
  ): Promise<{ id: string; tenantId: string } | null> {
    return this.prisma.role.findFirst({
      where: { tenantId, code, isActive: true },
      select: { id: true, tenantId: true },
    });
  }

  async updateEmployeePositionAssignment(
    employeeDetailsId: string,
    data: { positionId: string; position: string },
  ): Promise<void> {
    await this.prisma.employeeDetails.update({
      where: { id: employeeDetailsId },
      data: {
        positionId: data.positionId,
        position: data.position,
      },
    });
  }
}
