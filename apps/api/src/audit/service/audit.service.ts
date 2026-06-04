import { Injectable } from '@nestjs/common';
import type { IAuditService } from '../interfaces/audit.interfaces';
import { AuditRepository } from '../repository/audit.repository';

@Injectable()
export class AuditService implements IAuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async log(params: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    payload?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.auditRepository.create({
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      userId: params.userId ?? null,
      payload: params.payload,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
  }
}
