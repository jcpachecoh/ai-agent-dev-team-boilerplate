import { Injectable } from '@nestjs/common';
import { SupplierLogisticsStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  ISupplierLogisticsRepository,
  SupplierLogisticsInput,
  SupplierLogisticsWithRelations,
} from '../interfaces/supplier-logistics.interfaces';

const logisticsInclude = {
  receptionResponsibleUser: true,
  coverageLocations: {
    include: {
      location: true,
    },
  },
} as const;

@Injectable()
export class SupplierLogisticsRepository implements ISupplierLogisticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySupplierId(
    tenantId: string,
    supplierId: string,
  ): Promise<SupplierLogisticsWithRelations | null> {
    return this.prisma.supplierLogistics.findFirst({
      where: { tenantId, supplierId },
      include: logisticsInclude,
    });
  }

  async findUserInTenant(tenantId: string, userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });
  }

  async findLocationsInTenant(tenantId: string, locationIds: string[]) {
    if (locationIds.length === 0) return [];
    return this.prisma.location.findMany({
      where: {
        tenantId,
        id: { in: locationIds },
        deletedAt: null,
      },
    });
  }

  async upsert(params: {
    tenantId: string;
    supplierId: string;
    data: SupplierLogisticsInput;
    status: SupplierLogisticsStatus;
  }): Promise<SupplierLogisticsWithRelations> {
    const coverageLocationIds = params.data.coverageLocationIds ?? [];

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.supplierLogistics.findUnique({
        where: { supplierId: params.supplierId },
      });

      const payload = {
        deliveryMode: params.data.deliveryMode ?? null,
        deliveryPlace: params.data.deliveryPlace ?? null,
        deliveryPlaceCustom: params.data.deliveryPlaceCustom ?? null,
        deliveryDays: params.data.deliveryDays ?? [],
        leadTimeDays: params.data.leadTimeDays ?? null,
        timeWindowStart: params.data.timeWindowStart ?? null,
        timeWindowEnd: params.data.timeWindowEnd ?? null,
        receptionResponsibleUserId: params.data.receptionResponsibleUserId ?? null,
        transportType: params.data.transportType ?? null,
        requiresColdChain: params.data.requiresColdChain ?? false,
        transportTempMinC: params.data.transportTempMinC ?? null,
        transportTempMaxC: params.data.transportTempMaxC ?? null,
        transportCost: params.data.transportCost ?? null,
        transportCostCurrency: params.data.transportCostCurrency ?? null,
        minimumOrderQty: params.data.minimumOrderQty ?? null,
        minimumOrderUnit: params.data.minimumOrderUnit ?? null,
        status: params.status,
      };

      const logistics = existing
        ? await tx.supplierLogistics.update({
            where: { id: existing.id },
            data: payload,
          })
        : await tx.supplierLogistics.create({
            data: {
              tenantId: params.tenantId,
              supplierId: params.supplierId,
              ...payload,
            },
          });

      await tx.supplierLogisticsCoverage.deleteMany({
        where: { supplierLogisticsId: logistics.id },
      });

      if (coverageLocationIds.length > 0) {
        await tx.supplierLogisticsCoverage.createMany({
          data: coverageLocationIds.map((locationId) => ({
            supplierLogisticsId: logistics.id,
            locationId,
            tenantId: params.tenantId,
          })),
        });
      }

      const row = await tx.supplierLogistics.findUniqueOrThrow({
        where: { id: logistics.id },
        include: logisticsInclude,
      });

      return row;
    });
  }

  async findHistory(tenantId: string, logisticsId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'SupplierLogistics',
        entityId: logisticsId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { email: true },
        },
      },
    });
  }
}
