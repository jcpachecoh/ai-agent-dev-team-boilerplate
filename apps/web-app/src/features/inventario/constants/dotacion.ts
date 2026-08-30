export const DOTACION_CATEGORY_NOMBRE = 'Dotación';
export const COMODATOS_CATEGORY_NOMBRE = 'Comodatos';

export const DOTACION_SUBCATEGORIES = [
  'Calzado',
  'Camisas/Camisetas',
  'Pantalones/Overoles',
  'Chalecos/Chaquetas',
  'Petos/Batas/Delantales',
  'Gorras/Guantes/Mangas de seguridad',
] as const;

export type DotacionSubcategoria = (typeof DOTACION_SUBCATEGORIES)[number];

export const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Unisex'] as const;
export type Genero = (typeof GENDER_OPTIONS)[number];

const TALLAS: Record<DotacionSubcategoria, Record<string, string[]>> = {
  Calzado: {
    Unisex: ['34', '35', '36', '37', '38', '39', '40', '41', '42'],
  },
  'Camisas/Camisetas': {
    Masculino: ['XS', 'S', 'M', 'L', 'XL'],
    Femenino: ['XS', 'S', 'M', 'L', 'XL'],
  },
  'Pantalones/Overoles': {
    Masculino: ['28', '30', '32', '34', '36', '38', '40'],
    Femenino: ['6', '8', '10', '12', '14', '16'],
  },
  'Chalecos/Chaquetas': {
    Unisex: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  },
  'Petos/Batas/Delantales': {
    Unisex: ['N/A', 'XL', 'XXL', 'XXXL'],
  },
  'Gorras/Guantes/Mangas de seguridad': {
    Unisex: ['N/A'],
  },
};

export function getGenderOptions(subcategoria: string): string[] {
  const entry = TALLAS[subcategoria as DotacionSubcategoria];
  return entry ? Object.keys(entry) : [];
}

export function getSizeOptions(subcategoria: string, genero: string): string[] {
  const entry = TALLAS[subcategoria as DotacionSubcategoria];
  return entry?.[genero] ?? [];
}
