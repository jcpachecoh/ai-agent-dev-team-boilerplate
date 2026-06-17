export const SUPPLIER_FIELDS = `
  id
  razonSocial
  nit
  dv
  tipo
  direccion
  ciudad
  telefono
  email
  contactoNombre
  condicionPago
  cupoCredito
  calificacion
  isActive
  productCount
`;

export const SUPPLIER_PRODUCT_FIELDS = `
  id
  supplierId
  supplyItemId
  precioUnitario
  precioAnterior
  unidadCompra
  factorConversion
  tiempoEntregaDias
  esProveedorPrincipal
  supplyItem {
    id
    nombre
    codigoInterno
    unidadBase
  }
`;

export const SUPPLY_ITEM_FIELDS = `
  id
  nombre
  codigoInterno
  unidadBase
`;
