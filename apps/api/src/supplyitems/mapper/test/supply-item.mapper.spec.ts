import { CondicionPago, StockUnit, SupplierTipo, type Supplier } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { toSupplyItemResponse } from '../supply-item.mapper';

const mockSupplier: Supplier = {
  id: 'sup-1',
  tenantId: 'tenant-1',
  razonSocial: 'Proveedor SA',
  nit: '123456789',
  dv: null,
  tipo: SupplierTipo.PERSONA_JURIDICA,
  direccion: null,
  departamento: null,
  ciudad: null,
  telefono: null,
  email: null,
  contactoNombre: null,
  condicionPago: CondicionPago.CONTADO,
  cupoCredito: 0,
  calificacion: new Decimal('3'),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseItem = {
  id: 'item-1',
  tenantId: 'tenant-1',
  nombre: 'Harina',
  codigoInterno: 'SKU-1',
  categoriaId: 'cat-1',
  descripcion: null,
  unidadBase: StockUnit.KILOGRAMS,
  factorConversion: new Decimal('1'),
  costoPromedioPonderado: new Decimal('100'),
  stockMinimoBodega: new Decimal('5'),
  stockMaximoBodega: new Decimal('50'),
  stockActualBodega: new Decimal('12'),
  aplicaVencimiento: false,
  aplicaLote: false,
  fechaVencimiento: null,
  lote: null,
  locationId: 'loc-1',
  subcategoria: null,
  genero: null,
  talla: null,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  categoria: {
    id: 'cat-1',
    tenantId: 'tenant-1',
    nombre: 'Secos',
    prefijo: 'SEC',
    descripcion: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  location: {
    id: 'loc-1',
    tenantId: 'tenant-1',
    name: 'Sede Salitre',
    address: 'Calle 1',
    city: 'Bogotá',
    phone: null,
    code: 'PL-01',
    latitude: null,
    longitude: null,
    businessHours: null,
    openingTime: null,
    closingTime: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
};

describe('toSupplyItemResponse', () => {
  it('maps category and principal supplier when present', () => {
    const dto = toSupplyItemResponse({
      ...baseItem,
      supplierProducts: [
        {
          id: 'sp-1',
          tenantId: 'tenant-1',
          supplyItemId: 'item-1',
          supplierId: 'sup-1',
          precioUnitario: new Decimal('100'),
          unidadCompra: StockUnit.KILOGRAMS,
          factorConversion: new Decimal('1'),
          tiempoEntregaDias: 3,
          esProveedorPrincipal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          supplier: mockSupplier,
        },
      ],
    });

    expect(dto.categoria).toEqual({ id: 'cat-1', nombre: 'Secos' });
    expect(dto.proveedorPrincipal).toEqual({
      supplierId: 'sup-1',
      razonSocial: 'Proveedor SA',
    });
    expect(dto.stockActualBodega).toBe(12);
    expect(dto.stockDisponible).toBe(12);
    expect(dto.locationId).toBe('loc-1');
    expect(dto.ubicacion).toBe('Sede Salitre');
  });

  it('omits category and principal supplier when absent', () => {
    const dto = toSupplyItemResponse({
      ...baseItem,
      locationId: null,
      categoria: undefined as unknown as typeof baseItem.categoria,
      location: null,
      supplierProducts: [],
    });

    expect(dto.categoria).toBeUndefined();
    expect(dto.proveedorPrincipal).toBeNull();
    expect(dto.ubicacion).toBeNull();
  });
});
