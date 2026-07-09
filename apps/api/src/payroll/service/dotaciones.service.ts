import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DotacionStatus } from '@prisma/client';

import type {
  BulkAssignByPositionData,
  BulkAssignResult,
  ComplianceReportRow,
  DotacionHistoryFilters,
  DotacionPage,
  DotacionPeriodFilters,
  DotacionWithSupplyItem,
  GenerateEntitlementsResult,
  MarkNotApplicableData,
  RegisterDotacionDeliveryData,
} from '../interfaces/dotaciones.interfaces';
import { SMLV_2025 } from '../payroll.constants';
import { DotacionesRepository } from '../repository/dotaciones.repository';

// Salary threshold for dotación eligibility: ≤ 2 SMLV (Art. 230 CST)
const DOTACION_SALARY_THRESHOLD = SMLV_2025 * 2;

@Injectable()
export class DotacionesService {
  constructor(private readonly repo: DotacionesRepository) {}

  async generatePeriodEntitlements(
    tenantId: string,
    period: string,
  ): Promise<GenerateEntitlementsResult> {
    this.validatePeriodFormat(period);

    const eligibleEmployees = await this.repo.findEligibleEmployees(
      tenantId,
      DOTACION_SALARY_THRESHOLD,
    );

    if (eligibleEmployees.length === 0) {
      return { processed: 0, created: 0, skipped: 0 };
    }

    const employeeIds = eligibleEmployees.map((e) => e.id);
    const existing = await this.repo.findExistingDeliveries(tenantId, period, employeeIds);
    const existingIds = new Set(existing.map((e) => e.employeeId));

    const toCreate = eligibleEmployees
      .filter((e) => !existingIds.has(e.id))
      .map((e) => ({
        tenantId,
        employeeId: e.id,
        period,
        status: DotacionStatus.PENDIENTE,
      }));

    const result = await this.repo.createManyDeliveries(toCreate);

    return {
      processed: eligibleEmployees.length,
      created: result.count,
      skipped: existingIds.size,
    };
  }

  async getAvailableSupplyItems(tenantId: string) {
    return this.repo.findAvailableSupplyItems(tenantId);
  }

  async findByPeriod(filters: DotacionPeriodFilters): Promise<DotacionPage> {
    return this.repo.findByPeriod(filters);
  }

  async findById(id: string, tenantId: string): Promise<DotacionWithSupplyItem> {
    const delivery = await this.repo.findById(id, tenantId);
    if (!delivery) {
      throw new NotFoundException(`Dotación ${id} no encontrada`);
    }
    return delivery;
  }

  async findEmployeeHistory(filters: DotacionHistoryFilters): Promise<DotacionPage> {
    return this.repo.findEmployeeHistory(filters);
  }

  async registerDelivery(
    data: RegisterDotacionDeliveryData,
    tenantId: string,
  ): Promise<DotacionWithSupplyItem> {
    const delivery = await this.repo.findById(data.dotacionDeliveryId, tenantId);
    if (!delivery) {
      throw new NotFoundException(`Dotación ${data.dotacionDeliveryId} no encontrada`);
    }

    if (delivery.status === DotacionStatus.ENTREGADA) {
      throw new ConflictException('Esta dotación ya fue entregada');
    }
    if (delivery.status === DotacionStatus.NO_APLICA) {
      throw new ConflictException('Esta dotación está marcada como No Aplica');
    }

    const supplyItem = await this.repo.findSupplyItemForDelivery(data.supplyItemId, tenantId);
    if (!supplyItem) {
      throw new NotFoundException(`Insumo ${data.supplyItemId} no encontrado`);
    }

    const currentStock = Number(supplyItem.stockActualBodega);
    if (currentStock < data.quantity) {
      throw new ConflictException(
        `Stock insuficiente para "${supplyItem.nombre}". Disponible: ${currentStock}, solicitado: ${data.quantity}`,
      );
    }

    return this.repo.registerDeliveryTransaction(
      data.dotacionDeliveryId,
      data.supplyItemId,
      data.quantity,
      data.deliveredAt,
      data.signedReceiptUrl,
      currentStock,
    );
  }

  async markNotApplicable(data: MarkNotApplicableData): Promise<DotacionWithSupplyItem> {
    const delivery = await this.repo.findById(data.id, data.tenantId);
    if (!delivery) {
      throw new NotFoundException(`Dotación ${data.id} no encontrada`);
    }

    if (delivery.status !== DotacionStatus.PENDIENTE) {
      throw new ConflictException(
        `Solo se puede marcar como No Aplica una dotación en estado PENDIENTE. Estado actual: ${delivery.status}`,
      );
    }

    return this.repo.markNotApplicable(data.id, data.tenantId, data.reason);
  }

  async bulkAssignByPosition(data: BulkAssignByPositionData): Promise<BulkAssignResult> {
    this.validatePeriodFormat(data.period);

    const supplyItem = await this.repo.findSupplyItemForDelivery(data.supplyItemId, data.tenantId);
    if (!supplyItem) {
      throw new NotFoundException(`Insumo ${data.supplyItemId} no encontrado`);
    }

    const deliveries = await this.repo.findPendingDeliveriesByPosition(
      data.tenantId,
      data.period,
      data.positionId,
      data.locationId,
    );

    if (deliveries.length === 0) {
      return { assigned: 0, skipped: 0, total: 0 };
    }

    const totalNeeded = deliveries.length * data.quantity;
    const currentStock = Number(supplyItem.stockActualBodega);

    if (currentStock < totalNeeded) {
      throw new ConflictException(
        `Stock insuficiente para "${supplyItem.nombre}". Necesario: ${totalNeeded}, disponible: ${currentStock}`,
      );
    }

    await this.repo.bulkRegisterDeliveriesTransaction(
      deliveries,
      data.supplyItemId,
      data.quantity,
      data.deliveredAt,
      currentStock,
      data.signedReceiptUrl,
    );

    return { assigned: deliveries.length, skipped: 0, total: deliveries.length };
  }

  async getComplianceReport(
    tenantId: string,
    period: string,
    locationId?: string,
  ): Promise<ComplianceReportRow[]> {
    this.validatePeriodFormat(period);
    return this.repo.findComplianceReport(tenantId, period, locationId);
  }

  private validatePeriodFormat(period: string): void {
    // Valid periods: YYYY-04, YYYY-08, YYYY-12
    const valid = /^\d{4}-(04|08|12)$/.test(period);
    if (!valid) {
      throw new ConflictException(
        `Período inválido "${period}". Use formato YYYY-04, YYYY-08 o YYYY-12`,
      );
    }
  }
}
