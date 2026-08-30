import type { AuthMethod, LoginAuditStatus, AuditAction } from '@prisma/client';

export interface AuditLogWithActorName {
  id: string;
  action: AuditAction;
  actorName: string | null;
  createdAt: Date;
  oldValue: unknown;
  newValue: unknown;
}

export interface IAuditRepository {
  create(data: {
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
  }): Promise<void>;

  createLoginAudit(data: {
    tenantId: string;
    userId?: string | null;
    identifier: string;
    authMethod: AuthMethod;
    status: LoginAuditStatus;
    failureReason?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceInfo?: Record<string, unknown> | null;
  }): Promise<void>;

  findByEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
    limit: number,
  ): Promise<AuditLogWithActorName[]>;
}

export interface IAuditService {
  log(params: {
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
  }): Promise<void>;

  logLogin(params: {
    tenantId: string;
    userId?: string | null;
    identifier: string;
    authMethod: AuthMethod;
    status: LoginAuditStatus;
    failureReason?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceInfo?: Record<string, unknown> | null;
  }): Promise<void>;

  findRecentByEntity(
    tenantId: string,
    entityType: string,
    entityId: string,
    limit?: number,
  ): Promise<AuditLogWithActorName[]>;
}
