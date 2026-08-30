import { Injectable } from '@nestjs/common';
import { Prisma, type ProductionIncident } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateIncidentInput,
  IIncidentRepository,
  ListIncidentsFilters,
  ResolveIncidentInput,
} from '../interfaces/plant.interfaces';

export const DEFAULT_INCIDENT_LIST_LIMIT = 50;

@Injectable()
export class IncidentRepository implements IIncidentRepository {
  constructor(private readonly prisma: PrismaService) {}

  createIncident(
    tenantId: string,
    operatorUserId: string,
    input: CreateIncidentInput,
  ): Promise<ProductionIncident> {
    return this.prisma.productionIncident.create({
      data: {
        tenantId,
        operatorUserId,
        workStationId: input.workStationId,
        locationId: input.locationId ?? null,
        executionId: input.executionId ?? null,
        orderId: input.orderId ?? null,
        type: input.type,
        noveltyType: input.noveltyType ?? null,
        severity: input.severity,
        description: input.description,
        requiresPause: input.requiresPause ?? false,
        photoUrl: input.photoUrl ?? null,
      },
    });
  }

  findIncidents(
    tenantId: string,
    filters: ListIncidentsFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<ProductionIncident[]> {
    const where: Prisma.ProductionIncidentWhereInput = {
      tenantId,
      orderId: filters.orderId,
      workStationId: filters.workStationId,
      locationId: filters.locationId,
      type: filters.type,
      severity: filters.severity,
    };

    if (filters.resolved === true) {
      where.resolvedAt = { not: null };
    } else if (filters.resolved === false) {
      where.resolvedAt = null;
    }

    return this.prisma.productionIncident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pagination?.limit ?? DEFAULT_INCIDENT_LIST_LIMIT,
      skip: pagination?.offset ?? 0,
    });
  }

  findIncidentById(tenantId: string, id: string): Promise<ProductionIncident | null> {
    return this.prisma.productionIncident.findFirst({
      where: { id, tenantId },
    });
  }

  findLocationById(tenantId: string, locationId: string): Promise<{ id: string } | null> {
    return this.prisma.location.findFirst({
      where: { id: locationId, tenantId, deletedAt: null },
      select: { id: true },
    });
  }

  async resolveIncident(
    tenantId: string,
    id: string,
    resolvedBy: string,
    input: ResolveIncidentInput,
  ): Promise<ProductionIncident> {
    const result = await this.prisma.productionIncident.updateMany({
      where: { id, tenantId },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
        resolution: input.resolution,
      },
    });

    if (result.count !== 1) {
      throw new Error(`ProductionIncident ${id} not found for tenant ${tenantId}`);
    }

    const incident = await this.prisma.productionIncident.findFirst({
      where: { id, tenantId },
    });

    if (!incident) {
      throw new Error(`ProductionIncident ${id} not found for tenant ${tenantId}`);
    }

    return incident;
  }
}
