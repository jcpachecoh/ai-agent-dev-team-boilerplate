import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupplierLogisticsStatus } from '@prisma/client';

import { AuditService } from '../../audit/service/audit.service';
import { SupplierLogisticsRepository } from '../repository/supplier-logistics.repository';
import type {
  ISupplierLogisticsService,
  SupplierLogisticsHistoryEntry,
  SupplierLogisticsInput,
  SupplierLogisticsView,
  SupplierLogisticsWithRelations,
} from '../interfaces/supplier-logistics.interfaces';
import { validateSupplierLogisticsInput } from '../supplier-logistics.validation';

const TRACKED_FIELDS: Array<keyof SupplierLogisticsInput | 'status'> = [
  'deliveryMode',
  'deliveryPlace',
  'deliveryPlaceCustom',
  'deliveryDays',
  'leadTimeDays',
  'timeWindowStart',
  'timeWindowEnd',
  'receptionResponsibleUserId',
  'transportType',
  'requiresColdChain',
  'transportTempMinC',
  'transportTempMaxC',
  'transportCost',
  'transportCostCurrency',
  'minimumOrderQty',
  'minimumOrderUnit',
  'status',
];

@Injectable()
export class SupplierLogisticsService implements ISupplierLogisticsService {
  constructor(
    private readonly repository: SupplierLogisticsRepository,
    private readonly auditService: AuditService,
  ) {}

  async findBySupplierId(
    tenantId: string,
    supplierId: string,
  ): Promise<SupplierLogisticsView | null> {
    const row = await this.repository.findBySupplierId(tenantId, supplierId);
    if (!row) return null;
    return this.toView(row);
  }

  async upsert(params: {
    tenantId: string;
    supplierId: string;
    input: SupplierLogisticsInput;
    saveAsDraft: boolean;
    actorUserId?: string | null;
    previous?: SupplierLogisticsWithRelations | null;
  }): Promise<SupplierLogisticsView> {
    const validated = validateSupplierLogisticsInput(params.input, params.saveAsDraft);
    const status = params.saveAsDraft
      ? SupplierLogisticsStatus.DRAFT
      : SupplierLogisticsStatus.COMPLETE;

    if (validated.receptionResponsibleUserId) {
      const user = await this.repository.findUserInTenant(
        params.tenantId,
        validated.receptionResponsibleUserId,
      );
      if (!user) {
        throw new NotFoundException('Responsable de recepción no encontrado');
      }
    }

    const coverageLocationIds = validated.coverageLocationIds ?? [];
    if (coverageLocationIds.length > 0) {
      const locations = await this.repository.findLocationsInTenant(
        params.tenantId,
        coverageLocationIds,
      );
      if (locations.length !== coverageLocationIds.length) {
        throw new ForbiddenException('Una o más sedes no pertenecen al tenant');
      }
    }

    const previous =
      params.previous ??
      (await this.repository.findBySupplierId(params.tenantId, params.supplierId));

    const saved = await this.repository.upsert({
      tenantId: params.tenantId,
      supplierId: params.supplierId,
      data: validated,
      status,
    });

    if (status === SupplierLogisticsStatus.COMPLETE && previous) {
      const changes = this.buildChanges(previous, saved, coverageLocationIds);
      if (changes.length > 0) {
        await this.auditService.log({
          tenantId: params.tenantId,
          action: 'UPDATE',
          entityType: 'SupplierLogistics',
          entityId: saved.id,
          actorUserId: params.actorUserId ?? null,
          payload: {
            supplierId: params.supplierId,
            changes,
          },
        });
      }
    } else if (status === SupplierLogisticsStatus.COMPLETE && !previous) {
      await this.auditService.log({
        tenantId: params.tenantId,
        action: 'CREATE',
        entityType: 'SupplierLogistics',
        entityId: saved.id,
        actorUserId: params.actorUserId ?? null,
        payload: {
          supplierId: params.supplierId,
          status,
        },
      });
    }

    return this.toView(saved);
  }

