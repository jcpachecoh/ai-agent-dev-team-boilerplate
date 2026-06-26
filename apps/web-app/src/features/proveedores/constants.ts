import type { RecetaFilterOption } from '@restopsiq/ui';

import type {
  CondicionPago,
  CondicionPagoFilter,
  SupplierStatusFilter,
  SupplierViewModel,
} from './types';

export const PROVEEDOR_TABLE_SIZE = 'xl' as const;

export const STATUS_FILTER_OPTIONS: RecetaFilterOption[] = [
  { value: 'all', label: 'Estado' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'pending', label: 'Pendiente' },
];

export const PAYMENT_FILTER_OPTIONS: RecetaFilterOption[] = [
  { value: 'all', label: 'Condición' },
  { value: 'CONTADO', label: 'Contado' },
  { value: 'DIAS_15', label: '15 días' },
  { value: 'DIAS_30', label: '30 días' },
  { value: 'DIAS_60', label: '60 días' },
];

export const CATEGORY_FILTER_OPTIONS: RecetaFilterOption[] = [
  { value: 'all', label: 'Categoría' },
  { value: 'Proteínas', label: 'Proteínas' },
  { value: 'Lácteos', label: 'Lácteos' },
  { value: 'Vegetales', label: 'Vegetales' },
  { value: 'Especias', label: 'Especias' },
  { value: 'Panadería', label: 'Panadería' },
  { value: 'Aceites', label: 'Aceites' },
  { value: 'Varios', label: 'Varios' },
];

export const TIPO_OPTIONS: RecetaFilterOption[] = [
  { value: 'PERSONA_JURIDICA', label: 'Persona jurídica' },
  { value: 'PERSONA_NATURAL', label: 'Persona natural' },
];

export const CONDICION_PAGO_OPTIONS: RecetaFilterOption[] = [
  { value: 'CONTADO', label: 'Contado' },
  { value: 'DIAS_15', label: '15 días' },
  { value: 'DIAS_30', label: '30 días' },
  { value: 'DIAS_60', label: '60 días' },
];

export const STOCK_UNIT_OPTIONS: RecetaFilterOption[] = [
  { value: 'KILOGRAMS', label: 'Kg' },
  { value: 'GRAMS', label: 'Gramos' },
  { value: 'LITERS', label: 'Litros' },
  { value: 'ML', label: 'ml' },
  { value: 'UNIT', label: 'Unidad' },
];

export const CATALOG_STATUS_OPTIONS: RecetaFilterOption[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'limited', label: 'Limitado' },
];

