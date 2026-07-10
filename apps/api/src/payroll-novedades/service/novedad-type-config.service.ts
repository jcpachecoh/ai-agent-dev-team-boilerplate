import { BadRequestException, Injectable } from '@nestjs/common';
import { NovedadType } from '@prisma/client';

import type {
  INovedadTypeConfigService,
  NovedadTypeConfigRecord,
  UpdateNovedadTypeConfigInput,
} from '../interfaces/novedad-type-config.interfaces';
import { NovedadTypeConfigRepository } from '../repository/novedad-type-config.repository';

const ALL_NOVEDAD_TYPES = new Set<string>(Object.values(NovedadType));

@Injectable()
export class NovedadTypeConfigService implements INovedadTypeConfigService {
  constructor(private readonly repository: NovedadTypeConfigRepository) {}

  async getConfigForTenant(tenantId: string, type: NovedadType): Promise<NovedadTypeConfigRecord> {
    await this.ensureDefaults(tenantId);
    const config = await this.repository.findByTenantAndType(tenantId, type);
    if (!config) {
      throw new BadRequestException(`Configuración no encontrada para tipo ${type}`);
    }
    return config;
  }

  async listConfigs(tenantId: string): Promise<NovedadTypeConfigRecord[]> {
    await this.ensureDefaults(tenantId);
    return this.repository.listByTenant(tenantId);
  }

  async updateConfig(
    tenantId: string,
    type: NovedadType,
    input: UpdateNovedadTypeConfigInput,
  ): Promise<NovedadTypeConfigRecord> {
    if (!ALL_NOVEDAD_TYPES.has(type)) {
      throw new BadRequestException(`Tipo de novedad inválido: ${type}`);
    }
    await this.ensureDefaults(tenantId);
    return this.repository.upsert(tenantId, type, input);
  }

  async ensureDefaults(tenantId: string): Promise<void> {
    await this.repository.ensureDefaultsForTenant(tenantId);
  }
}
