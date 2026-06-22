export const SUPPLY_CATEGORY_FIELDS = `
  id
  nombre
  prefijo
  descripcion
  isActive
`;

export const SUPPLY_ITEM_FIELDS = `
  id
  nombre
  codigoInterno
  categoriaId
  categoria {
    ${SUPPLY_CATEGORY_FIELDS}
  }
  descripcion
  unidadBase
  factorConversion
  costoPromedioPonderado
  stockMinimoBodega
  stockMaximoBodega
  aplicaVencimiento
  aplicaLote
  fechaVencimiento
  lote
  isActive
  proveedorPrincipal {
    supplierId
    razonSocial
  }
  stockDisponible
`;

export const SUPPLY_ITEM_SUPPLIER_FIELDS = `
  supplierId
  razonSocial
  nit
  precioUnitario
  unidadCompra
  factorConversion
  tiempoEntregaDias
  esProveedorPrincipal
`;

export const SUPPLY_ITEM_PRICE_HISTORY_FIELDS = `
  id
  costoAnterior
  costoNuevo
  motivo
  referenciaTipo
  referenciaId
  createdAt
`;
