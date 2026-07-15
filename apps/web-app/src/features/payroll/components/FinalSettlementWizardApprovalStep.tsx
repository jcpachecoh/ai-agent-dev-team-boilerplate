import { Button } from '@restopsiq/ui';

import { FinalSettlementStatusBadge } from './FinalSettlementStatusBadge';
import styles from './FinalSettlementWizardApprovalStep.module.scss';
import { SettlementLinesTable } from './SettlementLinesTable';
import type {
  FinalSettlement,
  LegalFormulaValidation,
  PendingSalaryReconciliation,
} from '../types/final-settlement.types';
import { formatCurrencyCop, formatDateOnly } from '../utils/final-settlement-display';

interface Props {
  settlement: FinalSettlement;
  needsLegalValidation: boolean;
  legalValidation: LegalFormulaValidation | null | undefined;
  needsReconciliation: boolean;
  reconciliation: PendingSalaryReconciliation | null | undefined;
  permissions: {
    canCalculate: boolean;
    canValidateLegalFormula: boolean;
    canReconcile: boolean;
    canApprove: boolean;
    canPay: boolean;
    canVoid: boolean;
  };
  busy?: boolean;
  downloadingReceipt?: boolean;
  onOpenLegalValidationModal: () => void;
  onOpenReconciliationModal: () => void;
  onOpenPayModal: () => void;
  onOpenVoidModal: () => void;
  onApprove: () => void;
  onRecalculate: () => void;
  onDownloadReceipt: () => void;
}

/**
 * OS-591 (fase 4) — paso 3: muestra la liquidación persistida y las acciones disponibles
 * según su estado exacto (nunca se infiere un estado distinto al que devuelve el backend).
 * Los gates de aprobación (validación legal / reconciliación) se detectan a partir de los
 * códigos de línea (`INDEMNIZACION`/`SAL_PENDIENTE`) y se resuelven contra los endpoints de
 * lectura correspondientes — el botón «Aprobar» se deshabilita hasta que ambos, si aplican,
 * estén satisfechos (el backend igual los re-valida server-side).
 */
