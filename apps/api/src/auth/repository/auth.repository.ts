import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuthUserSafe,
  AuthUserWithPassword,
  AuthUserWithRefresh,
  AuthUserProfile,
  AuthRoleRef,
  CreateUserData,
  IAuthRepository,
  JwtPayload,
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

  findByIdForAuth(id: string): Promise<AuthUserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { ...AUTH_USER_SAFE_SELECT, passwordHash: true },
    });
  }

  async findJwtClaimsByUserId(id: string): Promise<JwtPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        tenantId: true,
        roleId: true,
        isActive: true,
        deletedAt: true,
        role: { select: { code: true } },
      },
    });

    if (!user || !user.isActive || user.deletedAt || !user.role?.code) {
      return null;
    }

    return {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      roleCode: user.role.code,
    };
  }

  async findByIdWithRoleCode(id: string): Promise<AuthUserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        email: true,
        cedula: true,
        documentType: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        deletedAt: true,
        role: { select: { code: true } },
      },
    });

    if (!user || user.deletedAt) return null;

    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      cedula: user.cedula,
      documentType: user.documentType,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      roleCode: user.role.code,
      createdAt: user.createdAt,
    };
  }

  findRoleByTenantAndCode(tenantId: string, code: string): Promise<AuthRoleRef | null> {
    return this.prisma.role.findUnique({
      where: { tenantId_code: { tenantId, code } },
      select: { id: true, code: true, isActive: true },
    });
  }

  async incrementLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: { increment: 1 } },
    });
  }

  async lockUser(userId: string, until: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: until },
    });
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
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

  async updatePassword(
    userId: string,
    passwordHash: string,
    trackPasswordChange = false,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        ...(trackPasswordChange ? { passwordChangedAt: new Date() } : {}),
      },
    });
  }

  async markEmailVerified(userId: string, tenantId?: string): Promise<boolean> {
    const result = await this.prisma.user.updateMany({
      where: {
        id: userId,
        deletedAt: null,
        ...(tenantId != null ? { tenantId } : {}),
      },
      data: { emailVerified: true },
    });
    return result.count > 0;
  }
}
