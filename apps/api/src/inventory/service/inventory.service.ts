import { Injectable } from '@nestjs/common';
import { decimalToNumber } from '../../common/utils/decimal.util';
import type {
  InventoryAlertDto,
  InventoryAlertSummaryDto,
} from '../controller/dto/inventory-alert.dto';
import type { InventoryDashboardDto } from '../controller/dto/inventory-dashboard.dto';
import type { InventoryReportDto } from '../controller/dto/inventory-report.dto';
import type { IInventoryService } from '../interfaces/inventory.interfaces';
import { InventoryRepository } from '../repository/inventory.repository';

const ACCENTS = ['teal', 'amber', 'rose', 'violet', 'sky'] as const;

@Injectable()
export class InventoryService implements IInventoryService {
  private readonly resolvedAlerts = new Set<string>();

  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async getDashboard(tenantId: string): Promise<InventoryDashboardDto> {
    const items = await this.inventoryRepository.findActiveForDashboard(tenantId);

    const enriched = items.map((item) => ({
      item,
      stock: 0,
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
    const items = await this.inventoryRepository.findActiveForAlerts(tenantId);
    const alerts: InventoryAlertDto[] = [];

    for (const item of items) {
      const currentStock = 0;
      const threshold = decimalToNumber(item.stockMinimoBodega);
      if (threshold <= 0 || currentStock >= threshold) continue;

      const alertId = `alert-${item.id}`;
      if (this.resolvedAlerts.has(alertId)) continue;

      const ratio = threshold > 0 ? currentStock / threshold : 1;
      const severity: InventoryAlertDto['severity'] = ratio <= 0.5 ? 'critical' : 'warning';

      alerts.push({
        id: alertId,
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

  getAlertSummary(alerts: InventoryAlertDto[]): InventoryAlertSummaryDto {
    return {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      resolvedToday: this.resolvedAlerts.size,
    };
  }

  resolveAlert(alertId: string): void {
    this.resolvedAlerts.add(alertId);
  }

  async getReport(tenantId: string, type: string): Promise<InventoryReportDto> {
    const items = await this.inventoryRepository.findActiveForReport(tenantId);
    const groups = new Map<string, { count: number; value: number }>();

    for (const item of items) {
      const key = item.categoria.nombre;
      const current = groups.get(key) ?? { count: 0, value: 0 };
      const cpp = decimalToNumber(item.costoPromedioPonderado);
      groups.set(key, {
        count: current.count + 1,
        value: current.value + (type === 'valuation' ? cpp : 1),
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
