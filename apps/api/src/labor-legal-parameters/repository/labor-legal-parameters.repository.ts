import { Injectable } from '@nestjs/common';
import type { LaborLegalParameter, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateLegalParameterRecord,
  ILaborLegalParametersRepository,
  UpdateLegalParameterRecord,
} from '../interfaces/labor-legal-parameters.interfaces';

@Injectable()
export class LaborLegalParametersRepository implements ILaborLegalParametersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveAt(
    tenantScope: string,
    key: string,
    date: Date,
  ): Promise<LaborLegalParameter | null> {
    return this.prisma.laborLegalParameter.findFirst({
      where: {
        tenantScope,
        key,
        deletedAt: null,
        validFrom: { lte: date },
        OR: [{ validTo: null }, { validTo: { gte: date } }],
      },
      orderBy: { validFrom: 'desc' },
    });
  }

  async findOverlapping(
    tenantScope: string,
    key: string,
    validFrom: Date,
    validTo: Date | null,
    excludeId?: string,
  ): Promise<LaborLegalParameter[]> {
    const where: Prisma.LaborLegalParameterWhereInput = {
      tenantScope,
      key,
      deletedAt: null,
      OR: [{ validTo: null }, { validTo: { gte: validFrom } }],
    };
    if (validTo) {
      where.validFrom = { lte: validTo };
    }
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return this.prisma.laborLegalParameter.findMany({ where });
  }

  async findRowsForRange(
    tenantScopes: string[],
    keys: string[],
    from: Date,
    to: Date | null,
  ): Promise<LaborLegalParameter[]> {
    const where: Prisma.LaborLegalParameterWhereInput = {
      tenantScope: { in: tenantScopes },
      key: { in: keys },
      deletedAt: null,
      OR: [{ validTo: null }, { validTo: { gte: from } }],
    };
    if (to) {
      where.validFrom = { lte: to };
    }
    return this.prisma.laborLegalParameter.findMany({ where, orderBy: { validFrom: 'asc' } });
  }

  async findCurrentByScopes(tenantScopes: string[], asOf: Date): Promise<LaborLegalParameter[]> {
    return this.prisma.laborLegalParameter.findMany({
      where: {
        tenantScope: { in: tenantScopes },
        deletedAt: null,
        OR: [
          // Vigencia activa a la fecha de consulta
          {
            validFrom: { lte: asOf },
            OR: [{ validTo: null }, { validTo: { gte: asOf } }],
          },
          // Vigencias futuras (admin debe ver lo que acaba de programar)
          { validFrom: { gt: asOf } },
        ],
      },
      orderBy: [{ key: 'asc' }, { validFrom: 'desc' }],
    });
  }

  async findHistory(tenantScope: string, key: string): Promise<LaborLegalParameter[]> {
    return this.prisma.laborLegalParameter.findMany({
      where: { tenantScope, key, deletedAt: null },
      orderBy: { validFrom: 'desc' },
    });
  }

  async findById(id: string): Promise<LaborLegalParameter | null> {
    return this.prisma.laborLegalParameter.findUnique({ where: { id } });
  }

  async create(data: CreateLegalParameterRecord): Promise<LaborLegalParameter> {
    return this.prisma.laborLegalParameter.create({
      data: {
        tenantId: data.tenantId,
        tenantScope: data.tenantScope,
        key: data.key,
        value: data.value,
        validFrom: data.validFrom,
        validTo: data.validTo,
        source: data.source,
      },
    });
  }

  async update(id: string, data: UpdateLegalParameterRecord): Promise<LaborLegalParameter> {
    return this.prisma.laborLegalParameter.update({
      where: { id },
      data: {
        ...(data.value !== undefined && { value: data.value }),
        ...(data.validFrom !== undefined && { validFrom: data.validFrom }),
        ...(data.validTo !== undefined && { validTo: data.validTo }),
        ...(data.source !== undefined && { source: data.source }),
      },
    });
  }

  async softDelete(id: string): Promise<LaborLegalParameter> {
    return this.prisma.laborLegalParameter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
