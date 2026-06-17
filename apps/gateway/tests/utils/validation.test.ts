/**
 * Validation utility tests
 *
 * Covers the validate() helper and key Zod schemas.
 */

import {
  validate,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  LoginSchema,
  CreateRecipeSchema,
} from '../../src/utils/validation';
import { ValidationError } from '../../src/utils/errors';

// ─── validate() helper ───────────────────────────────────────────────────────

describe('validate', () => {
  it('returns parsed data on success', () => {
    const result = validate(LoginSchema, {
      cedula: '12345678',
      pin: '1234',
      tenantId: 'tenant-abc',
    });
    expect(result.cedula).toBe('12345678');
    expect(result.pin).toBe('1234');
    expect(result.tenantId).toBe('tenant-abc');
  });

  it('throws ValidationError with field map on failure', () => {
    expect(() => validate(LoginSchema, { cedula: 'ab', pin: '1', tenantId: '' })).toThrow(
      ValidationError,
    );
  });

  it('ValidationError carries the first field message', () => {
    try {
      validate(LoginSchema, { cedula: 'ab', pin: '1', tenantId: '' });
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const ve = err as ValidationError;
      expect(typeof ve.message).toBe('string');
      expect(ve.message.length).toBeGreaterThan(0);
    }
  });
});

// ─── CreateSupplierSchema ────────────────────────────────────────────────────

describe('CreateSupplierSchema', () => {
  const validInput = {
    razonSocial: 'Acme S.A.S.',
    nit: '900123456',
    tipo: 'PERSONA_JURIDICA' as const,
    condicionPago: 'DIAS_30' as const,
  };

  it('parses valid input with defaults', () => {
    const result = CreateSupplierSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cupoCredito).toBe(0);
      expect(result.data.calificacion).toBe(3);
    }
  });

  it('rejects razonSocial shorter than 2 characters', () => {
    const result = CreateSupplierSchema.safeParse({ ...validInput, razonSocial: 'X' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = CreateSupplierSchema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid tipo', () => {
    const result = CreateSupplierSchema.safeParse({ ...validInput, tipo: 'EMPRESA' });
    expect(result.success).toBe(false);
  });

  it('accepts valid optional fields', () => {
    const result = CreateSupplierSchema.safeParse({
      ...validInput,
      email: 'info@acme.com',
      calificacion: 4.5,
      cupoCredito: 1000000,
    });
    expect(result.success).toBe(true);
  });
});

// ─── UpdateSupplierSchema ────────────────────────────────────────────────────

describe('UpdateSupplierSchema', () => {
  it('allows partial updates', () => {
    const result = UpdateSupplierSchema.safeParse({ razonSocial: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('allows toggling isActive', () => {
    const result = UpdateSupplierSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(false);
    }
  });
});

// ─── CreateRecipeSchema ──────────────────────────────────────────────────────

describe('CreateRecipeSchema', () => {
  it('parses a minimal recipe', () => {
    const result = CreateRecipeSchema.safeParse({ name: 'Baguette' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phases).toEqual([]);
    }
  });

  it('rejects name shorter than 2 characters', () => {
    const result = CreateRecipeSchema.safeParse({ name: 'X' });
    expect(result.success).toBe(false);
  });

  it('parses phases with steps', () => {
    const result = CreateRecipeSchema.safeParse({
      name: 'Croissant',
      phases: [{ name: 'Mix', order: 0, steps: ['Add flour', 'Add butter'] }],
    });
    expect(result.success).toBe(true);
  });
});

// ─── LoginSchema ─────────────────────────────────────────────────────────────

describe('LoginSchema', () => {
  it('rejects missing tenantId', () => {
    const result = LoginSchema.safeParse({ cedula: '12345678', pin: '1234' });
    expect(result.success).toBe(false);
  });

  it('rejects pin shorter than 4 chars', () => {
    const result = LoginSchema.safeParse({ cedula: '12345678', pin: '12', tenantId: 't1' });
    expect(result.success).toBe(false);
  });
});
