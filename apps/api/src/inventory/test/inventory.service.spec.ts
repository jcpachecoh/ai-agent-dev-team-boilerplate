import { Test, TestingModule } from '@nestjs/testing';
import { StockUnit } from '@prisma/client';
import { InventoryRepository } from '../repository/inventory.repository';
import { InventoryService } from '../service/inventory.service';

const tenantId = 'palos-de-lena';

function buildItem(
  overrides: Partial<{
    id: string;
    nombre: string;
    stockMinimoBodega: string;
    stockActualBodega: string;
    costoPromedioPonderado: string;
    categoriaNombre: string;
    supplierName: string | null;
  }> = {},
) {
  const id = overrides.id ?? 'item-1';
  return {
    id,
    tenantId,
    nombre: overrides.nombre ?? 'Pollo',
    codigoInterno: 'SKU-1',
    categoriaId: 'cat-1',
    descripcion: null,
    unidadBase: StockUnit.KILOGRAMS,
    factorConversion: '1',
    costoPromedioPonderado: overrides.costoPromedioPonderado ?? '1200',
    stockMinimoBodega: overrides.stockMinimoBodega ?? '20',
    stockMaximoBodega: '100',
    stockActualBodega: overrides.stockActualBodega ?? '0',
    aplicaVencimiento: false,
    aplicaLote: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    categoria: {
      id: 'cat-1',
      tenantId,
      nombre: overrides.categoriaNombre ?? 'Abarrotes',
      descripcion: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    supplierProducts:
      overrides.supplierName === null
        ? []
        : [
            {
              supplier: {
                razonSocial: overrides.supplierName ?? 'Proveedor SA',
              },
            },
          ],
  };
}

const repositoryMock = {
  findActiveForDashboard: jest.fn(),
  findActiveForAlerts: jest.fn(),
  findActiveForReport: jest.fn(),
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryService, { provide: InventoryRepository, useValue: repositoryMock }],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('returns aggregates for active supply items', async () => {
      repositoryMock.findActiveForDashboard.mockResolvedValue([
        buildItem({ id: 'a', costoPromedioPonderado: '8500', stockMinimoBodega: '5' }),
        buildItem({
          id: 'b',
          nombre: 'Aceite',
          costoPromedioPonderado: '1200',
          stockMinimoBodega: '10',
          categoriaNombre: 'Lácteos',
        }),
      ]);

      const result = await service.getDashboard(tenantId);

      expect(result.totalItems).toBe(2);
      expect(result.lowStockCount).toBe(2);
      expect(result.topProducts).toHaveLength(2);
      expect(result.topProducts[0]?.label).toBe('Pollo');
      expect(result.stockBySite).toHaveLength(2);
      expect(result.movementsToday).toBe(0);
      expect(result.historyOccupancy).toEqual([]);
    });

    it('returns empty dashboard when there are no items', async () => {
      repositoryMock.findActiveForDashboard.mockResolvedValue([]);

      const result = await service.getDashboard(tenantId);

      expect(result.totalItems).toBe(0);
      expect(result.totalValue).toBe(0);
      expect(result.lowStockCount).toBe(0);
      expect(result.topProducts).toEqual([]);
      expect(result.stockBySite).toEqual([]);
    });
  });

  describe('getAlerts', () => {
    it('builds critical alerts when stock is below minimum', async () => {
      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'crit', stockMinimoBodega: '20' }),
        buildItem({ id: 'crit-2', stockMinimoBodega: '4' }),
        buildItem({ id: 'ok', stockMinimoBodega: '0' }),
      ]);

      const alerts = await service.getAlerts(tenantId);

      expect(alerts).toHaveLength(2);
      expect(alerts.every((a) => a.severity === 'critical')).toBe(true);
      expect(alerts[0]?.supplier).toBe('Proveedor SA');
    });

    it('uses fallback supplier label when principal supplier is missing', async () => {
      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'solo', stockMinimoBodega: '5', supplierName: null }),
      ]);

      const alerts = await service.getAlerts(tenantId);

      expect(alerts[0]?.supplier).toBe('Sin proveedor principal');
    });

    it('does not alert when stockActualBodega is at or above minimum', async () => {
      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'ok-stock', stockMinimoBodega: '20', stockActualBodega: '25' }),
      ]);

      const alerts = await service.getAlerts(tenantId);

      expect(alerts).toHaveLength(0);
    });

    it('omits resolved alerts', async () => {
      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'resolved-item', stockMinimoBodega: '10' }),
      ]);

      service.resolveAlert('alert-resolved-item');
      const alerts = await service.getAlerts(tenantId);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('getAlertSummary', () => {
    it('counts severities and resolved alerts', () => {
      const localService = new InventoryService(repositoryMock as unknown as InventoryRepository);
      localService.resolveAlert('alert-x');
      localService.resolveAlert('alert-y');

      const summary = localService.getAlertSummary([
        { severity: 'critical' } as never,
        { severity: 'critical' } as never,
        { severity: 'warning' } as never,
      ]);

      expect(summary).toEqual({ critical: 2, warning: 1, resolvedToday: 2 });
    });
  });

  describe('getReport', () => {
    it('builds category report rows and distribution', async () => {
      repositoryMock.findActiveForReport.mockResolvedValue([
        buildItem({ categoriaNombre: 'Abarrotes' }),
        buildItem({ id: 'item-2', categoriaNombre: 'Abarrotes' }),
        buildItem({ id: 'item-3', categoriaNombre: 'Bebidas' }),
      ]);

      const report = await service.getReport(tenantId, 'category');

      expect(report.rows).toHaveLength(2);
      expect(report.summary[0]?.value).toBe('3');
      expect(report.summary[1]?.label).toBe('Categorías');
      expect(report.distribution[0]?.value).toMatch(/^\d+$/);
    });

    it('builds valuation report with formatted currency labels', async () => {
      repositoryMock.findActiveForReport.mockResolvedValue([
        buildItem({ costoPromedioPonderado: '5000', stockActualBodega: '2' }),
        buildItem({ id: 'item-2', costoPromedioPonderado: '3000', stockActualBodega: '4' }),
      ]);

      const report = await service.getReport(tenantId, 'valuation');

      expect(report.summary[1]?.label).toBe('Valor catálogo (CPP)');
      expect(report.distribution[0]?.value).toContain('$');
      // 5000*2 + 3000*4 = 22000 aggregated in rows
      expect(report.rows.reduce((sum, r) => sum + r.quantity, 0)).toBe(22000);
    });

    it('returns zero percent when there are no items', async () => {
      repositoryMock.findActiveForReport.mockResolvedValue([]);

      const report = await service.getReport(tenantId, 'category');

      expect(report.rows).toEqual([]);
      expect(report.summary[0]?.value).toBe('0');
    });
  });
});
