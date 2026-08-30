import { z } from 'zod';

export const employeeAssetSchema = z.object({
  assetName: z
    .string()
    .trim()
    .min(1, 'El nombre del activo es obligatorio')
    .max(200, 'El nombre no puede superar 200 caracteres'),
  type: z.enum(['EDUCATIONAL', 'FINANCIAL', 'LEGAL', 'DEPENDANTS'] as const, {
    message: 'Selecciona una categoría válida',
  }),
  value: z
    .string()
    .min(1, 'El valor es obligatorio')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: 'El valor debe ser mayor a 0',
    }),
  assignmentDate: z.string().optional(),
  notes: z.string().max(500, 'Las observaciones no pueden superar 500 caracteres').optional(),
});

export type EmployeeAssetFormValues = z.infer<typeof employeeAssetSchema>;
