import { Injectable } from '@nestjs/common';
import type { Tenant as PrismaTenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ITenantRepository, Tenant, UpdateTenantData } from '../interfaces/tenant.interfaces';

function toTenant(row: PrismaTenant): Tenant {
  return {
    id: row.id,
    name: row.name,
    nit: row.nit,
    legalName: row.legalName,
    tradeName: row.tradeName,
    legalRepresentativeName: row.legalRepresentativeName,
    legalRepresentativeDocumentType: row.legalRepresentativeDocumentType,
    legalRepresentativeDocumentNumber: row.legalRepresentativeDocumentNumber,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    department: row.department,
    country: row.country,
    taxRegime: row.taxRegime,
    logoUrl: row.logoUrl,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });

    return row ? toTenant(row) : null;
  }

  async findAll(): Promise<Tenant[]> {
    const rows = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return rows.map(toTenant);
  }

  async update(id: string, data: UpdateTenantData): Promise<Tenant | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const row = await this.prisma.tenant.update({
      where: { id },
      data: {
        tradeName: data.tradeName,
        nit: data.nit,
        email: data.email,
        phone: data.phone,
        address: data.address,
        logoUrl: data.logoUrl,
      },
    });

    return toTenant(row);
  }
}
