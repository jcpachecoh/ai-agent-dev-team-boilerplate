import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LaborLegalParameter } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { LegalParameterSnapshot } from './legal-parameter-snapshot';
import { AuditService } from '../../audit/service/audit.service';
import { SYSTEM_ADMIN_ROLES } from '../../common/config/rbac.config';
import type {
  CreateLegalParameterInput,
  ILaborLegalParametersService,
  LegalParameterActor,
  UpdateLegalParameterInput,
} from '../interfaces/labor-legal-parameters.interfaces';
import {
  GLOBAL_TENANT_SCOPE,
  isLaborLegalParameterKey,
  toTenantScope,
  type LaborLegalParameterKey,
} from '../labor-legal-parameters.constants';
import { LaborLegalParametersRepository } from '../repository/labor-legal-parameters.repository';

@Injectable()
export class LaborLegalParametersService implements ILaborLegalParametersService {
  constructor(
    private readonly repository: LaborLegalParametersRepository,
    private readonly auditService: AuditService,
  ) {}

  // ── Read ─────────────────────────────────────────────────────────────────────

  async getValueAt(
    key: LaborLegalParameterKey,
    date: Date,
    tenantId?: string | null,
  ): Promise<number> {
    if (tenantId) {
      const override = await this.repository.findActiveAt(tenantId, key, date);
      if (override) {
        return Number(override.value);
      }
    }

    const global = await this.repository.findActiveAt(GLOBAL_TENANT_SCOPE, key, date);
    if (global) {
      return Number(global.value);
    }

    throw new NotFoundException(
      `No existe un valor vigente para el parámetro legal "${key}" en la fecha ${date.toISOString().slice(0, 10)}`,
    );
  }

  /**
   * Preloads every row of `keys` overlapping [from, to] for tenantId + global scope in
   * a single pair of queries, returning a synchronous resolver. Use this instead of
   * repeated getValueAt() calls when resolving values for many employees/days in one run
   * (e.g. a payroll period or an attendance report range).
   */
  async preload(
    keys: LaborLegalParameterKey[],
    from: Date,
    to: Date | null,
    tenantId?: string | null,
  ): Promise<LegalParameterSnapshot> {
    const scopes = tenantId ? [tenantId, GLOBAL_TENANT_SCOPE] : [GLOBAL_TENANT_SCOPE];
    const rows = await this.repository.findRowsForRange(scopes, keys, from, to);
    return new LegalParameterSnapshot(rows, tenantId ?? null);
  }

  async listCurrent(
    tenantId: string | null,
    asOf: Date = new Date(),
  ): Promise<LaborLegalParameter[]> {
    const scopes = tenantId ? [tenantId, GLOBAL_TENANT_SCOPE] : [GLOBAL_TENANT_SCOPE];
    const rows = await this.repository.findCurrentByScopes(scopes, asOf);

    // One row per key — tenant override wins over global (rows are ordered [key asc, validFrom desc]).
    const byKey = new Map<string, LaborLegalParameter>();
    for (const row of rows) {
      const existing = byKey.get(row.key);
      if (!existing) {
        byKey.set(row.key, row);
        continue;
      }
      const rowIsTenantOverride = row.tenantId !== null;
      const existingIsTenantOverride = existing.tenantId !== null;
      if (rowIsTenantOverride && !existingIsTenantOverride) {
        byKey.set(row.key, row);
      }
    }
    return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  async listHistory(
    key: LaborLegalParameterKey,
    tenantId: string | null,
  ): Promise<LaborLegalParameter[]> {
    this.assertValidKey(key);
    return this.repository.findHistory(toTenantScope(tenantId), key);
  }

  // ── Write ────────────────────────────────────────────────────────────────────

  async create(
    input: CreateLegalParameterInput,
    actor: LegalParameterActor,
  ): Promise<LaborLegalParameter> {
    this.assertValidKey(input.key);
    this.assertValidRange(input.validFrom, input.validTo ?? null);
    const targetTenantId = this.assertWritableScope(input.tenantId ?? null, actor);
    const tenantScope = toTenantScope(targetTenantId);

    await this.assertNoOverlap(tenantScope, input.key, input.validFrom, input.validTo ?? null);

    try {
      const created = await this.repository.create({
        tenantId: targetTenantId,
        tenantScope,
        key: input.key,
        value: input.value,
        validFrom: input.validFrom,
        validTo: input.validTo ?? null,
        source: input.source ?? null,
      });

      await this.auditService.log({
        tenantId: actor.tenantId,
        action: 'CREATE',
        entityType: 'LaborLegalParameter',
        entityId: created.id,
        actorUserId: actor.userId,
        newValue: this.toAuditValue(created),
      });

      return created;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe una vigencia de "${input.key}" que inicia en esa misma fecha para este scope`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateLegalParameterInput,
    actor: LegalParameterActor,
  ): Promise<LaborLegalParameter> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Parámetro legal ${id} no encontrado`);
    }
    if (existing.deletedAt) {
      throw new BadRequestException('No se puede modificar un parámetro legal eliminado');
    }
    this.assertWritableScope(existing.tenantId, actor);

    const nextValidFrom = input.validFrom ?? existing.validFrom;
    const nextValidTo = input.validTo !== undefined ? input.validTo : existing.validTo;
    this.assertValidRange(nextValidFrom, nextValidTo);

    if (input.validFrom !== undefined || input.validTo !== undefined) {
      await this.assertNoOverlap(
        existing.tenantScope,
        existing.key,
        nextValidFrom,
        nextValidTo,
        id,
      );
    }

    try {
      const updated = await this.repository.update(id, {
        value: input.value,
        validFrom: input.validFrom,
        validTo: input.validTo,
        source: input.source,
      });

      await this.auditService.log({
        tenantId: actor.tenantId,
        action: 'UPDATE',
        entityType: 'LaborLegalParameter',
        entityId: id,
        actorUserId: actor.userId,
        oldValue: this.toAuditValue(existing),
        newValue: this.toAuditValue(updated),
      });

      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe una vigencia de "${existing.key}" que inicia en esa misma fecha para este scope`,
        );
      }
      throw error;
    }
  }

  async softDelete(id: string, actor: LegalParameterActor): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Parámetro legal ${id} no encontrado`);
    }
    if (existing.deletedAt) {
      throw new BadRequestException('El parámetro legal ya está eliminado');
    }
    this.assertWritableScope(existing.tenantId, actor);

