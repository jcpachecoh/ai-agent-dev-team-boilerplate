import { z } from 'zod';

import { ValidationError } from '../utils/errors';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const SupplierLogisticsInputSchema = z.object({
  deliveryMode: z.enum(['SUPPLIER_DELIVERS', 'COMPANY_PICKUP']).optional().nullable(),
  deliveryPlace: z.enum(['PLANT', 'PDV', 'WAREHOUSE', 'OTHER']).optional().nullable(),
  deliveryPlaceCustom: z.string().max(200).optional().nullable(),
  deliveryDays: z.array(z.number().int().min(1).max(6)).optional(),
  leadTimeDays: z.number().int().positive().optional().nullable(),
  timeWindowStart: z.string().regex(timePattern, 'Formato HH:mm').optional().nullable(),
  timeWindowEnd: z.string().regex(timePattern, 'Formato HH:mm').optional().nullable(),
  receptionResponsibleUserId: z.string().min(1).optional().nullable(),
  transportType: z.enum(['OWN', 'THIRD_PARTY']).optional().nullable(),
  requiresColdChain: z.boolean().optional(),
  transportTempMinC: z.number().optional().nullable(),
  transportTempMaxC: z.number().optional().nullable(),
  transportCost: z.number().min(0).optional().nullable(),
  transportCostCurrency: z.enum(['COP', 'USD']).optional().nullable(),
  minimumOrderQty: z.number().min(0).optional().nullable(),
  minimumOrderUnit: z.string().max(50).optional().nullable(),
  coverageLocationIds: z.array(z.string().min(1)).optional(),
});

export type ParsedSupplierLogisticsInput = z.infer<typeof SupplierLogisticsInputSchema>;

function compareTimes(start: string, end: string): boolean {
  return start <= end;
}

export function validateSupplierLogisticsInput(
  input: unknown,
  saveAsDraft: boolean,
): ParsedSupplierLogisticsInput {
  const parsed = SupplierLogisticsInputSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.') || '_root';
      fields[key] = [...(fields[key] ?? []), issue.message];
    }
    const firstMessage = Object.values(fields).flat()[0] ?? 'Validation failed';
    throw new ValidationError(firstMessage, fields);
  }

  if (saveAsDraft) {
    return parsed.data;
  }

  const data = parsed.data;
  const errors: Record<string, string[]> = {};

  const requireField = (field: keyof ParsedSupplierLogisticsInput, message: string): void => {
    const value = data[field];
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      errors[field] = [message];
    }
  };

  requireField('deliveryMode', 'Modalidad de entrega es requerida');
  requireField('deliveryPlace', 'Lugar de entrega es requerido');
  requireField('leadTimeDays', 'Lead time es requerido');
  requireField('receptionResponsibleUserId', 'Responsable de recepción es requerido');
  requireField('transportType', 'Tipo de transporte es requerido');

  if (!data.deliveryDays || data.deliveryDays.length === 0) {
    errors.deliveryDays = ['Selecciona al menos un día de entrega'];
  }

  if (data.deliveryPlace === 'OTHER' && !data.deliveryPlaceCustom?.trim()) {
    errors.deliveryPlaceCustom = ['Indica el lugar de entrega personalizado'];
  }

  if (
    data.timeWindowStart &&
    data.timeWindowEnd &&
    !compareTimes(data.timeWindowStart, data.timeWindowEnd)
  ) {
    errors.timeWindowEnd = ['La hora fin debe ser posterior a la hora inicio'];
  }

  const requiresColdChain = data.requiresColdChain ?? false;
  if (requiresColdChain) {
    if (data.transportTempMinC === undefined || data.transportTempMinC === null) {
      errors.transportTempMinC = ['Temperatura mínima requerida con cadena de frío'];
    }
    if (data.transportTempMaxC === undefined || data.transportTempMaxC === null) {
      errors.transportTempMaxC = ['Temperatura máxima requerida con cadena de frío'];
    }
  }

  if (Object.keys(errors).length > 0) {
    const firstMessage = Object.values(errors).flat()[0] ?? 'Validation failed';
    throw new ValidationError(firstMessage, errors);
  }

  return data;
}
