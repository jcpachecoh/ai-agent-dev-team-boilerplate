import { z } from 'zod';

export const markPilaExportPaidSchema = z.object({
  planNumber: z.string().trim().min(1, 'Número de planilla requerido').max(64),
  paymentReference: z.string().trim().max(128).optional().or(z.literal('')),
  paidAt: z.string().min(1, 'Fecha de pago requerida'),
});

export type MarkPilaExportPaidSchema = z.infer<typeof markPilaExportPaidSchema>;

export const voidPilaExportSchema = z.object({
  reason: z.string().trim().min(3, 'Motivo obligatorio (mín. 3 caracteres)').max(500),
});

export type VoidPilaExportSchema = z.infer<typeof voidPilaExportSchema>;
