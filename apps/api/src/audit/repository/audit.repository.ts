import { Injectable } from '@nestjs/common';
import type { AuditAction, AuthMethod, LoginAuditStatus, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type { IAuditRepository } from '../interfaces/audit.interfaces';

@Injectable()
export class AuditRepository implements IAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    tenantId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    actorUserId?: string | null;
    userId?: string | null;
    payload?: Record<string, unknown> | null;
    oldValue?: Record<string, unknown> | null;
    newValue?: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          actorUserId: data.actorUserId ?? null,
          userId: data.userId ?? null,
          payload: (data.payload as Prisma.InputJsonValue) ?? null,
          oldValue: (data.oldValue as Prisma.InputJsonValue) ?? null,
          newValue: (data.newValue as Prisma.InputJsonValue) ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        // Foreign key constraint failed (e.g. user deleted between log call and persistence)
        // We log it to console but don't crash the request
        console.error('AuditLog persistence failed: Foreign key constraint error (P2003)', {
          tenantId: data.tenantId,
          entity: data.entityType,
          action: data.action,
        });
        return;
      }
      throw error;
    }
  }

  async createLoginAudit(data: {
    tenantId: string;
    userId?: string | null;
    identifier: string;
    authMethod: AuthMethod;
    status: LoginAuditStatus;
    failureReason?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceInfo?: Record<string, unknown> | null;
  }): Promise<void> {
    try {
      await this.prisma.loginAudit.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId ?? null,
          identifier: data.identifier,
          authMethod: data.authMethod,
          status: data.status,
          failureReason: data.failureReason ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          deviceInfo: (data.deviceInfo as Prisma.InputJsonValue) ?? null,
        },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2003') {
        console.error('LoginAudit persistence failed: Foreign key constraint error (P2003)', {
          tenantId: data.tenantId,
          identifier: data.identifier,
          status: data.status,
        });
        return;
      }
      throw error;
    }
  }
}
