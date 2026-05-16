export interface IAuditRepository {
  create(data: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string | null;
    payload?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void>;
}

export interface IAuditService {
  log(params: {
    action: string;
    entity: string;
    entityId: string;
    userId?: string;
    payload?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
}
