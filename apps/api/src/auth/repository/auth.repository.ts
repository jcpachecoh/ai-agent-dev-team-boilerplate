import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuthUserSafe,
  AuthUserWithPassword,
  AuthUserWithRefresh,
  AuthRoleRef,
  CreateUserData,
  IAuthRepository,
} from '../interfaces/auth.interfaces';

const AUTH_USER_SAFE_SELECT = {
  id: true,
  tenantId: true,
  cedula: true,
  documentType: true,
  email: true,
  roleId: true,
  loginAttempts: true,
  lockedUntil: true,
  lastLoginAt: true,
  passwordChangedAt: true,
  isActive: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  createdBy: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTenantAndEmail(tenantId: string, email: string): Promise<AuthUserSafe | null> {
    return this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      select: AUTH_USER_SAFE_SELECT,
    });
  }

  findByTenantAndEmailForAuth(
    tenantId: string,
    email: string,
  ): Promise<AuthUserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email } },
      select: { ...AUTH_USER_SAFE_SELECT, passwordHash: true },
    });
  }

  findByTenantAndCedula(tenantId: string, cedula: string): Promise<AuthUserSafe | null> {
    return this.prisma.user.findUnique({
      where: { tenantId_cedula: { tenantId, cedula } },
      select: AUTH_USER_SAFE_SELECT,
    });
  }

  findByIdForRefresh(id: string): Promise<AuthUserWithRefresh | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { ...AUTH_USER_SAFE_SELECT, refreshToken: true },
    });
  }

  findRoleByTenantAndCode(tenantId: string, code: string): Promise<AuthRoleRef | null> {
    return this.prisma.role.findUnique({
      where: { tenantId_code: { tenantId, code } },
      select: { id: true, code: true, isActive: true },
    });
  }

  createUser(data: CreateUserData): Promise<AuthUserSafe> {
    return this.prisma.user.create({
      data: {
        tenantId: data.tenantId,
        cedula: data.cedula,
        documentType: data.documentType,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        isActive: true,
        emailVerified: false,
      },
      select: AUTH_USER_SAFE_SELECT,
    });
  }

  async saveRefreshToken(userId: string, hashedToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
