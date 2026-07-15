import { Injectable } from '@nestjs/common';
import { NovedadType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  INovedadTypeConfigRepository,
  NovedadTypeConfigRecord,
  UpdateNovedadTypeConfigInput,
} from '../interfaces/novedad-type-config.interfaces';

const DEFAULT_CONFIGS: ReadonlyArray<{
  type: NovedadType;
  requiresSupervisorApproval: boolean;
  requiresSupportDocument: boolean;
  isPaidDefault: boolean;
  autoSolicitable: boolean;
}> = [
  {
    type: NovedadType.PERMISO_REMUNERADO,
    requiresSupervisorApproval: true,
    requiresSupportDocument: false,
    isPaidDefault: true,
    autoSolicitable: true,
  },
  {
    type: NovedadType.LICENCIA_NO_REMUNERADA,
    requiresSupervisorApproval: true,
    requiresSupportDocument: false,
    isPaidDefault: false,
    autoSolicitable: true,
  },
  {
    type: NovedadType.LICENCIA_LUTO,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
    autoSolicitable: true,
  },
  {
    type: NovedadType.LICENCIA_PATERNIDAD,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
    autoSolicitable: true,
  },
  {
    type: NovedadType.LICENCIA_MATERNIDAD,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
    autoSolicitable: true,
  },
  {
    type: NovedadType.CALAMIDAD_DOMESTICA,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
    autoSolicitable: false,
  },
  {
    type: NovedadType.DIA_FAMILIA,
    requiresSupervisorApproval: false,
    requiresSupportDocument: true,
    isPaidDefault: true,
    autoSolicitable: true,
  },
  {
    type: NovedadType.AUSENCIA_INJUSTIFICADA,
    requiresSupervisorApproval: false,
    requiresSupportDocument: false,
    isPaidDefault: false,
    autoSolicitable: false,
  },
];

@Injectable()
export class NovedadTypeConfigRepository implements INovedadTypeConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantAndType(
    tenantId: string,
    type: NovedadType,
  ): Promise<NovedadTypeConfigRecord | null> {
    const row = await this.prisma.novedadTypeConfig.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });
    return row ? this.mapRecord(row) : null;
  }

  async listByTenant(tenantId: string): Promise<NovedadTypeConfigRecord[]> {
    const rows = await this.prisma.novedadTypeConfig.findMany({
      where: { tenantId },
      orderBy: { type: 'asc' },
    });
    return rows.map((row) => this.mapRecord(row));
  }

  async upsert(
    tenantId: string,
    type: NovedadType,
    data: UpdateNovedadTypeConfigInput,
  ): Promise<NovedadTypeConfigRecord> {
    const row = await this.prisma.novedadTypeConfig.upsert({
      where: { tenantId_type: { tenantId, type } },
      update: {
        ...(data.requiresSupervisorApproval !== undefined
          ? { requiresSupervisorApproval: data.requiresSupervisorApproval }
          : {}),
        ...(data.requiresSupportDocument !== undefined
          ? { requiresSupportDocument: data.requiresSupportDocument }
          : {}),
        ...(data.isPaidDefault !== undefined ? { isPaidDefault: data.isPaidDefault } : {}),
        ...(data.autoSolicitable !== undefined ? { autoSolicitable: data.autoSolicitable } : {}),
      },
      create: {
        tenantId,
        type,
        requiresSupervisorApproval: data.requiresSupervisorApproval ?? false,
        requiresSupportDocument: data.requiresSupportDocument ?? false,
        isPaidDefault: data.isPaidDefault ?? true,
        autoSolicitable: data.autoSolicitable ?? true,
      },
    });
    return this.mapRecord(row);
  }

  async ensureDefaultsForTenant(tenantId: string): Promise<void> {
    for (const defaults of DEFAULT_CONFIGS) {
      await this.prisma.novedadTypeConfig.upsert({
        where: { tenantId_type: { tenantId, type: defaults.type } },
        update: {},
        create: { tenantId, ...defaults },
      });
    }
  }

  private mapRecord(row: {
    id: string;
    tenantId: string;
    type: NovedadType;
    requiresSupervisorApproval: boolean;
    requiresSupportDocument: boolean;
    isPaidDefault: boolean;
    autoSolicitable: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): NovedadTypeConfigRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      type: row.type,
      requiresSupervisorApproval: row.requiresSupervisorApproval,
      requiresSupportDocument: row.requiresSupportDocument,
      isPaidDefault: row.isPaidDefault,
      autoSolicitable: row.autoSolicitable,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
