import { NovedadType } from '@prisma/client';

export const NOVEDAD_TYPE_CONFIG_REPOSITORY = Symbol('NOVEDAD_TYPE_CONFIG_REPOSITORY');

export interface NovedadTypeConfigRecord {
  id: string;
  tenantId: string;
  type: NovedadType;
  requiresSupervisorApproval: boolean;
  requiresSupportDocument: boolean;
  isPaidDefault: boolean;
  autoSolicitable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateNovedadTypeConfigInput {
  requiresSupervisorApproval?: boolean;
  requiresSupportDocument?: boolean;
  isPaidDefault?: boolean;
  autoSolicitable?: boolean;
}

export interface INovedadTypeConfigRepository {
  findByTenantAndType(tenantId: string, type: NovedadType): Promise<NovedadTypeConfigRecord | null>;
  listByTenant(tenantId: string): Promise<NovedadTypeConfigRecord[]>;
  upsert(
    tenantId: string,
    type: NovedadType,
    data: UpdateNovedadTypeConfigInput,
  ): Promise<NovedadTypeConfigRecord>;
}

export interface INovedadTypeConfigService {
  getConfigForTenant(tenantId: string, type: NovedadType): Promise<NovedadTypeConfigRecord>;
  listConfigs(tenantId: string): Promise<NovedadTypeConfigRecord[]>;
  updateConfig(
    tenantId: string,
    type: NovedadType,
    input: UpdateNovedadTypeConfigInput,
  ): Promise<NovedadTypeConfigRecord>;
  ensureDefaults(tenantId: string): Promise<void>;
}
