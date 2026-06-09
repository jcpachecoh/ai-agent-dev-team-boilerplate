import { Injectable } from '@nestjs/common';
import type { AuditAction, AuthMethod, LoginAuditStatus } from '@prisma/client';
import type { IAuditService } from '../interfaces/audit.interfaces';
import { AuditRepository } from '../repository/audit.repository';

const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'pin',
  'pinHash',
  'cedulaHash',
  'refreshToken',
  'accessToken',
  'token',
  'tokenHash',
  'secret',
]);

const SENSITIVE_PATTERNS = [/Hash$/, /Token$/, /Secret$/];

@Injectable()
export class AuditService implements IAuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(params: {
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
    await this.auditRepository.create({
      tenantId: params.tenantId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorUserId: params.actorUserId ?? null,
      userId: params.userId ?? null,
      payload: params.payload ? (this.redact(params.payload) as Record<string, unknown>) : null,
      oldValue: params.oldValue ? (this.redact(params.oldValue) as Record<string, unknown>) : null,
      newValue: params.newValue ? (this.redact(params.newValue) as Record<string, unknown>) : null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  }

  async logLogin(params: {
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
    await this.auditRepository.createLoginAudit({
      tenantId: params.tenantId,
      userId: params.userId ?? null,
      identifier: params.identifier,
      authMethod: params.authMethod,
      status: params.status,
      failureReason: params.failureReason ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      deviceInfo: params.deviceInfo
        ? (this.redact(params.deviceInfo) as Record<string, unknown>)
        : null,
    });
  }

  /**
   * Recursively redacts sensitive fields from an object or array.
   */
  private redact(data: unknown): unknown {
    if (data === null || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redact(item));
    }

    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (this.isSensitive(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = this.redact(value);
      }
    }
    return redacted;
  }

  private isSensitive(key: string): boolean {
    if (SENSITIVE_FIELDS.has(key)) return true;
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
  }
}
