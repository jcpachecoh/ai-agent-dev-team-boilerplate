// OS-591 (fase 5) — Comprobante PDF de liquidación definitiva. Generado EXCLUSIVAMENTE a
// partir del snapshot ya persistido en `FinalSettlement`/`SettlementLine` — nunca recalcula
// montos (ver `FinalSettlementReceiptPdfService`). No incluye texto de "paz y salvo" ni
// declaraciones legales de liberación de responsabilidad — es un comprobante factual, no un
// documento de renuncia a reclamaciones.

export type FinalSettlementReceiptResult = {
  buffer: Buffer;
  filename: string;
};

export interface IFinalSettlementReceiptPdfService {
  /**
   * Disponible únicamente para liquidaciones CALCULATED/APPROVED/PAID (DRAFT no tiene
   * snapshot completo; VOIDED fue anulada y no debe emitir comprobante). Sube una copia a
   * `StorageService` (dominio PAYROLL, entityType `FinalSettlement`) como evidencia
   * auditable de qué contenido exacto se generó/entregó, y devuelve el mismo buffer para
   * la respuesta HTTP (no hace falta releerlo del storage).
   */
  generateReceiptPdf(
    tenantId: string,
    id: string,
    generatedBy: string,
  ): Promise<FinalSettlementReceiptResult>;
}
