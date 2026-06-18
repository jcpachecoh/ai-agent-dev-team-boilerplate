import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from '../controller/inventory.controller';
import { InventoryService } from '../service/inventory.service';

const serviceMock = {
  getDashboard: jest.fn(),
  getAlerts: jest.fn(),
  getAlertSummary: jest.fn(),
  resolveAlert: jest.fn(),
  getResolvedAlerts: jest.fn(),
  getReport: jest.fn(),
};

describe('InventoryController', () => {
  let controller: InventoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [{ provide: InventoryService, useValue: serviceMock }],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    jest.clearAllMocks();
  });

  it('getDashboard delegates to service', async () => {
    serviceMock.getDashboard.mockResolvedValue({ totalItems: 1 });

    const result = await controller.getDashboard('palos-de-lena');

    expect(result).toEqual({ totalItems: 1 });
    expect(serviceMock.getDashboard).toHaveBeenCalledWith('palos-de-lena');
  });

  it('getAlerts and getAlertSummary use service', async () => {
    const alerts = [{ id: 'alert-1', severity: 'critical' }];
    serviceMock.getAlerts.mockResolvedValue(alerts);
    serviceMock.getAlertSummary.mockResolvedValue({ critical: 1, warning: 0, resolvedToday: 0 });

    await expect(controller.getAlerts('palos-de-lena')).resolves.toEqual(alerts);
    await expect(controller.getAlertSummary('palos-de-lena')).resolves.toEqual({
      critical: 1,
      warning: 0,
      resolvedToday: 0,
    });
    expect(serviceMock.getAlertSummary).toHaveBeenCalledWith(alerts, 'palos-de-lena');
  });

  it('resolveAlert passes tenantId to service and returns ok', async () => {
    // Arrange
    serviceMock.resolveAlert.mockResolvedValue(undefined);

    // Act
    const result = await controller.resolveAlert('alert-item-1', 'palos-de-lena', {});

    // Assert
    expect(result).toEqual({ ok: true });
    expect(serviceMock.resolveAlert).toHaveBeenCalledWith('alert-item-1', 'palos-de-lena', undefined, undefined);
  });

  it('resolveAlert forwards note from body to service', async () => {
    // Arrange
    serviceMock.resolveAlert.mockResolvedValue(undefined);

    // Act
    await controller.resolveAlert('alert-item-1', 'palos-de-lena', {
      note: 'Se realizó ajuste de inventario',
    });

    // Assert
    expect(serviceMock.resolveAlert).toHaveBeenCalledWith(
      'alert-item-1',
      'palos-de-lena',
      undefined,
      'Se realizó ajuste de inventario',
    );
  });

  it('resolveAlert resolvedById is always undefined — no JWT in this controller', async () => {
    // Arrange
    serviceMock.resolveAlert.mockResolvedValue(undefined);

    // Act
    await controller.resolveAlert('alert-item-1', 'palos-de-lena', {});

    // Assert — second arg undefined confirms no user is injected
    expect(serviceMock.resolveAlert).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      undefined,
      undefined,
    );
  });

  it('getResolvedAlerts delegates to service with tenantId and pagination', async () => {
    // Arrange
    const resolved = [{ id: 'res-1', product: 'Pollo', resolvedAt: '2026-06-18T10:00:00.000Z' }];
    serviceMock.getResolvedAlerts.mockResolvedValue(resolved);

    // Act
    const result = await controller.getResolvedAlerts('palos-de-lena', 'cursor-abc', '10');

    // Assert
    expect(result).toEqual(resolved);
    expect(serviceMock.getResolvedAlerts).toHaveBeenCalledWith('palos-de-lena', 'cursor-abc', 10);
  });

  it('getResolvedAlerts passes undefined cursor and take when not provided', async () => {
    // Arrange
    serviceMock.getResolvedAlerts.mockResolvedValue([]);

    // Act
    await controller.getResolvedAlerts('palos-de-lena');

    // Assert
    expect(serviceMock.getResolvedAlerts).toHaveBeenCalledWith('palos-de-lena', undefined, undefined);
  });

  it('getReport delegates type to service', async () => {
    serviceMock.getReport.mockResolvedValue({ rows: [] });

    await controller.getReport('palos-de-lena', 'valuation');

    expect(serviceMock.getReport).toHaveBeenCalledWith('palos-de-lena', 'valuation');
  });
});
