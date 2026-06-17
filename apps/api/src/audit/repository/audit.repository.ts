import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
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
    try {
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
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        return;
      }
      throw error;
    }
  }
}
