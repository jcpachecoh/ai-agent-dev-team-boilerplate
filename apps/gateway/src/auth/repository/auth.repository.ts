import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationalUser } from '@prisma/client';
import type { IAuthRepository } from '../interfaces/auth.interfaces';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByTenantAndCedula(
    tenantId: string,
    cedulaHash: string,
  ): Promise<OperationalUser | null> {
    return this.prisma.operationalUser.findUnique({
      where: { tenantId_cedulaHash: { tenantId, cedulaHash } },
    });
  }

  async updateLoginAttempts(id: string, attempts: number, lockedUntil: Date | null): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { loginAttempts: attempts, lockedUntil },
    });
  }

  async resetLoginAttempts(id: string): Promise<OperationalUser> {
    return this.prisma.operationalUser.update({
      where: { id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
  }

  async findUserById(id: string): Promise<OperationalUser | null> {
    return this.prisma.operationalUser.findUnique({ where: { id } });
  }
}
