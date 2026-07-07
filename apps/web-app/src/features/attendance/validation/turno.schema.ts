import { z } from 'zod';

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const turnoFormSchema = z
  .object({
    locationId: z.string().trim().min(1, 'La sede es obligatoria'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
    sigla: z.string().trim().min(1, 'La sigla es obligatoria').max(30),
    tipo: z.enum(['PERMANENTE', 'VARIABLE'] as const),
    jornada: z.enum(['DIURNO', 'NOCTURNO', 'MIXTO'] as const),
    horaInicio: z.string().regex(HH_MM_REGEX, 'Formato HH:mm'),
    horaFin: z.string().regex(HH_MM_REGEX, 'Formato HH:mm'),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Selecciona al menos un día'),
  })
  .refine((values) => values.horaInicio !== values.horaFin, {
    message: 'Hora fin no puede ser igual a hora inicio',
    path: ['horaFin'],
  });

export type TurnoFormSchema = z.infer<typeof turnoFormSchema>;

export function crossesMidnight(horaInicio: string, horaFin: string): boolean {
  return horaInicio > horaFin;
}
