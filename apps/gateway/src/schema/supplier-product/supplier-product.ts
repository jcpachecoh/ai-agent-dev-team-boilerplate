import { builder } from '../builder';
import { SupplyItemObject } from '../supply-item/supply-item';
import type { SupplierProductWithSupplyItem } from '../../services/supplier-product.service';

export const SupplierProductObject =
  builder.objectRef<SupplierProductWithSupplyItem>('SupplierProduct');

SupplierProductObject.implement({
  description: 'A supply item offered by a supplier with purchase terms',
  fields: (t) => ({
    id: t.exposeID('id'),
    tenantId: t.exposeString('tenantId'),
    supplierId: t.exposeID('supplierId'),
    supplyItemId: t.exposeID('supplyItemId'),
    precioUnitario: t.float({
      resolve: (row) => Number(row.precioUnitario),
    }),
    unidadCompra: t.exposeString('unidadCompra'),
    factorConversion: t.float({
      resolve: (row) => Number(row.factorConversion),
    }),
    tiempoEntregaDias: t.exposeInt('tiempoEntregaDias'),
    esProveedorPrincipal: t.exposeBoolean('esProveedorPrincipal'),
    supplyItem: t.field({
      type: SupplyItemObject,
      resolve: (row) => row.supplyItem,
    }),
    precioAnterior: t.float({
      nullable: true,
      description: 'Previous unit price from the latest price history entry',
      resolve: async (row, _args, ctx) => {
        return ctx.services.supplierProduct.getPreviousPrice(row.tenantId, row.supplyItemId);
      },
    }),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});
