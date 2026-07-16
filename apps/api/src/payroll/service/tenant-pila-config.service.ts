import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeCatalogType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  ITenantPilaConfigService,
  TenantPilaConfigRecord,
  UpsertTenantPilaConfigInput,
} from '../interfaces/tenant-pila-config.interfaces';
import { EmployeeCatalogRepository } from '../repository/employee-catalog.repository';
import { TenantPilaConfigRepository } from '../repository/tenant-pila-config.repository';
import {
  isValidActividadEconomicaArl,
  isValidArlCode,
  isValidClaseAportante,
  isValidFormaPresentacion,
  isValidNaturalezaJuridica,
  isValidPilaDocumentType,
  isValidTipoAportante,
} from '../utils/pila-master-data.util';

@Injectable()
export class TenantPilaConfigService implements ITenantPilaConfigService {
  constructor(
    private readonly repository: TenantPilaConfigRepository,
    private readonly employeeCatalogRepository: EmployeeCatalogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findByTenantId(tenantId: string): Promise<TenantPilaConfigRecord | null> {
    return this.repository.findByTenantId(tenantId);
  }

  async upsert(
    tenantId: string,
    data: UpsertTenantPilaConfigInput,
  ): Promise<TenantPilaConfigRecord> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant "${tenantId}" no encontrado`);
    }

    await this.assertValidInput(tenantId, data);
    return this.repository.upsert(tenantId, data);
  }

  private async assertValidInput(
    tenantId: string,
    data: UpsertTenantPilaConfigInput,
  ): Promise<void> {
    if (data.documentType !== undefined && !isValidPilaDocumentType(data.documentType)) {
      throw new BadRequestException('documentType PILA inválido (use NI, CC, CE, TI o PA)');
    }
    if (data.claseAportante !== undefined && !isValidClaseAportante(data.claseAportante)) {
      throw new BadRequestException('claseAportante inválida (A, B, C, D o I)');
    }
    if (
      data.naturalezaJuridica !== undefined &&
      !isValidNaturalezaJuridica(data.naturalezaJuridica)
    ) {
      throw new BadRequestException('naturalezaJuridica inválida (1–5)');
    }
    if (data.formaPresentacion !== undefined && !isValidFormaPresentacion(data.formaPresentacion)) {
      throw new BadRequestException('formaPresentacion inválida (U o S)');
    }
    if (data.tipoAportante !== undefined && !isValidTipoAportante(data.tipoAportante)) {
      throw new BadRequestException('tipoAportante inválido (2 dígitos)');
    }
    if (data.arlCode !== undefined && data.arlCode !== null) {
      if (!isValidArlCode(data.arlCode)) {
        throw new BadRequestException('arlCode inválido (1–10 caracteres alfanuméricos/guion)');
      }
      const arlOption = await this.employeeCatalogRepository.findActiveByTypeAndPilaCode(
        tenantId,
        EmployeeCatalogType.ARL,
        data.arlCode,
      );
      if (!arlOption) {
        throw new BadRequestException(
          `arlCode "${data.arlCode}" no existe en el catálogo ARL activo de este tenant`,
        );
      }
    }
    if (
      data.actividadEconomicaArl !== undefined &&
      data.actividadEconomicaArl !== null &&
      !isValidActividadEconomicaArl(data.actividadEconomicaArl)
    ) {
      throw new BadRequestException('actividadEconomicaArl debe tener exactamente 7 dígitos');
    }
  }
}