    await this.repository.softDelete(id);

    await this.auditService.log({
      tenantId: actor.tenantId,
      action: 'DELETE',
      entityType: 'LaborLegalParameter',
      entityId: id,
      actorUserId: actor.userId,
      oldValue: this.toAuditValue(existing),
    });
  }

  // ── Validation helpers ──────────────────────────────────────────────────────

  private assertValidKey(key: string): asserts key is LaborLegalParameterKey {
    if (!isLaborLegalParameterKey(key)) {
      throw new BadRequestException(`Key de parámetro legal inválida: "${key}"`);
    }
  }

  private assertValidRange(validFrom: Date, validTo: Date | null): void {
    if (!validFrom || Number.isNaN(validFrom.getTime())) {
      throw new BadRequestException('validFrom es requerido y debe ser una fecha válida');
    }
    if (validTo && validTo < validFrom) {
      throw new BadRequestException('validTo no puede ser anterior a validFrom');
    }
  }

  /**
   * Enforces tenant isolation for writes:
   *  - Global parameters (tenantId null) affect every tenant on the platform, so only
   *    SUPER_ADMIN may create/modify them — OWNER is scoped to their own tenant.
   *  - Tenant-scoped overrides may only target the actor's own tenant.
   * Returns the validated target tenantId (null = global).
   */
  private assertWritableScope(
    targetTenantId: string | null,
    actor: LegalParameterActor,
  ): string | null {
    if (!targetTenantId) {
      if (actor.roleCode !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Solo SUPER_ADMIN puede crear o modificar parámetros legales globales',
        );
      }
      return null;
    }
    if (targetTenantId !== actor.tenantId) {
      throw new ForbiddenException('No puede administrar parámetros legales de otro tenant');
    }
    if (!SYSTEM_ADMIN_ROLES.includes(actor.roleCode as (typeof SYSTEM_ADMIN_ROLES)[number])) {
      throw new ForbiddenException('No tiene permisos para administrar parámetros legales');
    }
    return targetTenantId;
  }

  private async assertNoOverlap(
    tenantScope: string,
    key: string,
    validFrom: Date,
    validTo: Date | null,
    excludeId?: string,
  ): Promise<void> {
    const overlapping = await this.repository.findOverlapping(
      tenantScope,
      key,
      validFrom,
      validTo,
      excludeId,
    );
    if (overlapping.length > 0) {
      throw new ConflictException(
        `La vigencia solicitada para "${key}" se traslapa con una vigencia existente`,
      );
    }
  }

  private toAuditValue(row: LaborLegalParameter): Record<string, unknown> {
    return {
      key: row.key,
      value: row.value.toString(),
      tenantId: row.tenantId,
      validFrom: row.validFrom.toISOString(),
      validTo: row.validTo ? row.validTo.toISOString() : null,
      source: row.source,
    };
  }
}
