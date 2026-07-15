import { z } from 'zod';

const CONTRACT_TERMINATION_REASONS = [
  'RENUNCIA',
  'JUSTA_CAUSA',
  'SIN_JUSTA_CAUSA',
  'MUTUO_ACUERDO',
  'VENCIMIENTO_TERMINO',
  'MUERTE_TRABAJADOR',
  'OTRA',
] as const;

export const finalSettlementTerminationSchema = z
  .object({
    effectiveTerminationDate: z.string().min(1, 'Fecha de terminación requerida'),
    terminationReason: z.enum(CONTRACT_TERMINATION_REASONS, {
      message: 'Selecciona una causal de terminación',
    }),
    estimatedRemainingDays: z.string().optional(),
    estimatedRemainingDaysJustification: z.string().optional(),
  })
  .refine(
    (values) =>
      !values.estimatedRemainingDays || Boolean(values.estimatedRemainingDaysJustification?.trim()),
    {
      message: 'La justificación es obligatoria cuando se estiman días restantes (OBRA/LABOR)',
      path: ['estimatedRemainingDaysJustification'],
    },
  );

export type FinalSettlementTerminationSchema = z.infer<typeof finalSettlementTerminationSchema>;

export const manualSettlementLineSchema = z.object({
  code: z.string().trim().min(1, 'Código requerido'),
  name: z.string().trim().min(1, 'Nombre requerido'),
  type: z.enum(['DEVENGO', 'DEDUCCION']),
  amount: z
    .string()
    .trim()
    .min(1, 'Monto requerido')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Monto inválido',
    }),
  manualJustification: z.string().trim().min(3, 'Justificación requerida por línea'),
});

export const manualSettlementFormSchema = z.object({
  lines: z.array(manualSettlementLineSchema).min(1, 'Agrega al menos una línea'),
  manualJustification: z.string().trim().min(3, 'Justificación requerida'),
  manualReference: z.string().trim().min(1, 'Referencia requerida'),
  manualResponsible: z.string().trim().min(1, 'Responsable requerido'),
});

export type ManualSettlementFormSchema = z.infer<typeof manualSettlementFormSchema>;

export const pendingSalaryReconciliationSchema = z.object({
  previouslyPaidAmount: z
    .string()
    .trim()
    .min(1, 'Monto previamente pagado requerido')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Monto inválido',
    }),
  recognizedBalance: z
    .string()
    .trim()
    .min(1, 'Saldo reconocido requerido')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Monto inválido',
    }),
  paymentReference: z.string().trim().optional(),
  paymentDate: z.string().trim().optional(),
  responsible: z.string().trim().min(1, 'Responsable requerido'),
  observation: z.string().trim().min(3, 'Observación requerida'),
});

export type PendingSalaryReconciliationSchema = z.infer<typeof pendingSalaryReconciliationSchema>;

export const legalFormulaValidationSchema = z.object({
  legalReference: z.string().trim().min(1, 'Referencia legal requerida'),
  observations: z.string().trim().optional(),
});

export type LegalFormulaValidationSchema = z.infer<typeof legalFormulaValidationSchema>;

export const markFinalSettlementPaidSchema = z.object({
  paymentReference: z.string().trim().min(1, 'Referencia de pago requerida'),
  paymentDate: z.string().trim().min(1, 'Fecha de pago requerida'),
});

export type MarkFinalSettlementPaidSchema = z.infer<typeof markFinalSettlementPaidSchema>;

export const voidFinalSettlementSchema = z.object({
  voidReason: z.string().trim().min(3, 'Indica el motivo de anulación'),
});

export type VoidFinalSettlementSchema = z.infer<typeof voidFinalSettlementSchema>;
