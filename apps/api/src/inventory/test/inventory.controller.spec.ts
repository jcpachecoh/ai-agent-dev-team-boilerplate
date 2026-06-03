import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from '../controller/inventory.controller';
import { InventoryService } from '../service/inventory.service';

const serviceMock = {
  getDashboard: jest.fn(),
  getAlerts: jest.fn(),
  getAlertSummary: jest.fn(),
  resolveAlert: jest.fn(),
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
    serviceMock.getAlertSummary.mockReturnValue({ critical: 1, warning: 0, resolvedToday: 0 });

    await expect(controller.getAlerts('palos-de-lena')).resolves.toEqual(alerts);
    await expect(controller.getAlertSummary('palos-de-lena')).resolves.toEqual({
      critical: 1,
      warning: 0,
      resolvedToday: 0,
    });
    expect(serviceMock.getAlertSummary).toHaveBeenCalledWith(alerts);
  });

  it('resolveAlert returns ok payload', () => {
    expect(controller.resolveAlert('alert-1')).toEqual({ ok: true });
    expect(serviceMock.resolveAlert).toHaveBeenCalledWith('alert-1');
  });

  it('getReport delegates type to service', async () => {
    serviceMock.getReport.mockResolvedValue({ rows: [] });

    await controller.getReport('palos-de-lena', 'valuation');

    expect(serviceMock.getReport).toHaveBeenCalledWith('palos-de-lena', 'valuation');
  });
});
