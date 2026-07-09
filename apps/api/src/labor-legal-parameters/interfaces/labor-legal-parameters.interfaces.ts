import type { LaborLegalParameter } from '@prisma/client';

import type { LaborLegalParameterKey } from '../labor-legal-parameters.constants';

export interface CreateLegalParameterRecord {
  tenantId: string | null;
  tenantScope: string;
  key: string;
  value: number;
  validFrom: Date;
  validTo: Date | null;
  source: string | null;
}

export interface UpdateLegalParameterRecord {
  value?: number;
  validFrom?: Date;
  validTo?: Date | null;
  source?: string | null;
}

// ── Repository interface ──────────────────────────────────────────────────────

export interface ILaborLegalParametersRepository {
  findActiveAt(tenantScope: string, key: string, date: Date): Promise<LaborLegalParameter | null>;
  findOverlapping(
    tenantScope: string,
    key: string,
    validFrom: Date,
    validTo: Date | null,
    excludeId?: string,
  ): Promise<LaborLegalParameter[]>;
  findRowsForRange(
    tenantScopes: string[],
    keys: string[],
    from: Date,
    to: Date | null,
  ): Promise<LaborLegalParameter[]>;
  findCurrentByScopes(tenantScopes: string[], asOf: Date): Promise<LaborLegalParameter[]>;
  findHistory(tenantScope: string, key: string): Promise<LaborLegalParameter[]>;
  findById(id: string): Promise<LaborLegalParameter | null>;
  create(data: CreateLegalParameterRecord): Promise<LaborLegalParameter>;
  update(id: string, data: UpdateLegalParameterRecord): Promise<LaborLegalParameter>;
  softDelete(id: string): Promise<LaborLegalParameter>;
}

// ── Service-facing DTOs ────────────────────────────────────────────────────────

export interface CreateLegalParameterInput {
  key: string;
  value: number;
  validFrom: Date;
  validTo?: Date | null;
  source?: string | null;
  /** Target tenant for the override; omit/null for a global parameter. */
  tenantId?: string | null;
}

export interface UpdateLegalParameterInput {
  value?: number;
  validFrom?: Date;
  validTo?: Date | null;
  source?: string | null;
}

export interface LegalParameterActor {
  userId: string;
  tenantId: string;
  roleCode: string;
}

export interface ILaborLegalParametersService {
  getValueAt(key: LaborLegalParameterKey, date: Date, tenantId?: string | null): Promise<number>;
  listCurrent(tenantId: string | null, asOf?: Date): Promise<LaborLegalParameter[]>;
  listHistory(key: LaborLegalParameterKey, tenantId: string | null): Promise<LaborLegalParameter[]>;
  create(
    input: CreateLegalParameterInput,
    actor: LegalParameterActor,
  ): Promise<LaborLegalParameter>;
  update(
    id: string,
    input: UpdateLegalParameterInput,
    actor: LegalParameterActor,
  ): Promise<LaborLegalParameter>;
  softDelete(id: string, actor: LegalParameterActor): Promise<void>;
}
