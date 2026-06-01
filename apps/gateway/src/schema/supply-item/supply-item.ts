import { SupplyItem } from '@prisma/client';
import { builder } from '../builder';

export const SupplyItemObject = builder.objectRef<SupplyItem>('SupplyItem');

SupplyItemObject.implement({
  description: 'A supply item (insumo) in inventory',
  fields: (t) => ({
    id: t.exposeID('id'),
    tenantId: t.exposeString('tenantId'),
    nombre: t.exposeString('nombre'),
    codigoInterno: t.exposeString('codigoInterno'),
    unidadBase: t.exposeString('unidadBase'),
    isActive: t.exposeBoolean('isActive'),
  }),
});
