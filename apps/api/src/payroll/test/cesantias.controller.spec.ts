import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CesantiasController } from '../controller/cesantias.controller';
import { CesantiasExportService } from '../service/cesantias-export.service';
import { CesantiasService } from '../service/cesantias.service';

function makeJwtUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-1',
    email: 'test@example.com',
    tenantId: 'tenant-1',
    roleId: 'role-1',
    roleCode: 'OWNER',
    ...overrides,
  };
}

interface MockCesantiasService {
  calculateForYear: jest.Mock;
  listByYear: jest.Mock;
  getDetail: jest.Mock;
  getAlertSummary: jest.Mock;
  getExportAvailability: jest.Mock;
}

interface MockCesantiasExportService {
  generateFnaFile: jest.Mock;
  generatePrivateFundsFile: jest.Mock;
}

function makeMockResponse(): { setHeader: jest.Mock; send: jest.Mock } {
  return { setHeader: jest.fn(), send: jest.fn() };
}

describe('CesantiasController', (): void => {
  let controller: CesantiasController;
  // Tipado como el shape del mock (no como CesantiasService real) para que las
  // propiedades sean `jest.Mock` y no disparen @typescript-eslint/unbound-method al
  // referenciarlas sueltas en `expect(...)` — mismo valor en runtime, solo cambia el tipo
  // estático con el que se accede.
  let mockService: MockCesantiasService;
  let mockExportService: MockCesantiasExportService;

  beforeEach(async (): Promise<void> => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CesantiasController],
      providers: [
        {
          provide: CesantiasService,
          useValue: {
            calculateForYear: jest.fn(),
            listByYear: jest.fn(),
            getDetail: jest.fn(),
            getAlertSummary: jest.fn(),
            getExportAvailability: jest.fn(),
          },
        },
        {
          provide: CesantiasExportService,
          useValue: {
            generateFnaFile: jest.fn(),
            generatePrivateFundsFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CesantiasController>(CesantiasController);
    mockService = module.get<CesantiasService>(CesantiasService) as unknown as MockCesantiasService;
    mockExportService = module.get<CesantiasExportService>(
      CesantiasExportService,
    ) as unknown as MockCesantiasExportService;
  });

  describe('calculate', (): void => {
    it('resolves tenantId from the JWT and forwards year + actor', async (): Promise<void> => {
      mockService.calculateForYear.mockResolvedValue({ created: 1 });

      const result = await controller.calculate(makeJwtUser(), 'header-tenant', { year: 2026 });

      expect(mockService.calculateForYear).toHaveBeenCalledWith('tenant-1', 2026, 'user-1');
      expect(result).toEqual({ created: 1 });
    });

    it('falls back to the x-tenant-id header when the JWT has no tenantId', async (): Promise<void> => {
      mockService.calculateForYear.mockResolvedValue({ created: 0 });

      await controller.calculate(makeJwtUser({ tenantId: undefined }), 'header-tenant', {
        year: 2026,
      });

      expect(mockService.calculateForYear).toHaveBeenCalledWith('header-tenant', 2026, 'user-1');
    });

    it('throws BadRequestException when neither the JWT nor the header carry a tenant (tenant incorrecto)', async (): Promise<void> => {
      await expect(
        controller.calculate(makeJwtUser({ tenantId: undefined }), '', { year: 2026 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockService.calculateForYear).not.toHaveBeenCalled();
    });
  });

  describe('list', (): void => {
    it('returns paginated results with defaults', async (): Promise<void> => {
      mockService.listByYear.mockResolvedValue({ items: [{ id: 'liq-1' }], total: 1 });

      const result = await controller.list(makeJwtUser(), 'header-tenant', { year: 2026 });

      expect(mockService.listByYear).toHaveBeenCalledWith('tenant-1', 2026, {
        limit: undefined,
        offset: undefined,
        cesantiasStatus: undefined,
        interestStatus: undefined,
        fundChannelSnapshot: undefined,
        fundNameSnapshot: undefined,
      });
      expect(result).toEqual({ items: [{ id: 'liq-1' }], total: 1, limit: 50, offset: 0 });
    });

    it('forwards explicit limit/offset', async (): Promise<void> => {
      mockService.listByYear.mockResolvedValue({ items: [], total: 0 });

      const result = await controller.list(makeJwtUser(), 'header-tenant', {
        limit: 10,
        offset: 20,
      });

      expect(mockService.listByYear).toHaveBeenCalledWith('tenant-1', undefined, {
        limit: 10,
        offset: 20,
        cesantiasStatus: undefined,
        interestStatus: undefined,
        fundChannelSnapshot: undefined,
        fundNameSnapshot: undefined,
      });
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
    });

    it('forwards fondo/canal filters (fundNameSnapshot/fundChannelSnapshot)', async (): Promise<void> => {
      mockService.listByYear.mockResolvedValue({ items: [], total: 0 });

      await controller.list(makeJwtUser(), 'header-tenant', {
        year: 2026,
        fundChannelSnapshot: 'PRIVATE_OPERATOR',
        fundNameSnapshot: 'Porvenir',
      });

      expect(mockService.listByYear).toHaveBeenCalledWith('tenant-1', 2026, {
        limit: undefined,
        offset: undefined,
        cesantiasStatus: undefined,
        interestStatus: undefined,
        fundChannelSnapshot: 'PRIVATE_OPERATOR',
        fundNameSnapshot: 'Porvenir',
      });
    });
  });

  describe('detail', (): void => {
    it('delegates to the service with tenantId and id', async (): Promise<void> => {
      mockService.getDetail.mockResolvedValue({ id: 'liq-1' });

      const result = await controller.detail(makeJwtUser(), 'header-tenant', 'liq-1');

      expect(mockService.getDetail).toHaveBeenCalledWith('tenant-1', 'liq-1');
      expect(result).toEqual({ id: 'liq-1' });
    });
  });

  describe('alertSummary', (): void => {
    it('delegates to the service with tenantId', async (): Promise<void> => {
      mockService.getAlertSummary.mockResolvedValue({
        targetYear: 2025,
        deadlineDate: new Date('2026-02-14'),
        pendingCount: 3,
        daysUntilDeadline: 13,
        status: 'PROXIMA_A_VENCER',
      });

      const result = await controller.alertSummary(makeJwtUser(), 'header-tenant');

      expect(mockService.getAlertSummary).toHaveBeenCalledWith('tenant-1');
      expect(result.status).toBe('PROXIMA_A_VENCER');
    });

    it('throws BadRequestException when neither the JWT nor the header carry a tenant', async (): Promise<void> => {
      await expect(
        controller.alertSummary(makeJwtUser({ tenantId: undefined }), ''),
      ).rejects.toThrow(BadRequestException);
      expect(mockService.getAlertSummary).not.toHaveBeenCalled();
    });
  });

  describe('exportAvailability', (): void => {
    it('delegates to the service with tenantId and year', async (): Promise<void> => {
      mockService.getExportAvailability.mockResolvedValue({ fna: true, privateOperator: false });

      const result = await controller.exportAvailability(makeJwtUser(), 'header-tenant', {
        year: 2025,
      });

      expect(mockService.getExportAvailability).toHaveBeenCalledWith('tenant-1', 2025);
      expect(result).toEqual({ fna: true, privateOperator: false });
    });

    it('throws BadRequestException when neither the JWT nor the header carry a tenant', async (): Promise<void> => {
      await expect(
        controller.exportAvailability(makeJwtUser({ tenantId: undefined }), '', { year: 2025 }),
      ).rejects.toThrow(BadRequestException);
      expect(mockService.getExportAvailability).not.toHaveBeenCalled();
    });
  });

  describe('exportFna', (): void => {
    it('delegates to CesantiasExportService (con el actor) and streams the buffer with xlsx headers', async (): Promise<void> => {
      const buffer = Buffer.from('xlsx-bytes');
      mockExportService.generateFnaFile.mockResolvedValue({
        buffer,
        filename: 'cesantias-fna-2026.xlsx',
        rowCount: 1,
        skipped: [],
      });
      const res = makeMockResponse();

      await controller.exportFna(makeJwtUser(), 'header-tenant', { year: 2026 }, res as never);

      expect(mockExportService.generateFnaFile).toHaveBeenCalledWith('tenant-1', 2026, 'user-1');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="cesantias-fna-2026.xlsx"',
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Cesantias-Export-Skipped-Count', '0');
      expect(res.send).toHaveBeenCalledWith(buffer);
    });

    it('expone en el header cuántos empleados se excluyeron — nunca omisión silenciosa', async (): Promise<void> => {
      mockExportService.generateFnaFile.mockResolvedValue({
        buffer: Buffer.from('xlsx-bytes'),
        filename: 'cesantias-fna-2026.xlsx',
        rowCount: 3,
        skipped: [
          { employeeId: 'emp-1', reason: 'SIN_DATOS_PERSONALES' },
          { employeeId: 'emp-2', reason: 'SIN_DATOS_PERSONALES' },
        ],
      });
      const res = makeMockResponse();

      await controller.exportFna(makeJwtUser(), 'header-tenant', { year: 2026 }, res as never);

      expect(res.setHeader).toHaveBeenCalledWith('X-Cesantias-Export-Skipped-Count', '2');
    });

    it('throws BadRequestException when neither the JWT nor the header carry a tenant', async (): Promise<void> => {
      const res = makeMockResponse();
      await expect(
        controller.exportFna(
          makeJwtUser({ tenantId: undefined }),
          '',
          { year: 2026 },
          res as never,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(mockExportService.generateFnaFile).not.toHaveBeenCalled();
    });
  });

  describe('exportPrivateFunds', (): void => {
    it('delegates to CesantiasExportService (con el actor) and streams the buffer with xlsx headers', async (): Promise<void> => {
      const buffer = Buffer.from('xlsx-bytes');
      mockExportService.generatePrivateFundsFile.mockResolvedValue({
        buffer,
        filename: 'cesantias-fondos-privados-2026.xlsx',
        rowCount: 1,
        skipped: [],
      });
      const res = makeMockResponse();

      await controller.exportPrivateFunds(
        makeJwtUser(),
        'header-tenant',
        { year: 2026 },
        res as never,
      );

      expect(mockExportService.generatePrivateFundsFile).toHaveBeenCalledWith(
        'tenant-1',
        2026,
        'user-1',
      );
      expect(res.setHeader).toHaveBeenCalledWith('X-Cesantias-Export-Skipped-Count', '0');
      expect(res.send).toHaveBeenCalledWith(buffer);
    });
  });
});
