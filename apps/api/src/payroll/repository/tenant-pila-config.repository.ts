import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  ITenantPilaConfigRepository,
  TenantPilaConfigRecord,
  UpsertTenantPilaConfigInput,
} from '../interfaces/tenant-pila-config.interfaces';

@Injectable()
export class TenantPilaConfigRepository implements ITenantPilaConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantId(tenantId: string): Promise<TenantPilaConfigRecord | null> {
    return this.prisma.tenantPilaConfig.findUnique({ where: { tenantId } });
  }

  async upsert(
    tenantId: string,
    data: UpsertTenantPilaConfigInput,
  ): Promise<TenantPilaConfigRecord> {
    return this.prisma.tenantPilaConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        documentType: data.documentType ?? 'NI',
        claseAportante: data.claseAportante ?? 'B',
        naturalezaJuridica: data.naturalezaJuridica ?? '2',
        formaPresentacion: data.formaPresentacion ?? 'U',
        tipoAportante: data.tipoAportante ?? '01',
        arlCode: data.arlCode ?? null,
        actividadEconomicaArl: data.actividadEconomicaArl ?? null,
        exemptFromHealthSenaIcbfLey1607: data.exemptFromHealthSenaIcbfLey1607 ?? false,
      },
      update: {
        ...(data.documentType !== undefined ? { documentType: data.documentType } : {}),
        ...(data.claseAportante !== undefined ? { claseAportante: data.claseAportante } : {}),
        ...(data.naturalezaJuridica !== undefined
          ? { naturalezaJuridica: data.naturalezaJuridica }
          : {}),
        ...(data.formaPresentacion !== undefined
          ? { formaPresentacion: data.formaPresentacion }
          : {}),
        ...(data.tipoAportante !== undefined ? { tipoAportante: data.tipoAportante } : {}),
        ...(data.arlCode !== undefined ? { arlCode: data.arlCode } : {}),
        ...(data.actividadEconomicaArl !== undefined
          ? { actividadEconomicaArl: data.actividadEconomicaArl }
          : {}),
        ...(data.exemptFromHealthSenaIcbfLey1607 !== undefined
          ? { exemptFromHealthSenaIcbfLey1607: data.exemptFromHealthSenaIcbfLey1607 }
          : {}),
      },
    });
  }
}
