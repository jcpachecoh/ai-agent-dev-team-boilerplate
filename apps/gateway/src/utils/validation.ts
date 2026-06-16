import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errors';

// ─── Supplier ────────────────────────────────────────────────────────────────

export const CreateSupplierSchema = z.object({
  razonSocial: z.string().min(2, 'razonSocial must be at least 2 characters').max(200),
  nit: z.string().min(5, 'nit must be at least 5 characters').max(20),
  dv: z.string().max(2).optional(),
  tipo: z.enum(['PERSONA_NATURAL', 'PERSONA_JURIDICA']),
  direccion: z.string().max(300).optional(),
  ciudad: z.string().max(100).optional(),
  telefono: z.string().max(30).optional(),
  email: z.string().email().optional(),
  contactoNombre: z.string().max(150).optional(),
  condicionPago: z.enum(['CONTADO', 'DIAS_15', 'DIAS_30', 'DIAS_60']),
  cupoCredito: z.number().int().min(0).default(0),
  calificacion: z.number().min(0).max(5).default(3),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Recipe ──────────────────────────────────────────────────────────────────

export const CreateRecipeSchema = z.object({
  name: z.string().min(2, 'Recipe name must be at least 2 characters').max(200),
  description: z.string().max(1000).optional(),
  phases: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        order: z.number().int().min(0),
        steps: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  yieldAmount: z.number().min(0).optional(),
  yieldUnit: z.string().max(30).optional(),
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  cedula: z.string().min(4, 'Cedula must be at least 4 characters').max(20),
  pin: z.string().min(4, 'PIN must be at least 4 characters').max(8),
  tenantId: z.string().min(1, 'tenantId is required'),
});

// ─── Helper ──────────────────────────────────────────────────────────────────

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = flattenZodErrors(result.error);
    const firstMessage = Object.values(fields).flat()[0] ?? 'Validation failed';
    throw new ValidationError(firstMessage, fields);
  }
  return result.data;
}

function flattenZodErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    if (!fields[key]) fields[key] = [];
    fields[key].push(issue.message);
  }
  return fields;
}
