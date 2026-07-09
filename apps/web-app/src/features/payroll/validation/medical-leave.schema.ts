import { z } from 'zod';

export const medicalLeaveFormSchema = z
  .object({
    employeeId: z.string().min(1, 'Selecciona un empleado'),
    origin: z.enum(['COMUN', 'LABORAL']),
    startDate: z.string().min(1, 'Fecha inicio requerida'),
    endDate: z.string().min(1, 'Fecha fin requerida'),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: 'La fecha fin debe ser posterior o igual a la fecha inicio',
    path: ['endDate'],
  });

export type MedicalLeaveFormSchema = z.infer<typeof medicalLeaveFormSchema>;
