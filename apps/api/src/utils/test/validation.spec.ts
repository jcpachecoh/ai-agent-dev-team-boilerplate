import { z } from 'zod';
import { ValidationError } from '../errors';
import { CreateRecipeSchema, CreateSupplierSchema, validate } from '../validation';

describe('validate', () => {
  it('returns parsed data when schema passes', () => {
    const data = validate(CreateRecipeSchema, { name: 'Soup' });

    expect(data.name).toBe('Soup');
    expect(data.phases).toEqual([]);
  });

  it('throws ValidationError with field messages when schema fails', () => {
    expect(() =>
      validate(CreateSupplierSchema, {
        razonSocial: 'A',
        nit: '1',
        tipo: 'PERSONA_JURIDICA',
        condicionPago: 'CONTADO',
        email: 'not-an-email',
      }),
    ).toThrow(ValidationError);

    try {
      validate(CreateSupplierSchema, {
        razonSocial: 'A',
        nit: '1',
        tipo: 'PERSONA_JURIDICA',
        condicionPago: 'CONTADO',
        email: 'not-an-email',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields.email?.length).toBeGreaterThan(0);
    }
  });

  it('maps root-level schema failures to _root field', () => {
    try {
      validate(z.string(), 123);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fields._root?.length).toBeGreaterThan(0);
    }
  });
});
