import {
  CompletePhaseButton,
  DecimalKeypad,
  FieldAlertBanner,
  FieldObservationsPanel,
  PhaseBackButton,
  PhaseCompletionHeader,
  PhaseInfoCard,
  PhaseSummaryPanel,
  QuantityInputDisplay,
  QuantityUnitToggle,
  type PhaseSummaryRow,
  type QuantityUnitOption,
} from '@restopsiq/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { DoubleTapActionButton } from '@/screens/ActivePhaseScreen/components/DoubleTapActionButton';
import { submitPhaseCompletion } from '@/services/phase.service';
import { usePhaseStore } from '@/stores/phase.store';
import { useSessionStore } from '@/stores/session.store';
import { useTimerStore, formatElapsed } from '@/stores/timer.store';
import {
  applyDecimalKey,
  buildTargetHint,
  formatQuantityWithUnit,
  parseQuantityNumeric,
} from '@/utils/decimal-quantity';
import styles from './CompletePhaseScreen.module.scss';

const DEFAULT_QUANTITY = '48.5';
const PRODUCTION_UNITS = ['kg', 'un'] as const;

export type ProductionUnit = (typeof PRODUCTION_UNITS)[number];

const UNIT_OPTIONS: QuantityUnitOption[] = [
  { value: 'kg', label: 'kg' },
  { value: 'un', label: 'un' },
];

