export interface ColombiaDepartment {
  code: string;
  name: string;
}

export const COLOMBIA_DEPARTMENTS: ColombiaDepartment[] = [
  { code: '05', name: 'Antioquia' },
  { code: '08', name: 'Atlántico' },
  { code: '11', name: 'Bogotá D.C.' },
  { code: '13', name: 'Bolívar' },
  { code: '15', name: 'Boyacá' },
  { code: '17', name: 'Caldas' },
  { code: '18', name: 'Caquetá' },
  { code: '19', name: 'Cauca' },
  { code: '20', name: 'Cesar' },
  { code: '23', name: 'Córdoba' },
  { code: '25', name: 'Cundinamarca' },
  { code: '27', name: 'Chocó' },
  { code: '41', name: 'Huila' },
  { code: '44', name: 'La Guajira' },
  { code: '47', name: 'Magdalena' },
  { code: '50', name: 'Meta' },
  { code: '52', name: 'Nariño' },
  { code: '54', name: 'Norte de Santander' },
  { code: '63', name: 'Quindío' },
  { code: '66', name: 'Risaralda' },
  { code: '68', name: 'Santander' },
  { code: '70', name: 'Sucre' },
  { code: '73', name: 'Tolima' },
  { code: '76', name: 'Valle del Cauca' },
];

export const COLOMBIA_CITIES_BY_DEPARTMENT: Record<string, string[]> = {
  '05': ['Medellín', 'Bello', 'Envigado', 'Itagüí', 'Rionegro'],
  '08': ['Barranquilla', 'Soledad', 'Malambo'],
  '11': ['Bogotá'],
  '13': ['Cartagena', 'Magangué'],
  '15': ['Tunja', 'Duitama', 'Sogamoso'],
  '17': ['Manizales', 'Pereira'],
  '18': ['Florencia'],
  '19': ['Popayán'],
  '20': ['Valledupar'],
  '23': ['Montería', 'Lorica'],
  '25': ['Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Girardot'],
  '27': ['Quibdó'],
  '41': ['Neiva', 'Pitalito'],
  '44': ['Riohacha', 'Maicao'],
  '47': ['Santa Marta', 'Ciénaga'],
  '50': ['Villavicencio'],
  '52': ['Pasto', 'Tumaco'],
  '54': ['Cúcuta', 'Ocaña'],
  '63': ['Armenia', 'Calarcá'],
  '66': ['Pereira', 'Dosquebradas'],
  '68': ['Bucaramanga', 'Floridablanca', 'Girón'],
  '70': ['Sincelejo'],
  '73': ['Ibagué', 'Espinal'],
  '76': ['Cali', 'Palmira', 'Buenaventura', 'Tuluá'],
};

export function listColombiaDepartments(): ColombiaDepartment[] {
  return COLOMBIA_DEPARTMENTS;
}

export function listColombiaCities(departmentCode: string): string[] {
  return COLOMBIA_CITIES_BY_DEPARTMENT[departmentCode] ?? [];
}

export function resolveDepartmentName(departmentCode: string): string | null {
  return COLOMBIA_DEPARTMENTS.find((item) => item.code === departmentCode)?.name ?? null;
}
