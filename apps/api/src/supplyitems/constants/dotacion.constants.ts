export const DOTACION_CATEGORY_NOMBRE = 'Dotación';

export const DOTACION_SUBCATEGORIAS = [
  'Calzado',
  'Camisas/Camisetas',
  'Pantalones/Overoles',
  'Chalecos/Chaquetas',
  'Petos/Batas/Delantales',
  'Gorras/Guantes/Mangas de seguridad',
] as const;

export type DotacionSubcategoria = (typeof DOTACION_SUBCATEGORIAS)[number];

export const GENEROS = ['Masculino', 'Femenino', 'Unisex'] as const;
export type Genero = (typeof GENEROS)[number];

// Allowed tallas per subcategoria and genero.
// Subcategorias with a single Unisex key apply the same tallas regardless of gender.
export const DOTACION_TALLAS: Record<DotacionSubcategoria, Record<string, string[]>> = {
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

export function getAllowedGeneros(subcategoria: DotacionSubcategoria): string[] {
  return Object.keys(DOTACION_TALLAS[subcategoria]);
}

export function getAllowedTallas(subcategoria: DotacionSubcategoria, genero: string): string[] {
  return DOTACION_TALLAS[subcategoria][genero] ?? [];
}