export const DEPARTAMENTO_OPTIONS: RecetaFilterOption[] = [
  { value: 'Amazonas', label: 'Amazonas' },
  { value: 'Antioquia', label: 'Antioquia' },
  { value: 'Arauca', label: 'Arauca' },
  { value: 'Atlántico', label: 'Atlántico' },
  { value: 'Bogotá D.C.', label: 'Bogotá D.C.' },
  { value: 'Bolívar', label: 'Bolívar' },
  { value: 'Boyacá', label: 'Boyacá' },
  { value: 'Caldas', label: 'Caldas' },
  { value: 'Caquetá', label: 'Caquetá' },
  { value: 'Casanare', label: 'Casanare' },
  { value: 'Cauca', label: 'Cauca' },
  { value: 'Cesar', label: 'Cesar' },
  { value: 'Chocó', label: 'Chocó' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Cundinamarca', label: 'Cundinamarca' },
  { value: 'Guainía', label: 'Guainía' },
  { value: 'Guaviare', label: 'Guaviare' },
  { value: 'Huila', label: 'Huila' },
  { value: 'La Guajira', label: 'La Guajira' },
  { value: 'Magdalena', label: 'Magdalena' },
  { value: 'Meta', label: 'Meta' },
  { value: 'Nariño', label: 'Nariño' },
  { value: 'Norte de Santander', label: 'Norte de Santander' },
  { value: 'Putumayo', label: 'Putumayo' },
  { value: 'Quindío', label: 'Quindío' },
  { value: 'Risaralda', label: 'Risaralda' },
  { value: 'San Andrés y Providencia', label: 'San Andrés y Providencia' },
  { value: 'Santander', label: 'Santander' },
  { value: 'Sucre', label: 'Sucre' },
  { value: 'Tolima', label: 'Tolima' },
  { value: 'Valle del Cauca', label: 'Valle del Cauca' },
  { value: 'Vaupés', label: 'Vaupés' },
  { value: 'Vichada', label: 'Vichada' },
];

export const CIUDADES_POR_DEPARTAMENTO: Record<string, RecetaFilterOption[]> = {
  Amazonas: [{ value: 'Leticia', label: 'Leticia' }],
  Antioquia: [
    { value: 'Medellín', label: 'Medellín' },
    { value: 'Bello', label: 'Bello' },
    { value: 'Itagüí', label: 'Itagüí' },
    { value: 'Envigado', label: 'Envigado' },
    { value: 'Sabaneta', label: 'Sabaneta' },
    { value: 'Rionegro', label: 'Rionegro' },
    { value: 'Apartadó', label: 'Apartadó' },
    { value: 'Turbo', label: 'Turbo' },
  ],
  Arauca: [
    { value: 'Arauca', label: 'Arauca' },
    { value: 'Saravena', label: 'Saravena' },
  ],
  Atlántico: [
    { value: 'Barranquilla', label: 'Barranquilla' },
    { value: 'Soledad', label: 'Soledad' },
    { value: 'Malambo', label: 'Malambo' },
    { value: 'Sabanalarga', label: 'Sabanalarga' },
  ],
  'Bogotá D.C.': [{ value: 'Bogotá', label: 'Bogotá' }],
  Bolívar: [
    { value: 'Cartagena', label: 'Cartagena' },
    { value: 'Magangué', label: 'Magangué' },
    { value: 'Turbaco', label: 'Turbaco' },
    { value: 'El Carmen de Bolívar', label: 'El Carmen de Bolívar' },
  ],
  Boyacá: [
    { value: 'Tunja', label: 'Tunja' },
    { value: 'Duitama', label: 'Duitama' },
    { value: 'Sogamoso', label: 'Sogamoso' },
    { value: 'Chiquinquirá', label: 'Chiquinquirá' },
  ],
  Caldas: [
    { value: 'Manizales', label: 'Manizales' },
    { value: 'Villamaría', label: 'Villamaría' },
    { value: 'La Dorada', label: 'La Dorada' },
    { value: 'Chinchiná', label: 'Chinchiná' },
  ],
  Caquetá: [
    { value: 'Florencia', label: 'Florencia' },
    { value: 'San Vicente del Caguán', label: 'San Vicente del Caguán' },
  ],
  Casanare: [
    { value: 'Yopal', label: 'Yopal' },
    { value: 'Aguazul', label: 'Aguazul' },
  ],
  Cauca: [
    { value: 'Popayán', label: 'Popayán' },
    { value: 'Santander de Quilichao', label: 'Santander de Quilichao' },
    { value: 'Puerto Tejada', label: 'Puerto Tejada' },
  ],
  Cesar: [
    { value: 'Valledupar', label: 'Valledupar' },
    { value: 'Aguachica', label: 'Aguachica' },
    { value: 'Codazzi', label: 'Codazzi' },
  ],
  Chocó: [
    { value: 'Quibdó', label: 'Quibdó' },
    { value: 'Istmina', label: 'Istmina' },
  ],
  Córdoba: [
    { value: 'Montería', label: 'Montería' },
    { value: 'Lorica', label: 'Lorica' },
    { value: 'Cereté', label: 'Cereté' },
    { value: 'Montelíbano', label: 'Montelíbano' },
  ],
  Cundinamarca: [
    { value: 'Soacha', label: 'Soacha' },
    { value: 'Facatativá', label: 'Facatativá' },
    { value: 'Zipaquirá', label: 'Zipaquirá' },
    { value: 'Chía', label: 'Chía' },
    { value: 'Mosquera', label: 'Mosquera' },
    { value: 'Fusagasugá', label: 'Fusagasugá' },
    { value: 'Madrid', label: 'Madrid' },
  ],
  Guainía: [{ value: 'Inírida', label: 'Inírida' }],
  Guaviare: [{ value: 'San José del Guaviare', label: 'San José del Guaviare' }],
  Huila: [
    { value: 'Neiva', label: 'Neiva' },
    { value: 'Pitalito', label: 'Pitalito' },
    { value: 'Garzón', label: 'Garzón' },
    { value: 'La Plata', label: 'La Plata' },
  ],
  'La Guajira': [
    { value: 'Riohacha', label: 'Riohacha' },
    { value: 'Maicao', label: 'Maicao' },
    { value: 'Uribia', label: 'Uribia' },
  ],
  Magdalena: [
    { value: 'Santa Marta', label: 'Santa Marta' },
    { value: 'Ciénaga', label: 'Ciénaga' },
    { value: 'Fundación', label: 'Fundación' },
  ],
  Meta: [
    { value: 'Villavicencio', label: 'Villavicencio' },
    { value: 'Acacías', label: 'Acacías' },
    { value: 'Granada', label: 'Granada' },
  ],
  Nariño: [
    { value: 'Pasto', label: 'Pasto' },
    { value: 'Ipiales', label: 'Ipiales' },
    { value: 'Tumaco', label: 'Tumaco' },
    { value: 'Túquerres', label: 'Túquerres' },
  ],
  'Norte de Santander': [
    { value: 'Cúcuta', label: 'Cúcuta' },
    { value: 'Los Patios', label: 'Los Patios' },
    { value: 'Villa del Rosario', label: 'Villa del Rosario' },
    { value: 'Ocaña', label: 'Ocaña' },
  ],
  Putumayo: [
    { value: 'Mocoa', label: 'Mocoa' },
    { value: 'Puerto Asís', label: 'Puerto Asís' },
  ],
  Quindío: [
    { value: 'Armenia', label: 'Armenia' },
    { value: 'Calarcá', label: 'Calarcá' },
    { value: 'Montenegro', label: 'Montenegro' },
    { value: 'La Tebaida', label: 'La Tebaida' },
  ],
  Risaralda: [
    { value: 'Pereira', label: 'Pereira' },
    { value: 'Dosquebradas', label: 'Dosquebradas' },
    { value: 'Santa Rosa de Cabal', label: 'Santa Rosa de Cabal' },
  ],
  'San Andrés y Providencia': [{ value: 'San Andrés', label: 'San Andrés' }],
  Santander: [
    { value: 'Bucaramanga', label: 'Bucaramanga' },
    { value: 'Floridablanca', label: 'Floridablanca' },
    { value: 'Girón', label: 'Girón' },
    { value: 'Piedecuesta', label: 'Piedecuesta' },
    { value: 'Barrancabermeja', label: 'Barrancabermeja' },
  ],
  Sucre: [
    { value: 'Sincelejo', label: 'Sincelejo' },
    { value: 'Corozal', label: 'Corozal' },
    { value: 'San Marcos', label: 'San Marcos' },
  ],
  Tolima: [
    { value: 'Ibagué', label: 'Ibagué' },
    { value: 'Espinal', label: 'Espinal' },
    { value: 'Melgar', label: 'Melgar' },
    { value: 'Honda', label: 'Honda' },
  ],
  'Valle del Cauca': [
    { value: 'Cali', label: 'Cali' },
    { value: 'Buenaventura', label: 'Buenaventura' },
    { value: 'Palmira', label: 'Palmira' },
    { value: 'Buga', label: 'Buga' },
    { value: 'Tuluá', label: 'Tuluá' },
    { value: 'Cartago', label: 'Cartago' },
    { value: 'Jamundí', label: 'Jamundí' },
  ],
  Vaupés: [{ value: 'Mitú', label: 'Mitú' }],
  Vichada: [{ value: 'Puerto Carreño', label: 'Puerto Carreño' }],
};

export function getDepartamentoFromCiudad(ciudad: string): string {
  if (!ciudad) return '';
  for (const [dep, cities] of Object.entries(CIUDADES_POR_DEPARTAMENTO)) {
    if (cities.some((c) => c.value === ciudad)) return dep;
  }
  return '';
}

export function matchesStatusFilter(
  status: SupplierStatusFilter,
  supplierStatus: SupplierViewModel['status'],
): boolean {
  if (status === 'all') return true;
  return supplierStatus === status;
}

export function matchesPaymentFilter(
  filter: CondicionPagoFilter,
  condicionPago: CondicionPago,
): boolean {
  if (filter === 'all') return true;
  return condicionPago === filter;
}
