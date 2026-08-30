import { Test, TestingModule } from '@nestjs/testing';
import { SupplierProductResolver } from '../resolver/supplier-product.resolver';
import { SupplierProductService } from '../service/supplier-product.service';

const tenantId = 'tenant-1';
const mockSupplierProduct = {
  id: 'sp-1',
  tenantId,
  supplierId: 'sup-1',
  supplyItemId: 'item-1',
  precioUnitario: 12.5,
  unidadCompra: 'UNIT',
  factorConversion: 1,
  tiempoEntregaDias: 1,
  esProveedorPrincipal: false,
  supplyItem: {
    id: 'item-1',
    tenantId,
    nombre: 'Item 1',
    codigoInterno: 'IT-1',
    unidadBase: 'UNIT',
    isActive: true,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findBySupplierId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getPreviousPrice: jest.fn(),
};

describe('SupplierProductResolver', () => {
  let resolver: SupplierProductResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierProductResolver,
        { provide: SupplierProductService, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get<SupplierProductResolver>(SupplierProductResolver);
    jest.clearAllMocks();
  });

  it('delegates supplierProducts to the service', async () => {
    serviceMock.findBySupplierId.mockResolvedValue([mockSupplierProduct]);

    const result = await resolver.supplierProducts(
      { req: { headers: { 'x-tenant-id': tenantId } } } as never,
      'sup-1',
    );

    expect(result).toEqual([mockSupplierProduct]);
    expect(serviceMock.findBySupplierId).toHaveBeenCalledWith(tenantId, 'sup-1');
  });

  it('delegates createSupplierProduct to the service', async () => {
    serviceMock.create.mockResolvedValue(mockSupplierProduct);

    const result = await resolver.createSupplierProduct(
      { req: { headers: { 'x-tenant-id': tenantId } } } as never,
      {
        supplierId: 'sup-1',
        supplyItemId: 'item-1',
        precioUnitario: 12.5,
        unidadCompra: 'UNIT',
        factorConversion: 1,
      },
    );

    expect(result).toEqual(mockSupplierProduct);
    expect(serviceMock.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ supplierId: 'sup-1', supplyItemId: 'item-1' }),
    );
  });
});