export interface CompletePhaseScreenProps {
  onBack?: () => void;
  onCompleteSuccess?: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function CompletePhaseScreen({
  onBack,
  onCompleteSuccess,
  onLogout,
  isLoggingOut = false,
}: CompletePhaseScreenProps): React.JSX.Element {
  const stationId = useSessionStore((s) => s.stationId);

  const opId = usePhaseStore((s) => s.opId);
  const stepId = usePhaseStore((s) => s.stepId);
  const productName = usePhaseStore((s) => s.productName);
  const phaseTitle = usePhaseStore((s) => s.phaseTitle);
  const stationAreaLabel = usePhaseStore((s) => s.stationAreaLabel);
  const phaseIndex = usePhaseStore((s) => s.phaseIndex);
  const phaseTotal = usePhaseStore((s) => s.phaseTotal);
  const targetQuantityAmount = usePhaseStore((s) => s.targetQuantityAmount);
  const resetAfterPhaseComplete = usePhaseStore((s) => s.resetAfterPhaseComplete);

  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const resetTimer = useTimerStore((s) => s.reset);

  const [quantity, setQuantity] = useState(DEFAULT_QUANTITY);
  const [unit, setUnit] = useState<ProductionUnit>('kg');
  const [notes, setNotes] = useState('');
  const [clock, setClock] = useState(() => formatClockTime(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClockTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  const actualAmount = parseQuantityNumeric(quantity);
  const canConfirm = actualAmount > 0 && !isSubmitting;
  const quantityHint = buildTargetHint(targetQuantityAmount, actualAmount, unit);
  const elapsedLabel = formatElapsed(elapsedMs).replace(/^00:/, '');

  const summaryRows: PhaseSummaryRow[] = useMemo(
    () => [
      { id: 'phase', label: 'Fase', value: `${phaseIndex} de ${phaseTotal}` },
      { id: 'op', label: 'OP', value: opId },
      { id: 'time', label: 'Tiempo', value: elapsedLabel, tone: 'gold' },
      { id: 'target', label: 'Meta', value: `${targetQuantityAmount.toFixed(1)} ${unit}` },
      {
        id: 'actual',
        label: 'Real',
        value: formatQuantityWithUnit(quantity || '0', unit),
        tone: 'success',
      },
    ],
    [phaseIndex, phaseTotal, opId, elapsedLabel, targetQuantityAmount, unit, quantity],
  );

  const handleKeypad = useCallback((key: string) => {
    setQuantity((current) => applyDecimalKey(current, key));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || !stationId) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setOfflineQueued(false);

    try {
      const idempotencyKey = `${opId}-${Date.now()}`;
      const result = await submitPhaseCompletion({
        opId,
        stepId,
        stationId,
        quantity: actualAmount,
        unit,
        notes: notes.trim() || undefined,
        elapsedMs,
        idempotencyKey,
      });

      if (result === 'queued') {
        setOfflineQueued(true);
      }

      resetTimer();
      resetAfterPhaseComplete();
      onCompleteSuccess?.();
    } catch {
      setSubmitError('No se pudo completar la fase. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canConfirm,
    stationId,
    opId,
    actualAmount,
    unit,
    notes,
    elapsedMs,
    resetTimer,
    resetAfterPhaseComplete,
    onCompleteSuccess,
  ]);

  const stationLabel = stationId ?? 'EST-—';
  const headerTitle = stationAreaLabel.toUpperCase();

  return (
    <div className={`screen-operator ${styles.screen}`} data-testid="complete-phase-screen">
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.plantBrand}>RestOpsIQ PLANT</span>
          <span className={styles.stationBadge}>{stationLabel}</span>
          {onLogout && (
            <button
              type="button"
              className={styles.logoutButton}
              onClick={onLogout}
              disabled={isLoggingOut}
              data-testid="logout-button"
            >
              {isLoggingOut ? 'Saliendo…' : 'Salir'}
            </button>
          )}
        </div>
        <p className={styles.topBarCenter}>
          <span className={styles.headerTitle}>{headerTitle}</span>
          <span className={styles.headerSubtitle}>· Completar fase</span>
        </p>
        <div className={styles.topBarRight}>
          <span className={styles.systemOk} role="status">
            <span className={styles.systemOkDot} aria-hidden />
            Sistema OK
          </span>
          <time className={styles.clock} dateTime={clock}>
            {clock}
          </time>
        </div>
      </header>

      {(offlineQueued || submitError) && (
        <div className={styles.bannerStack}>
          {offlineQueued && (
            <FieldAlertBanner theme="dark" size="sm" variant="warning" title="Sin conexión">
              Se sincronizará al reconectar.
            </FieldAlertBanner>
          )}
          {submitError && (
            <FieldAlertBanner theme="dark" size="sm" variant="warning" title="Error">
              {submitError}
            </FieldAlertBanner>
          )}
        </div>
      )}

      <div className={styles.main}>
        <section className={styles.primaryColumn} aria-label="Cantidad producida">
          <div className={styles.primaryStack}>
            <PhaseCompletionHeader
              theme="dark"
              size="xl"
              className={`${styles.blockAlign} ${styles.completionHeader}`}
            />
            <PhaseInfoCard
              theme="dark"
              size="sm"
              className={styles.blockAlign}
              opId={opId}
              phaseLabel={phaseTitle}
              productName={productName}
            />
            <div className={styles.quantityBlock} data-testid="quantity-display">
              <QuantityInputDisplay
                theme="dark"
                size="md"
                className={styles.blockAlign}
                value={quantity || '0'}
                unit={unit}
                hint={quantityHint}
              />
              <QuantityUnitToggle
                theme="dark"
                size="sm"
                className={styles.unitToggle}
                options={UNIT_OPTIONS}
                value={unit}
                onChange={(next) => setUnit(next as ProductionUnit)}
              />
            </div>
            <div className={styles.keypadArea}>
              <DecimalKeypad
                theme="dark"
                size="md"
                className={styles.keypad}
                onKeyPress={handleKeypad}
                onBackspace={() => setQuantity((current) => applyDecimalKey(current, 'backspace'))}
              />
            </div>
          </div>
        </section>

        <aside className={styles.sideColumn} aria-label="Resumen y confirmación">
          <div className={styles.sideContent}>
            <FieldObservationsPanel
              theme="dark"
              size="sm"
              className={`${styles.sidebarBlock} ${styles.observations}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <PhaseSummaryPanel
              theme="dark"
              size="sm"
              className={`${styles.sidebarBlock} ${styles.summary}`}
              rows={summaryRows}
            />
          </div>
          <div className={styles.sideActions}>
            <PhaseBackButton
              theme="dark"
              size="xl"
              className={styles.backButton}
              onClick={() => onBack?.()}
            />
            <DoubleTapActionButton
              className={styles.confirmWrap}
              onConfirm={() => void handleConfirm()}
              confirmHint="Toca de nuevo para confirmar"
            >
              {({ onClick }) => (
                <CompletePhaseButton
                  theme="dark"
                  size="md"
                  variant="confirm"
                  className={styles.confirmButton}
                  disabled={!canConfirm}
                  loading={isSubmitting}
                  onClick={onClick}
                />
              )}
            </DoubleTapActionButton>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CompletePhaseScreen;