  async getHistory(tenantId: string, supplierId: string): Promise<SupplierLogisticsHistoryEntry[]> {
    const logistics = await this.repository.findBySupplierId(tenantId, supplierId);
    if (!logistics) return [];

    const rows = await this.repository.findHistory(tenantId, logistics.id);
    return rows.map((row) => {
      const payload = (row.payload ?? {}) as {
        changes?: Array<{ field: string; old: unknown; new: unknown }>;
      };

      return {
        id: row.id,
        action: row.action,
        actorUserId: row.actorUserId,
        actorEmail: row.actor?.email ?? null,
        createdAt: row.createdAt,
        changes: payload.changes ?? [],
      };
    });
  }

  private toView(row: SupplierLogisticsWithRelations): SupplierLogisticsView {
    const user = row.receptionResponsibleUser;
    const receptionResponsibleStale = Boolean(
      row.receptionResponsibleUserId && (!user || user.deletedAt !== null || !user.isActive),
    );

    return {
      id: row.id,
      tenantId: row.tenantId,
      supplierId: row.supplierId,
      deliveryMode: row.deliveryMode,
      deliveryPlace: row.deliveryPlace,
      deliveryPlaceCustom: row.deliveryPlaceCustom,
      deliveryDays: row.deliveryDays,
      leadTimeDays: row.leadTimeDays,
      timeWindowStart: row.timeWindowStart,
      timeWindowEnd: row.timeWindowEnd,
      receptionResponsibleUserId: row.receptionResponsibleUserId,
      receptionResponsible: user
        ? {
            id: user.id,
            email: user.email,
            name: null,
          }
        : null,
      receptionResponsibleStale,
      transportType: row.transportType,
      requiresColdChain: row.requiresColdChain,
      transportTempMinC: row.transportTempMinC ? Number(row.transportTempMinC) : null,
      transportTempMaxC: row.transportTempMaxC ? Number(row.transportTempMaxC) : null,
      transportCost: row.transportCost ? Number(row.transportCost) : null,
      transportCostCurrency: row.transportCostCurrency,
      minimumOrderQty: row.minimumOrderQty ? Number(row.minimumOrderQty) : null,
      minimumOrderUnit: row.minimumOrderUnit,
      coverageLocations: row.coverageLocations.map((item) => ({
        id: item.location.id,
        name: item.location.name,
      })),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private buildChanges(
    previous: SupplierLogisticsWithRelations,
    current: SupplierLogisticsWithRelations,
    coverageLocationIds: string[],
  ): Array<{ field: string; old: unknown; new: unknown }> {
    const changes: Array<{ field: string; old: unknown; new: unknown }> = [];
    const previousSnapshot = this.snapshot(previous);
    const currentSnapshot = this.snapshot(current);

    for (const field of TRACKED_FIELDS) {
      const oldValue = previousSnapshot[field];
      const newValue = currentSnapshot[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, old: oldValue, new: newValue });
      }
    }

    const oldCoverage = previous.coverageLocations.map((item) => item.locationId).sort();
    const newCoverage = [...coverageLocationIds].sort();
    if (JSON.stringify(oldCoverage) !== JSON.stringify(newCoverage)) {
      changes.push({ field: 'coverageLocationIds', old: oldCoverage, new: newCoverage });
    }

    return changes;
  }

  private snapshot(row: SupplierLogisticsWithRelations): Record<string, unknown> {
    return {
      deliveryMode: row.deliveryMode,
      deliveryPlace: row.deliveryPlace,
      deliveryPlaceCustom: row.deliveryPlaceCustom,
      deliveryDays: row.deliveryDays,
      leadTimeDays: row.leadTimeDays,
      timeWindowStart: row.timeWindowStart,
      timeWindowEnd: row.timeWindowEnd,
      receptionResponsibleUserId: row.receptionResponsibleUserId,
      transportType: row.transportType,
      requiresColdChain: row.requiresColdChain,
      transportTempMinC: row.transportTempMinC ? Number(row.transportTempMinC) : null,
      transportTempMaxC: row.transportTempMaxC ? Number(row.transportTempMaxC) : null,
      transportCost: row.transportCost ? Number(row.transportCost) : null,
      transportCostCurrency: row.transportCostCurrency,
      minimumOrderQty: row.minimumOrderQty ? Number(row.minimumOrderQty) : null,
      minimumOrderUnit: row.minimumOrderUnit,
      status: row.status,
    };
  }
}
