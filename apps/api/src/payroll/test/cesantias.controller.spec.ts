import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CesantiasController } from '../controller/cesantias.controller';
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
}

describe('CesantiasController', (): void => {
  let controller: CesantiasController;
  // Tipado como el shape del mock (no como CesantiasService real) para que las
  // propiedades sean `jest.Mock` y no disparen @typescript-eslint/unbound-method al
  // referenciarlas sueltas en `expect(...)` — mismo valor en runtime, solo cambia el tipo
  // estático con el que se accede.
  let mockService: MockCesantiasService;

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
          },
        },
      ],
    }).compile();

    controller = module.get<CesantiasController>(CesantiasController);
    mockService = module.get<CesantiasService>(CesantiasService) as unknown as MockCesantiasService;
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
      });
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(20);
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
});