export function FinalSettlementWizardApprovalStep({
  settlement,
  needsLegalValidation,
  legalValidation,
  needsReconciliation,
  reconciliation,
  permissions,
  busy = false,
  downloadingReceipt = false,
  onOpenLegalValidationModal,
  onOpenReconciliationModal,
  onOpenPayModal,
  onOpenVoidModal,
  onApprove,
  onRecalculate,
  onDownloadReceipt,
}: Props): React.JSX.Element {
  const legalValidationPending = needsLegalValidation && !legalValidation;
  const reconciliationPending = needsReconciliation && !reconciliation;
  // Réplica cliente de los otros dos bloqueos de `FinalSettlementService.approve()`
  // (empty_settlement / manual_settlement_insufficient_support) — normalmente
  // inalcanzables por validación de formulario, pero se detectan igual para que el botón
  // Aprobar nunca quede habilitado si el backend los rechazaría de todas formas.
  const hasEmptyLines = settlement.lines.length === 0;
  const hasInsufficientManualSupport =
    settlement.mode === 'MANUAL' &&
    (!settlement.manualJustification?.trim() ||
      !settlement.manualReference?.trim() ||
      !settlement.manualResponsible?.trim());
  const canAttemptApprove =
    settlement.status === 'CALCULATED' &&
    !legalValidationPending &&
    !reconciliationPending &&
    !hasEmptyLines &&
    !hasInsufficientManualSupport &&
    permissions.canApprove;
  // El comprobante solo existe para liquidaciones con snapshot completo — DRAFT no llega a
  // este paso y VOIDED fue anulada (mismo criterio que el backend, ver
  // `RECEIPT_AVAILABLE_STATUSES` en `FinalSettlementReceiptPdfService`).
  const canDownloadReceipt =
    settlement.status === 'CALCULATED' ||
    settlement.status === 'APPROVED' ||
    settlement.status === 'PAID';

  return (
    <div className={styles.stepBody}>
      <div className={styles.header}>
        <FinalSettlementStatusBadge status={settlement.status} />
        <span className={styles.modeTag}>
          {settlement.mode === 'MANUAL' ? 'Manual' : 'Automática'}
        </span>
        {canDownloadReceipt ? (
          <Button
            className={styles.receiptButton}
            variant="secondary"
            size="small"
            onClick={onDownloadReceipt}
            disabled={downloadingReceipt}
          >
            {downloadingReceipt ? 'Generando…' : 'Descargar comprobante'}
          </Button>
        ) : null}
      </div>

      <SettlementLinesTable
        lines={settlement.lines}
        grossDevengados={settlement.grossDevengados}
        totalDeducciones={settlement.totalDeducciones}
        netAmount={settlement.netAmount}
        netNegativeAmount={settlement.snapshotNetNegativeAmount}
      />

      {settlement.status === 'CALCULATED' ? (
        <div className={styles.gates}>
          {needsLegalValidation ? (
            <div className={legalValidationPending ? styles.gateBlocked : styles.gateOk}>
              <span>
                {legalValidationPending
                  ? 'Falta validar la fórmula legal de indemnización (versión ' +
                    `${settlement.snapshotFormulaVersion})`
                  : `Fórmula legal validada (versión ${settlement.snapshotFormulaVersion})`}
              </span>
              {legalValidationPending ? (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={onOpenLegalValidationModal}
                  disabled={busy || !permissions.canValidateLegalFormula}
                >
                  Validar fórmula legal
                </Button>
              ) : null}
            </div>
          ) : null}

          {needsReconciliation ? (
            <div className={reconciliationPending ? styles.gateBlocked : styles.gateOk}>
              <span>
                {reconciliationPending
                  ? 'Falta reconciliar el tramo de salario pendiente'
                  : 'Salario pendiente reconciliado'}
              </span>
              {reconciliationPending ? (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={onOpenReconciliationModal}
                  disabled={busy || !permissions.canReconcile}
                >
                  Reconciliar salario pendiente
                </Button>
              ) : null}
            </div>
          ) : null}

          {hasEmptyLines ? (
            <div className={styles.gateBlocked}>
              <span>
                La liquidación no tiene líneas — anúlala y vuelve a calcularla o regístrala
                manualmente con al menos una línea.
              </span>
            </div>
          ) : null}

          {hasInsufficientManualSupport ? (
            <div className={styles.gateBlocked}>
              <span>
                Falta justificación, referencia o responsable de esta liquidación manual — anúlala y
                regístrala nuevamente con el soporte completo.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {settlement.status === 'APPROVED' ? (
        <p className={styles.infoLine}>
          Aprobada por {settlement.approvedBy ?? '—'} el {formatDateOnly(settlement.approvedAt)}. El
          contrato activo del empleado quedó terminado.
        </p>
      ) : null}

      {settlement.status === 'PAID' ? (
        <p className={styles.infoLine}>
          Pagada el {formatDateOnly(settlement.paymentDate)} · referencia{' '}
          {settlement.paymentReference ?? '—'} · {formatCurrencyCop(settlement.netAmount)}
        </p>
      ) : null}

      {settlement.status === 'VOIDED' ? (
        <p className={styles.infoLine}>
          Anulada por {settlement.voidedBy ?? '—'} el {formatDateOnly(settlement.voidedAt)} ·
          motivo: {settlement.voidReason ?? '—'}
        </p>
      ) : null}

      <div className={styles.actions}>
        {settlement.status === 'CALCULATED' ? (
          <>
            <Button
              variant="secondary"
              size="medium"
              onClick={onRecalculate}
              disabled={busy || !permissions.canCalculate}
            >
              Recalcular
            </Button>
            <Button
              variant="danger"
              size="medium"
              onClick={onOpenVoidModal}
              disabled={busy || !permissions.canVoid}
            >
              Anular
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={onApprove}
              disabled={busy || !canAttemptApprove}
            >
              Aprobar
            </Button>
          </>
        ) : null}

        {settlement.status === 'APPROVED' ? (
          <Button
            variant="primary"
            size="medium"
            onClick={onOpenPayModal}
            disabled={busy || !permissions.canPay}
          >
            Marcar como pagada
          </Button>
        ) : null}
      </div>

      {!permissions.canCalculate ? (
        <p className={styles.permissionHint}>
          Tu rol no tiene el permiso <code>nomina.settlement.*</code> necesario para completar
          algunas acciones de este flujo — contacta a un administrador.
        </p>
      ) : null}
    </div>
  );
}
