import { describe, expect, it } from 'vitest';

import {
  DOTACION_CATEGORY_NOMBRE,
  COMODATOS_CATEGORY_NOMBRE,
  DOTACION_SUBCATEGORIES,
  getGenderOptions,
  getSizeOptions,
} from './dotacion';

describe('dotacion constants', () => {
  it('exports correct category names', () => {
    expect(DOTACION_CATEGORY_NOMBRE).toBe('Dotación');
    expect(COMODATOS_CATEGORY_NOMBRE).toBe('Comodatos');
  });

  it('exports 6 subcategories', () => {
    expect(DOTACION_SUBCATEGORIES).toHaveLength(6);
    expect(DOTACION_SUBCATEGORIES).toContain('Calzado');
    expect(DOTACION_SUBCATEGORIES).toContain('Camisas/Camisetas');
    expect(DOTACION_SUBCATEGORIES).toContain('Pantalones/Overoles');
    expect(DOTACION_SUBCATEGORIES).toContain('Chalecos/Chaquetas');
    expect(DOTACION_SUBCATEGORIES).toContain('Petos/Batas/Delantales');
    expect(DOTACION_SUBCATEGORIES).toContain('Gorras/Guantes/Mangas de seguridad');
  });
});

describe('getGenderOptions', () => {
  it('Calzado solo tiene Unisex', () => {
    expect(getGenderOptions('Calzado')).toEqual(['Unisex']);
  });

  it('Camisas/Camisetas tiene Masculino y Femenino', () => {
    const generos = getGenderOptions('Camisas/Camisetas');
    expect(generos).toContain('Masculino');
    expect(generos).toContain('Femenino');
    expect(generos).toHaveLength(2);
  });

  it('Pantalones/Overoles tiene Masculino y Femenino', () => {
    const generos = getGenderOptions('Pantalones/Overoles');
    expect(generos).toContain('Masculino');
    expect(generos).toContain('Femenino');
  });

  it('Chalecos/Chaquetas solo tiene Unisex', () => {
    expect(getGenderOptions('Chalecos/Chaquetas')).toEqual(['Unisex']);
  });

  it('Petos/Batas/Delantales solo tiene Unisex', () => {
    expect(getGenderOptions('Petos/Batas/Delantales')).toEqual(['Unisex']);
  });

  it('subcategoria desconocida retorna array vacío', () => {
    expect(getGenderOptions('SubcategoriaInvalida')).toEqual([]);
  });
});

describe('getSizeOptions', () => {
  it('Calzado Unisex: tallas 34–42', () => {
    const tallas = getSizeOptions('Calzado', 'Unisex');
    expect(tallas).toContain('34');
    expect(tallas).toContain('42');
    expect(tallas).toHaveLength(9);
  });

  it('Camisas/Camisetas Femenino: XS–XL', () => {
    const tallas = getSizeOptions('Camisas/Camisetas', 'Femenino');
    expect(tallas).toEqual(['XS', 'S', 'M', 'L', 'XL']);
  });

  it('Camisas/Camisetas Masculino: XS–XL', () => {
    const tallas = getSizeOptions('Camisas/Camisetas', 'Masculino');
    expect(tallas).toEqual(['XS', 'S', 'M', 'L', 'XL']);
  });

  it('Pantalones/Overoles Masculino: 28–40', () => {
    const tallas = getSizeOptions('Pantalones/Overoles', 'Masculino');
    expect(tallas).toContain('28');
    expect(tallas).toContain('40');
    expect(tallas).not.toContain('6');
  });

  it('Pantalones/Overoles Femenino: 6–16', () => {
    const tallas = getSizeOptions('Pantalones/Overoles', 'Femenino');
    expect(tallas).toContain('6');
    expect(tallas).toContain('16');
    expect(tallas).not.toContain('28');
  });

  it('Chalecos/Chaquetas Unisex: XS–XXXL', () => {
    const tallas = getSizeOptions('Chalecos/Chaquetas', 'Unisex');
    expect(tallas).toContain('XS');
    expect(tallas).toContain('XXXL');
    expect(tallas).toHaveLength(7);
  });

  it('Petos/Batas/Delantales Unisex incluye N/A y tallas bata', () => {
    const tallas = getSizeOptions('Petos/Batas/Delantales', 'Unisex');
    expect(tallas).toContain('N/A');
    expect(tallas).toContain('XL');
    expect(tallas).toContain('XXXL');
  });

  it('Gorras/Guantes/Mangas de seguridad Unisex: solo N/A', () => {
    const tallas = getSizeOptions('Gorras/Guantes/Mangas de seguridad', 'Unisex');
    expect(tallas).toEqual(['N/A']);
  });

  it('genero inválido para subcategoria retorna array vacío', () => {
    expect(getSizeOptions('Calzado', 'Femenino')).toEqual([]);
  });

  it('subcategoria desconocida retorna array vacío', () => {
    expect(getSizeOptions('SubcategoriaInvalida', 'Unisex')).toEqual([]);
  });
});
