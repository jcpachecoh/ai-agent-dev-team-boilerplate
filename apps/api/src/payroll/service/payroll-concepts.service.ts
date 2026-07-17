import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { PayrollConcept } from '@prisma/client';

import type { PayrollConceptUsageStatus } from '../interfaces/payroll-concepts-usage.interfaces';
import type {
  EffectivePayrollConcept,
  IPayrollConceptsService,
} from '../interfaces/payroll-concepts.interfaces';
import {
  GLOBAL_TENANT_SCOPE,
  isPayrollConceptCode,
  toTenantScope,
} from '../payroll-concepts.constants';
import { PayrollConceptsRepository } from '../repository/payroll-concepts.repository';

@Injectable()
export class PayrollConceptsService implements IPayrollConceptsService {
  constructor(private readonly repository: PayrollConceptsRepository) {}

  /**
   * Fila GLOBAL activa por code.
   * Soft-deleted o ausente → NotFoundException (no se resuelve como activo).
   */
  async findGlobalByCode(code: string): Promise<PayrollConcept> {
    this.assertKnownCode(code);
    const global = await this.repository.findActiveByScopeAndCode(GLOBAL_TENANT_SCOPE, code);
    if (!global) {
      const includingDeleted = await this.repository.findByScopeAndCodeIncludingDeleted(
        GLOBAL_TENANT_SCOPE,
        code,
      );
      if (includingDeleted?.deletedAt) {
        throw new NotFoundException(
          `El concepto de nómina "${code}" está inactivo (GLOBAL soft-deleted)`,
        );
      }
      throw new NotFoundException(`No existe el concepto de nómina GLOBAL "${code}"`);
    }
    return global;
  }

  /**
   * Override tenant activo (deletedAt null). Null si no hay override o está inactivo.
   * No crea overrides — solo lectura (PR1 sin CRUD).
   */
  async findTenantOverrideByCode(tenantId: string, code: string): Promise<PayrollConcept | null> {
    this.assertKnownCode(code);
    if (!tenantId.trim()) {
      throw new BadRequestException('tenantId es requerido para consultar override de concepto');
    }
    return this.repository.findActiveByScopeAndCode(toTenantScope(tenantId), code);
  }

  /**
   * Concepto efectivo para un tenant:
   * 1) GLOBAL activo obligatorio (existencia + lineNature).
   * 2) Si hay override tenant activo, solo sustituye displayName.
   * Override inactivo o ausente → etiqueta GLOBAL.
   * GLOBAL inactivo → error (override no “revive” el concepto).
   */
  async resolveEffective(
    tenantId: string | null | undefined,
    code: string,
  ): Promise<EffectivePayrollConcept> {
    const global = await this.findGlobalByCode(code);

    if (tenantId?.trim()) {
      const override = await this.repository.findActiveByScopeAndCode(
        toTenantScope(tenantId),
        code,
      );
      if (override) {
        this.assertOverrideNatureMatchesGlobal(override, global);
        return {
          id: global.id,
          code: global.code,
          displayName: override.displayName,
          lineNature: global.lineNature,
          isTenantOverride: true,
          overrideId: override.id,
        };
      }
    }

    return {
      id: global.id,
      code: global.code,
      displayName: global.displayName,
      lineNature: global.lineNature,
      isTenantOverride: false,
      overrideId: null,
    };
  }

  /**
   * Clasifica un snapshot SettlementLine.code/name vs catálogo (reporte OS-612).
   * No lanza por codes desconocidos — eso es UNCATALOGED.
   */
  async classifyLineSnapshot(
    tenantId: string,
    code: string,
    name: string,
  ): Promise<{ status: PayrollConceptUsageStatus; catalogDisplayName: string | null }> {
    const global = await this.repository.findByScopeAndCodeIncludingDeleted(
      GLOBAL_TENANT_SCOPE,
      code,
    );
    if (!global) {
      return { status: 'UNCATALOGED', catalogDisplayName: null };
    }
    if (global.deletedAt) {
      return { status: 'INACTIVE', catalogDisplayName: global.displayName };
    }

    let catalogDisplayName = global.displayName;
    if (tenantId.trim()) {
      const override = await this.repository.findActiveByScopeAndCode(
        toTenantScope(tenantId),
        code,
      );
      if (override) {
        catalogDisplayName = override.displayName;
      }
    }

    if (name !== catalogDisplayName) {
      return { status: 'NAME_MISMATCH', catalogDisplayName };
    }
    return { status: 'CATALOGED', catalogDisplayName };
  }

  private assertKnownCode(code: string): void {
    if (!code.trim()) {
      throw new BadRequestException('code de concepto es requerido');
    }
    if (!isPayrollConceptCode(code)) {
      throw new NotFoundException(`Código de concepto desconocido: "${code}"`);
    }
  }

  /**
   * Nature/domain deben provenir del GLOBAL. Si un override tiene lineNature distinto,
   * se trata como corrupción de datos (no se permite “override de nature”).
   */
  private assertOverrideNatureMatchesGlobal(
    override: PayrollConcept,
    global: PayrollConcept,
  ): void {
    if (override.lineNature !== global.lineNature) {
      throw new BadRequestException(
        `Override tenant del concepto "${global.code}" tiene lineNature="${override.lineNature}" ` +
          `distinto del GLOBAL "${global.lineNature}". Solo displayName puede diferir.`,
      );
    }
    if (override.code !== global.code) {
      throw new BadRequestException('Override de concepto con code inconsistente');
    }
  }
}
