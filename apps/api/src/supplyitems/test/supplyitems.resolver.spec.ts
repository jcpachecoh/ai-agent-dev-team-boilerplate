import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { SupplyItemsResolver } from '../resolver/supplyitems.resolver';
import { SupplyItemsService } from '../service/supplyitems.service';

const tenantId = 'palos-de-lena';
const mockSupplyItem = {
  id: 'item-1',
  tenantId,
  nombre: 'Insumo Test',
  codigoInterno: 'INS-001',
  unidadBase: 'UNIT',
  isActive: true,
};

const serviceMock = {
  findAll: jest.fn(),
};

describe('SupplyItemsResolver', () => {
  let resolver: SupplyItemsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyItemsResolver, { provide: SupplyItemsService, useValue: serviceMock }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    resolver = module.get<SupplyItemsResolver>(SupplyItemsResolver);
    jest.clearAllMocks();
  });

  describe('supplyItems', () => {
    it('delegates to SupplyItemsService.findAll using the tenant header', async () => {
      serviceMock.findAll.mockResolvedValue([mockSupplyItem]);

      const result = await resolver.supplyItems(
        { req: { headers: { 'x-tenant-id': tenantId } } } as never,
        'insumo',
        25,
      );

      expect(result).toEqual([mockSupplyItem]);
      expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId, { search: 'insumo', limit: 25 });
    });

    it('throws when the tenant header is missing', async () => {
      await expect(
        resolver.supplyItems({ req: { headers: {} } } as never, undefined, undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
