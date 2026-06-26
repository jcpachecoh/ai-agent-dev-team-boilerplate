import { z } from 'zod';

import { parseEmployeePositionSalary } from '../types/employee-position.types';

export const employeePositionFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El nombre del cargo es obligatorio')
    .max(120, 'Máximo 120 caracteres'),
  area: z.string().trim().min(1, 'El área es obligatoria'),
  baseSalaryRange: z
    .string()
    .trim()
    .min(1, 'El salario base es obligatorio')
    .refine((value) => parseEmployeePositionSalary(value) > 0, {
      message: 'El salario base debe ser mayor a 0',
    }),
  isActive: z.boolean(),
});

export type EmployeePositionFormSchema = z.infer<typeof employeePositionFormSchema>;

export function validateEmployeePositionForm(
  values: EmployeePositionFormSchema,
): Record<string, string> {
  const result = employeePositionFormSchema.safeParse(values);
  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
