import { Injectable } from '@nestjs/common';
import { ArlRiskLevel, EmployeeContractType, SalaryType } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import type {
  AdminUserDetail,
  AdminUserListItem,
  CreateAdminUserData,
  IAdminUsersRepository,
  UpdateAdminUserData,
  UserPermissionOverrideInput,
} from '../interfaces/admin-users.interfaces';

const ROLE_SELECT = { select: { id: true, code: true, name: true } } as const;

@Injectable()
export class AdminUsersRepository implements IAdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, includeInactive = false): Promise<AdminUserListItem[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true, deletedAt: null }),
      },
      include: { role: ROLE_SELECT },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(toListItem);
  }

  async findById(tenantId: string, userId: string): Promise<AdminUserDetail | null> {
    const row = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { role: ROLE_SELECT },
    });

    if (!row) {
      return null;
    }

    return {
      ...toListItem(row),
      loginAttempts: row.loginAttempts,
      lockedUntil: row.lockedUntil,
      passwordChangedAt: row.passwordChangedAt,
      createdBy: row.createdBy,
    };
  }

  async findByEmail(tenantId: string, email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, email },
      select: { id: true },
    });
  }

  async findByCedula(tenantId: string, cedula: string): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: { tenantId, cedula },
      select: { id: true },
    });
  }

  async create(tenantId: string, data: CreateAdminUserData): Promise<AdminUserListItem> {
    const row = await this.prisma.user.create({
      data: {
        tenantId,
        cedula: data.cedula,
        documentType: data.documentType,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        createdBy: data.createdBy,
        isActive: true,
        emailVerified: false,
      },
      include: { role: ROLE_SELECT },
    });

    return toListItem(row);
  }

  async createWithEmployeeDetails(
    tenantId: string,
    data: CreateAdminUserData,
  ): Promise<AdminUserListItem> {
    const location = await this.prisma.location.findFirst({
      where: { tenantId, isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    const locationId = location?.id ?? tenantId;

    const row = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          cedula: data.cedula,
          documentType: data.documentType,
          email: data.email,
          passwordHash: data.passwordHash,
          roleId: data.roleId,
          createdBy: data.createdBy,
          isActive: true,
          emailVerified: false,
        },
        include: { role: ROLE_SELECT },
      });

      const now = new Date();
      await tx.employeeDetails.create({
        data: {
          userId: user.id,
          tenantId,
          name: data.name,
          locationId,
          position: 'Por definir',
          area: 'Por definir',
          department: 'Por definir',
          contractType: EmployeeContractType.INDEFINIDO,
          hireDate: now,
          contractStart: now,
          salaryType: SalaryType.ORDINARIO,
          salaryAmount: 0,
          epsName: 'Por definir',
          pensionFundName: 'Por definir',
          cesantiasFundName: 'Por definir',
          arlName: 'Por definir',
          arlRiskLevel: ArlRiskLevel.RIESGO_I,
          cajaCompensacion: 'Por definir',
        },
      });

      return user;
    });

    return toListItem(row);
  }

  async update(
    tenantId: string,
    userId: string,
    data: UpdateAdminUserData,
  ): Promise<AdminUserListItem> {
    const row = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.roleId !== undefined && { roleId: data.roleId }),
        ...(data.isActive !== undefined && {
          isActive: data.isActive,
          ...(data.isActive ? { deletedAt: null } : { deletedAt: new Date() }),
        }),
      },
      include: { role: ROLE_SELECT },
    });

    return toListItem(row);
  }

  async deactivate(tenantId: string, userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async setUserPermissionOverrides(
    userId: string,
    overrides: UserPermissionOverrideInput[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userPermission.deleteMany({ where: { userId } }),
      this.prisma.userPermission.createMany({
        data: overrides.map((o) => ({
          userId,
          permissionId: o.permissionId,
          effect: o.effect,
        })),
      }),
    ]);
  }
}

function toListItem(row: {
  id: string;
  tenantId: string;
  cedula: string;
  documentType: import('@prisma/client').DocumentType;
  email: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  role: { id: string; code: string; name: string };
}): AdminUserListItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    cedula: row.cedula,
    documentType: row.documentType,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    emailVerified: row.emailVerified,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
  };
}
