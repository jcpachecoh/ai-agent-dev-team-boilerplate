export interface TenantPilaConfigRecord {
  id: string;
  tenantId: string;
  documentType: string;
  claseAportante: string;
  naturalezaJuridica: string;
  formaPresentacion: string;
  tipoAportante: string;
  arlCode: string | null;
  actividadEconomicaArl: string | null;
  exemptFromHealthSenaIcbfLey1607: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertTenantPilaConfigInput {
  documentType?: string;
  claseAportante?: string;
  naturalezaJuridica?: string;
  formaPresentacion?: string;
  tipoAportante?: string;
  arlCode?: string | null;
  actividadEconomicaArl?: string | null;
  exemptFromHealthSenaIcbfLey1607?: boolean;
}

export interface ITenantPilaConfigRepository {
  findByTenantId(tenantId: string): Promise<TenantPilaConfigRecord | null>;
  upsert(tenantId: string, data: UpsertTenantPilaConfigInput): Promise<TenantPilaConfigRecord>;
}

export interface ITenantPilaConfigService {
  findByTenantId(tenantId: string): Promise<TenantPilaConfigRecord | null>;
  upsert(tenantId: string, data: UpsertTenantPilaConfigInput): Promise<TenantPilaConfigRecord>;
}
