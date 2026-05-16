import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { IAuditRepository } from '../interfaces/audit.interfaces';

@Injectable()
export class AuditRepository implements IAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string | null;
    payload?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        userId: data.userId ?? null,
        payload: data.payload as Prisma.InputJsonValue | undefined,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  }
}
