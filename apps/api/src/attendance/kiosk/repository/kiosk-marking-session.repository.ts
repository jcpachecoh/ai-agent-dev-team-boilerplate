import { Injectable } from '@nestjs/common';
import type { KioskMarkingSession } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type CreateKioskMarkingSessionData = {
  tenantId: string;
  locationId: string;
  activatedByUserId: string;
  expiresAt: Date;
};

@Injectable()
export class KioskMarkingSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateKioskMarkingSessionData): Promise<KioskMarkingSession> {
    return this.prisma.kioskMarkingSession.create({ data });
  }

  findById(id: string, tenantId: string): Promise<KioskMarkingSession | null> {
    return this.prisma.kioskMarkingSession.findFirst({
      where: { id, tenantId },
    });
  }

  revoke(id: string, tenantId: string): Promise<KioskMarkingSession> {
    return this.prisma.kioskMarkingSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeIfOwned(
    id: string,
    tenantId: string,
    activatedByUserId: string,
  ): Promise<KioskMarkingSession | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing || existing.activatedByUserId !== activatedByUserId) {
      return null;
    }
    if (existing.revokedAt) {
      return existing;
    }
    return this.prisma.kioskMarkingSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
