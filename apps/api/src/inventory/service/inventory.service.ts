import { Injectable, NotFoundException } from '@nestjs/common';
import { decimalToNumber } from '../../common/utils/decimal.util';
import type {
  InventoryAlertDto,
  InventoryAlertSummaryDto,
  InventoryResolvedAlertPageDto,
} from '../controller/dto/inventory-alert.dto';
import type { InventoryDashboardDto } from '../controller/dto/inventory-dashboard.dto';
import type { InventoryReportDto } from '../controller/dto/inventory-report.dto';
import type { IInventoryService } from '../interfaces/inventory.interfaces';
import { InventoryRepository } from '../repository/inventory.repository';

const ACCENTS = ['teal', 'amber', 'rose', 'violet', 'sky'] as const;

@Injectable()
export class InventoryService implements IInventoryService {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async getDashboard(tenantId: string): Promise<InventoryDashboardDto> {
    const items = await this.inventoryRepository.findActiveForDashboard(tenantId);

    const enriched = items.map((item) => ({
      item,
      stock: decimalToNumber(item.stockActualBodega),
      cpp: decimalToNumber(item.costoPromedioPonderado),
      min: decimalToNumber(item.stockMinimoBodega),
    }));

    const totalValue = enriched.reduce((sum, row) => sum + row.cpp * row.stock, 0);
    const lowStockCount = enriched.filter((row) => row.stock < row.min && row.min > 0).length;

    const topProducts = [...enriched]
      .sort((a, b) => b.cpp - a.cpp)
      .slice(0, 5)
      .map((row, index) => ({
        label: row.item.nombre,
        value: row.cpp,
        progress: Math.min(100, Math.round((row.cpp / Math.max(1, enriched[0]?.cpp ?? 1)) * 100)),
        accent: ACCENTS[index % ACCENTS.length],
      }));

    const byCategory = new Map<string, number>();
    for (const row of enriched) {
      const key = row.item.categoria.nombre;
      byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
    }

    const stockBySite = Array.from(byCategory.entries())
      .slice(0, 4)
      .map(([label, count], index) => ({
        label,
        value: `${count} ítems`,
        progress: Math.min(100, count * 20),
        accent: ACCENTS[index % ACCENTS.length],
      }));

    return {
      totalItems: items.length,
      totalValue,
      lowStockCount,
      movementsToday: 0,
      topProducts,
      stockBySite,
      historyOccupancy: [],
    };
  }

  async getAlerts(tenantId: string): Promise<InventoryAlertDto[]> {
    const [items, resolvedPage] = await Promise.all([
      this.inventoryRepository.findActiveForAlerts(tenantId),
      this.inventoryRepository.findResolvedAlerts(tenantId, undefined, 1000),
    ]);

    // Build a set of supplyItemIds that have been resolved today so we can
    // suppress the active alert. An alert reappears if the stock doesn't recover
    // (intentional — the item is still below minimum), but the user explicitly
    // dismissed it; showing it again on the same day would be noisy.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const resolvedTodayIds = new Set(
      resolvedPage.edges.filter((r) => r.resolvedAt >= startOfDay).map((r) => r.supplyItemId),
    );

    const alerts: InventoryAlertDto[] = [];

    for (const item of items) {
      const currentStock = decimalToNumber(item.stockActualBodega);
      const threshold = decimalToNumber(item.stockMinimoBodega);
      if (threshold <= 0 || currentStock >= threshold) continue;
      if (resolvedTodayIds.has(item.id)) continue;

      const ratio = threshold > 0 ? currentStock / threshold : 1;
      const severity: InventoryAlertDto['severity'] = ratio <= 0.5 ? 'critical' : 'warning';

      alerts.push({
        id: `alert-${item.id}`,
        productId: item.id,
        product: item.nombre,
        currentStock,
        threshold,
        supplier: item.supplierProducts[0]?.supplier.razonSocial ?? 'Sin proveedor principal',
        severity,
        isResolved: false,
      });
    }

    return alerts;
  }

  async getAlertSummary(
    alerts: InventoryAlertDto[],
    tenantId: string,
  ): Promise<InventoryAlertSummaryDto> {
    const resolvedToday = await this.inventoryRepository.countResolvedToday(tenantId);
    return {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      resolvedToday,
    };
  }

  async resolveAlert(
    alertId: string,
    tenantId: string,
    resolvedById?: string,
    note?: string,
  ): Promise<void> {
    // alertId format: "alert-<supplyItemId>"
    const supplyItemId = alertId.startsWith('alert-') ? alertId.slice(6) : alertId;
    const result = await this.inventoryRepository.createAlertResolution({
      supplyItemId,
      tenantId,
      resolvedById,
      note,
    });
    if (!result) {
      throw new NotFoundException(`Insumo ${supplyItemId} no encontrado`);
    }
  }

  async getResolvedAlerts(
    tenantId: string,
    cursor?: string,
    take?: number,
  ): Promise<InventoryResolvedAlertPageDto> {
    const { edges, hasNextPage, endCursor } = await this.inventoryRepository.findResolvedAlerts(
      tenantId,
      cursor,
      take,
    );

    return {
      edges: edges.map((resolution) => ({
        id: resolution.id,
        supplyItemId: resolution.supplyItemId,
        product: resolution.supplyItem.nombre,
        currentStock: decimalToNumber(resolution.supplyItem.stockActualBodega),
        threshold: decimalToNumber(resolution.supplyItem.stockMinimoBodega),
        supplier:
          resolution.supplyItem.supplierProducts[0]?.supplier.razonSocial ??
          'Sin proveedor principal',
        resolvedAt: resolution.resolvedAt.toISOString(),
        resolvedById: resolution.resolvedById ?? undefined,
        note: resolution.note ?? undefined,
      })),
      pageInfo: { hasNextPage, endCursor },
    };
  }

  async getReport(tenantId: string, type: string): Promise<InventoryReportDto> {
    const items = await this.inventoryRepository.findActiveForReport(tenantId);
    const groups = new Map<string, { count: number; value: number }>();

    for (const item of items) {
      const key = item.categoria.nombre;
      const current = groups.get(key) ?? { count: 0, value: 0 };
      const cpp = decimalToNumber(item.costoPromedioPonderado);
      const stock = decimalToNumber(item.stockActualBodega);
      groups.set(key, {
        count: current.count + 1,
        value: current.value + (type === 'valuation' ? cpp * stock : 1),
      });
    }

    const total =
      type === 'valuation'
        ? Array.from(groups.values()).reduce((s, g) => s + g.value, 0)
        : items.length;

    const rows = Array.from(groups.entries()).map(([category, data]) => {
      const quantity = type === 'valuation' ? Math.round(data.value) : data.count;
      const percent = total > 0 ? `${Math.round((quantity / total) * 100)}%` : '0%';
      return { category, quantity, percent };
    });

    const distribution = rows.map((row, index) => ({
      label: row.category,
      value: type === 'valuation' ? `$${row.quantity.toLocaleString('es-CO')}` : `${row.quantity}`,
      progress: total > 0 ? Math.round((row.quantity / total) * 100) : 0,
      accent: ACCENTS[index % ACCENTS.length],
    }));

    const summary = [
      {
        label: 'Total ítems',
        value: String(items.length),
        accent: 'teal',
      },
      {
        label: type === 'valuation' ? 'Valor catálogo (CPP)' : 'Categorías',
        value: String(groups.size),
        accent: 'amber',
      },
    ];

    return { rows, distribution, summary };
  }
}
