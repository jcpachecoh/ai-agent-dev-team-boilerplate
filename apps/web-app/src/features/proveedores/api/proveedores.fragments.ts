export const SUPPLIER_FIELDS = `
  id
  razonSocial
  nit
  dv
  tipo
  direccion
  departamento
  ciudad
  telefono
  email
  contactoNombre
  condicionPago
  cupoCredito
  calificacion
  isActive
  productCount
  logistics {
    id
    deliveryMode
    deliveryPlace
    deliveryPlaceCustom
    deliveryDays
    leadTimeDays
    timeWindowStart
    timeWindowEnd
    receptionResponsible { id email name }
    receptionResponsibleStale
    transportType
    requiresColdChain
    transportTempMinC
    transportTempMaxC
    transportCost
    transportCostCurrency
    minimumOrderQty
    minimumOrderUnit
    coverageLocations { id name }
    status
  }
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
