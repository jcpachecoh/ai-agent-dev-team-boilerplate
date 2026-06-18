import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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

function buildResolution(overrides: Partial<{ id: string; supplyItemId: string; resolvedAt: Date }> = {}) {
  const supplyItemId = overrides.supplyItemId ?? 'item-1';
  return {
    id: overrides.id ?? 'res-1',
    tenantId,
    supplyItemId,
    alertType: 'LOW_STOCK' as const,
    resolvedAt: overrides.resolvedAt ?? new Date(),
    resolvedById: null,
    note: null,
    supplyItem: {
      ...buildItem({ id: supplyItemId }),
    },
  };
}

const repositoryMock = {
  findActiveForDashboard: jest.fn(),
  findActiveForAlerts: jest.fn(),
  findActiveForReport: jest.fn(),
  createAlertResolution: jest.fn(),
  findResolvedAlerts: jest.fn(),
  countResolvedToday: jest.fn(),
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
      repositoryMock.findResolvedAlerts.mockResolvedValue({ edges: [], hasNextPage: false, endCursor: null });

      const alerts = await service.getAlerts(tenantId);

      expect(alerts).toHaveLength(2);
      expect(alerts.every((a) => a.severity === 'critical')).toBe(true);
      expect(alerts[0]?.supplier).toBe('Proveedor SA');
    });

    it('uses fallback supplier label when principal supplier is missing', async () => {
      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'solo', stockMinimoBodega: '5', supplierName: null }),
      ]);
      repositoryMock.findResolvedAlerts.mockResolvedValue({ edges: [], hasNextPage: false, endCursor: null });

      const alerts = await service.getAlerts(tenantId);

      expect(alerts[0]?.supplier).toBe('Sin proveedor principal');
    });

    it('does not alert when stockActualBodega is at or above minimum', async () => {
      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'ok-stock', stockMinimoBodega: '20', stockActualBodega: '25' }),
      ]);
      repositoryMock.findResolvedAlerts.mockResolvedValue({ edges: [], hasNextPage: false, endCursor: null });

      const alerts = await service.getAlerts(tenantId);

      expect(alerts).toHaveLength(0);
    });

    it('omits alerts resolved today', async () => {
      // Arrange
      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'resolved-item', stockMinimoBodega: '10' }),
      ]);
      repositoryMock.findResolvedAlerts.mockResolvedValue({
        edges: [buildResolution({ supplyItemId: 'resolved-item', resolvedAt: new Date() })],
        hasNextPage: false,
        endCursor: null,
      });

      // Act
      const alerts = await service.getAlerts(tenantId);

      // Assert
      expect(alerts).toHaveLength(0);
    });

    it('shows alert again if resolution was before today', async () => {
      // Arrange
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      repositoryMock.findActiveForAlerts.mockResolvedValue([
        buildItem({ id: 'old-resolved', stockMinimoBodega: '10' }),
      ]);
      repositoryMock.findResolvedAlerts.mockResolvedValue({
        edges: [buildResolution({ supplyItemId: 'old-resolved', resolvedAt: yesterday })],
        hasNextPage: false,
        endCursor: null,
      });

      // Act
      const alerts = await service.getAlerts(tenantId);

      // Assert — alert reappears because stock is still low
      expect(alerts).toHaveLength(1);
    });

    it('filters by tenantId when querying resolved alerts', async () => {
      // Arrange
      repositoryMock.findActiveForAlerts.mockResolvedValue([]);
      repositoryMock.findResolvedAlerts.mockResolvedValue({ edges: [], hasNextPage: false, endCursor: null });

      // Act
      await service.getAlerts(tenantId);

      // Assert
      expect(repositoryMock.findResolvedAlerts).toHaveBeenCalledWith(tenantId, undefined, 1000);
    });
  });

  describe('getAlertSummary', () => {
    it('counts severities and resolved today from repository', async () => {
      // Arrange
      repositoryMock.countResolvedToday.mockResolvedValue(3);

      // Act
      const summary = await service.getAlertSummary(
        [
          { severity: 'critical' } as never,
          { severity: 'critical' } as never,
          { severity: 'warning' } as never,
        ],
        tenantId,
      );

      // Assert
      expect(summary).toEqual({ critical: 2, warning: 1, resolvedToday: 3 });
      expect(repositoryMock.countResolvedToday).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('resolveAlert', () => {
    it('persists InventoryAlertResolution with correct supplyItemId', async () => {
      // Arrange
      const resolution = buildResolution({ supplyItemId: 'item-abc' });
      repositoryMock.createAlertResolution.mockResolvedValue(resolution);

      // Act
      await service.resolveAlert('alert-item-abc', tenantId, 'user-001');

      // Assert
      expect(repositoryMock.createAlertResolution).toHaveBeenCalledWith(
        expect.objectContaining({ supplyItemId: 'item-abc', tenantId, resolvedById: 'user-001' }),
      );
    });

    it('persists note when provided', async () => {
      // Arrange
      repositoryMock.createAlertResolution.mockResolvedValue(buildResolution());

      // Act
      await service.resolveAlert('alert-item-1', tenantId, undefined, 'Se realizó ajuste de inventario');

      // Assert
      expect(repositoryMock.createAlertResolution).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'Se realizó ajuste de inventario' }),
      );
    });

    it('resolves without note when body is omitted', async () => {
      // Arrange
      repositoryMock.createAlertResolution.mockResolvedValue(buildResolution());

      // Act
      await service.resolveAlert('alert-item-1', tenantId);

      // Assert — note is undefined, not an error
      expect(repositoryMock.createAlertResolution).toHaveBeenCalledWith(
        expect.objectContaining({ note: undefined }),
      );
    });

    it('resolvedById is undefined when no auth user is present', async () => {
      // Arrange
      repositoryMock.createAlertResolution.mockResolvedValue(buildResolution());

      // Act
      await service.resolveAlert('alert-item-1', tenantId);

      // Assert — controller passes undefined when there is no JWT user
      expect(repositoryMock.createAlertResolution).toHaveBeenCalledWith(
        expect.objectContaining({ resolvedById: undefined }),
      );
    });

    it('strips "alert-" prefix when building supplyItemId', async () => {
      // Arrange
      repositoryMock.createAlertResolution.mockResolvedValue(buildResolution());

      // Act
      await service.resolveAlert('alert-some-cuid', tenantId);

      // Assert
      expect(repositoryMock.createAlertResolution).toHaveBeenCalledWith(
        expect.objectContaining({ supplyItemId: 'some-cuid' }),
      );
    });

    it('throws NotFoundException when repository returns null (item not found)', async () => {
      // Arrange — repository returns null when the supplyItem doesn't belong to the tenant
      repositoryMock.createAlertResolution.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resolveAlert('alert-not-found', tenantId)).rejects.toThrow(NotFoundException);
    });

    it('enforces tenant isolation — tenantId is always forwarded', async () => {
      // Arrange
      repositoryMock.createAlertResolution.mockResolvedValue(buildResolution());

      // Act
      await service.resolveAlert('alert-item-1', 'other-tenant');

      // Assert
      expect(repositoryMock.createAlertResolution).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'other-tenant' }),
      );
    });
  });

  describe('getResolvedAlerts', () => {
    it('returns mapped resolved alerts with item data', async () => {
      // Arrange
      const resolvedAt = new Date('2026-06-18T10:00:00Z');
      repositoryMock.findResolvedAlerts.mockResolvedValue({
        edges: [
          buildResolution({
            id: 'res-1',
            supplyItemId: 'item-1',
            resolvedAt,
          }),
        ],
        hasNextPage: false,
        endCursor: null,
      });

      // Act
      const result = await service.getResolvedAlerts(tenantId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'res-1',
        supplyItemId: 'item-1',
        product: 'Pollo',
        resolvedAt: resolvedAt.toISOString(),
      });
    });

    it('includes note when resolution has one', async () => {
      // Arrange
      repositoryMock.findResolvedAlerts.mockResolvedValue({
        edges: [{ ...buildResolution(), note: 'Se recibió compra de emergencia' }],
        hasNextPage: false,
        endCursor: null,
      });

      // Act
      const result = await service.getResolvedAlerts(tenantId);

      // Assert
      expect(result[0]?.note).toBe('Se recibió compra de emergencia');
    });

    it('returns note as undefined when not set', async () => {
      // Arrange
      repositoryMock.findResolvedAlerts.mockResolvedValue({
        edges: [{ ...buildResolution(), note: null }],
        hasNextPage: false,
        endCursor: null,
      });

      // Act
      const result = await service.getResolvedAlerts(tenantId);

      // Assert
      expect(result[0]?.note).toBeUndefined();
    });

    it('filters by tenantId', async () => {
      // Arrange
      repositoryMock.findResolvedAlerts.mockResolvedValue({ edges: [], hasNextPage: false, endCursor: null });

      // Act
      await service.getResolvedAlerts(tenantId, undefined, 10);

      // Assert
      expect(repositoryMock.findResolvedAlerts).toHaveBeenCalledWith(tenantId, undefined, 10);
    });

    it('returns empty array when no resolutions exist', async () => {
      // Arrange
      repositoryMock.findResolvedAlerts.mockResolvedValue({ edges: [], hasNextPage: false, endCursor: null });

      // Act
      const result = await service.getResolvedAlerts(tenantId);

      // Assert
      expect(result).toEqual([]);
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
