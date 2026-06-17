import { Injectable } from '@nestjs/common';
import type { OperationalUser } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateOperationalUserData,
  IMesAuthRepository,
  MesLocationSummary,
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

  async findLocationIdByUserId(tenantId: string, userId: string): Promise<string | null> {
    const assignment = await this.prisma.userLocation.findFirst({
      where: { tenantId, userId },
      select: { locationId: true },
      orderBy: { createdAt: 'asc' },
    });
    return assignment?.locationId ?? null;
  }

  async findActiveLocationsByUserId(
    tenantId: string,
    userId: string,
  ): Promise<MesLocationSummary[]> {
    return this.prisma.location.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        users: { some: { userId, tenantId } },
      },
      select: { id: true, name: true, code: true, city: true, address: true },
      orderBy: { name: 'asc' },
    });
  }

  async findLocationById(tenantId: string, locationId: string): Promise<MesLocationSummary | null> {
    return this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null, isActive: true },
      select: { id: true, name: true, code: true, city: true, address: true },
    });
  }

  updateCedulaHash(id: string, cedulaHash: string): Promise<OperationalUser> {
    return this.prisma.operationalUser.update({
      where: { id },
      data: { cedulaHash },
    });
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
