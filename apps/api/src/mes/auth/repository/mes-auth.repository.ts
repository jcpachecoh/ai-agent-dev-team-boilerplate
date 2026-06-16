import { Injectable } from '@nestjs/common';
import type { OperationalUser } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateOperationalUserData,
  IMesAuthRepository,
} from '../interfaces/mes-auth.interfaces';

@Injectable()
export class MesAuthRepository implements IMesAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCedulaHash(tenantId: string, cedulaHash: string): Promise<OperationalUser | null> {
    return this.prisma.operationalUser.findUnique({
      where: { tenantId_cedulaHash: { tenantId, cedulaHash } },
    });
  }

  findById(id: string): Promise<OperationalUser | null> {
    return this.prisma.operationalUser.findUnique({ where: { id } });
  }

  createUser(data: CreateOperationalUserData): Promise<OperationalUser> {
    return this.prisma.operationalUser.create({
      data: {
        tenantId: data.tenantId,
        cedulaHash: data.cedulaHash,
        pinHash: data.pinHash,
        role: data.role,
        sedeId: data.sedeId,
        isActive: true,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { loginAttempts: { increment: 1 } },
    });
  }

  async lockUser(id: string, until: Date): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { lockedUntil: until },
    });
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }

  async saveRefreshToken(id: string, hashedToken: string | null): Promise<void> {
    await this.prisma.operationalUser.update({
      where: { id },
      data: { refreshToken: hashedToken },
    });
  }
}
