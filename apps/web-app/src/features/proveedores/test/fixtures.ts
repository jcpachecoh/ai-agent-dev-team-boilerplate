import type { SupplierApiModel, SupplierProductApiModel } from '../types';

export const mockSupplierApi: SupplierApiModel = {
  id: 'sup-test-001',
  razonSocial: 'Carnes del Valle S.A.S',
  nit: '900123456',
  dv: '1',
  tipo: 'PERSONA_JURIDICA',
  direccion: 'Calle 1',
  departamento: 'Bogotá D.C.',
  ciudad: 'Bogotá',
  telefono: '3001234567',
  email: 'carnes@example.com',
  contactoNombre: 'Juan',
  condicionPago: 'DIAS_30',
  cupoCredito: 5_000_000,
  calificacion: 4.5,
  isActive: true,
  productCount: 2,
};

export const mockInactiveSupplierApi: SupplierApiModel = {
  ...mockSupplierApi,
  id: 'sup-test-002',
  razonSocial: 'Especias del Sur',
  isActive: false,
  productCount: 0,
};

export const mockSupplierProductApi: SupplierProductApiModel = {
  id: 'sp-test-001',
  supplierId: 'sup-test-001',
  supplyItemId: 'si-test-001',
  precioUnitario: 28500,
  precioAnterior: 27800,
  unidadCompra: 'KILOGRAMS',
  factorConversion: 5,
  tiempoEntregaDias: 2,
  esProveedorPrincipal: true,
  supplyItem: {
    id: 'si-test-001',
    nombre: 'Lomo de Res Premium',
    codigoInterno: 'LRP-001',
    unidadBase: 'KILOGRAMS',
  },
};
