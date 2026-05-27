import {
  CompletePhaseButton,
  FieldAlertBanner,
  LogoutButton,
  OpsInfoPanel,
  StatusBadge,
  TripActionButton,
  TripProgressStrip,
  type OpsInfoPanelItem,
} from '@restopsiq/ui';
import { ClipboardList, Layers, Scale, Thermometer, User } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { renderLucideIcon } from '@/utils/lucide-icon';

import { usePlantSocket } from '@/hooks/usePlantSocket';
import type { PhaseStatusChangedPayload } from '@/services/plant-socket.service';
import { usePhaseStore } from '@/stores/phase.store';
import { useSessionStore } from '@/stores/session.store';
import { useTimerStore } from '@/stores/timer.store';
import { DoubleTapActionButton } from './components/DoubleTapActionButton';
import { OperatorChipsFooter } from './components/OperatorChipsFooter';
import { PhaseTimerBlock } from './components/PhaseTimerBlock';
import styles from './ActivePhaseScreen.module.scss';

const DEMO_ELAPSED_MS = 12 * 60 * 1000 + 45 * 1000;

export interface ActivePhaseScreenProps {
  onCompletePhase?: () => void;
  onReportIssue?: () => void;
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

export function ActivePhaseScreen({
  onCompletePhase,
  onReportIssue,
  onLogout,
  isLoggingOut = false,
}: ActivePhaseScreenProps): React.JSX.Element {
  const stationId = useSessionStore((s) => s.stationId);
  const operatorName = useSessionStore((s) => s.operator?.operatorName);

  const opId = usePhaseStore((s) => s.opId);
  const productName = usePhaseStore((s) => s.productName);
  const phaseTitle = usePhaseStore((s) => s.phaseTitle);
  const stationAreaLabel = usePhaseStore((s) => s.stationAreaLabel);
  const priority = usePhaseStore((s) => s.priority);
  const standardDurationMs = usePhaseStore((s) => s.standardDurationMs);
  const targetQuantity = usePhaseStore((s) => s.targetQuantity);
  const workflowStatus = usePhaseStore((s) => s.workflowStatus);
  const activeOperatorName = usePhaseStore((s) => s.activeOperatorName);
  const instructions = usePhaseStore((s) => s.instructions);
  const safetyNote = usePhaseStore((s) => s.safetyNote);
  const referenceImageUrl = usePhaseStore((s) => s.referenceImageUrl);
  const operators = usePhaseStore((s) => s.operators);
  const setWorkflowStatus = usePhaseStore((s) => s.setWorkflowStatus);
  const applyPhaseStatusFromSocket = usePhaseStore((s) => s.applyPhaseStatusFromSocket);

  const timerStatus = useTimerStore((s) => s.status);
  const startTimer = useTimerStore((s) => s.start);
  const pauseTimer = useTimerStore((s) => s.pause);
  const resumeTimer = useTimerStore((s) => s.resume);
  const setElapsedMs = useTimerStore((s) => s.setElapsedMs);

  const [clock, setClock] = useState(() => formatClockTime(new Date()));

  const handlePhaseStatusChanged = useCallback(
    (payload: PhaseStatusChangedPayload) => {
      applyPhaseStatusFromSocket(payload.status);
      if (payload.orderId) {
        usePhaseStore.setState({ opId: payload.orderId });
      }
    },
    [applyPhaseStatusFromSocket],
  );

  usePlantSocket({ onPhaseStatusChanged: handlePhaseStatusChanged });

  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClockTime(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (workflowStatus !== 'in_progress') return;
    if (timerStatus !== 'idle') return;
    setElapsedMs(DEMO_ELAPSED_MS);
    startTimer();
  }, [workflowStatus, timerStatus, setElapsedMs, startTimer]);

  const instructionItems: OpsInfoPanelItem[] = useMemo(() => {
    const icons = [
      renderLucideIcon(Thermometer, { size: 20 }),
      renderLucideIcon(Scale, { size: 20 }),
      renderLucideIcon(ClipboardList, { size: 20 }),
      renderLucideIcon(Layers, { size: 20 }),
    ];
    return instructions.map((item, index) => ({
      id: item.id,
      icon: icons[index % icons.length],
      text: (
        <>
          <span className={styles.instructionIndex}></span> {item.text}
        </>
      ),
    }));
  }, [instructions]);

  const handleStartPhase = useCallback(() => {
    setWorkflowStatus('in_progress');
    setElapsedMs(0);
    startTimer();
  }, [setWorkflowStatus, setElapsedMs, startTimer]);

  const handlePauseResume = useCallback(() => {
    if (timerStatus === 'running') {
      pauseTimer();
      return;
    }
    if (timerStatus === 'paused') {
      resumeTimer();
    }
  }, [timerStatus, pauseTimer, resumeTimer]);

  const stationLabel = stationId ?? 'EST-—';
  const headerPhaseLine = `${stationLabel} ${stationAreaLabel.toUpperCase()} · FASE 2`;
  const isUrgent = priority === 'urgent';
  const isInProgress = workflowStatus === 'in_progress';
  const showRunningActions = isInProgress && timerStatus !== 'idle';
  const pauseLabel = timerStatus === 'paused' ? 'Reanudar' : 'Pausar';

  return (
    <div className={styles.screen} data-testid="active-phase-screen">
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <span className={styles.plantBrand}>RestOpsIQ PLANT</span>
        </div>
        <p className={styles.topBarCenter}>{headerPhaseLine}</p>
        <div className={styles.topBarRight}>
          <StatusBadge status="WARNING" variant="pill" animated theme="dark" size="sm" />
          <span className={styles.operatorMeta}>{operatorName ?? activeOperatorName}</span>
          {onLogout && (
            <LogoutButton
              theme="dark"
              size="sm"
              variant="default"
              label="Salir"
              onClick={onLogout}
              loading={isLoggingOut}
              className={styles.logoutButton}
              data-testid="logout-button"
            />
          )}
          <time className={styles.clock} dateTime={clock}>
            {clock}
          </time>
        </div>
      </header>

      <div className={styles.main}>
        <section className={styles.primaryColumn} aria-label="Detalle de fase">
          <div className={styles.phaseIntro}>
            <div className={styles.phaseMetaRow}>
              {isUrgent && (
                <span className={styles.urgentBadge} role="status">
                  <span className={styles.urgentDot} aria-hidden />
                  Urgente
                </span>
              )}
              <span className={styles.opBadge}>
                {opId} {productName}
              </span>
            </div>

            <h1 className={styles.phaseHeading}>{phaseTitle}</h1>

            <p className={styles.activeOperator}>
              <span className={styles.activeOperatorDot} aria-hidden />
              {activeOperatorName} — Operador activo
            </p>
          </div>

          <OpsInfoPanel
            theme="dark"
            size="xl"
            title="Instrucciones de fase"
            items={instructionItems}
            className={styles.instructionsPanel}
          />

          <div className={styles.referenceRow}>
            <div className={styles.visualRef} aria-label="Referencia visual">
              {referenceImageUrl ? (
                <img
                  src={referenceImageUrl}
                  alt="Referencia visual de la fase"
                  loading="lazy"
                  className={styles.visualRefImage}
                />
              ) : (
                <>
                  {renderLucideIcon(User, { size: 40, strokeWidth: 1.25 })}
                  <span>Referencia visual</span>
                </>
              )}
            </div>
            <FieldAlertBanner
              theme="dark"
              size="xl"
              variant="warning"
              title="Nota de seguridad alimentaria"
              className={styles.safetyBanner}
            >
              {safetyNote}
            </FieldAlertBanner>
          </div>
        </section>

        <aside className={styles.sideColumn} aria-label="Métricas y acciones">
          <PhaseTimerBlock standardDurationMs={standardDurationMs} theme="dark" size="md" />

          <TripProgressStrip
            theme="dark"
            size="sm"
            value={targetQuantity}
            className={styles.quantityCard}
          />

          <OperatorChipsFooter operators={operators} theme="dark" />

          <div className={styles.sideActions}>
            {isInProgress && (
              <div className={styles.actionRow}>
                {showRunningActions && (
                  <DoubleTapActionButton
                    className={styles.actionHalf}
                    onConfirm={handlePauseResume}
                    confirmHint="Toca de nuevo para pausar"
                  >
                    {({ onClick }) => (
                      <TripActionButton
                        theme="dark"
                        size="md"
                        variant="pause"
                        label={pauseLabel}
                        className={styles.actionButton}
                        onClick={onClick}
                      />
                    )}
                  </DoubleTapActionButton>
                )}
                <DoubleTapActionButton
                  className={showRunningActions ? styles.actionHalf : styles.actionFull}
                  onConfirm={() => onReportIssue?.()}
                  confirmHint="Toca de nuevo para reportar"
                >
                  {({ onClick }) => (
                    <TripActionButton
                      theme="dark"
                      size="md"
                      variant="report-issue"
                      className={styles.actionButton}
                      onClick={onClick}
                    />
                  )}
                </DoubleTapActionButton>
              </div>
            )}

            {!isInProgress && (
              <DoubleTapActionButton
                onConfirm={handleStartPhase}
                confirmHint="Toca de nuevo para iniciar"
              >
                {({ onClick }) => (
                  <CompletePhaseButton
                    theme="dark"
                    size="xl"
                    variant="confirm"
                    label="Iniciar fase"
                    className={styles.completeButton}
                    onClick={onClick}
                  />
                )}
              </DoubleTapActionButton>
            )}

            {isInProgress && (
              <DoubleTapActionButton
                onConfirm={() => onCompletePhase?.()}
                confirmHint="Toca de nuevo para completar"
              >
                {({ onClick }) => (
                  <CompletePhaseButton
                    theme="dark"
                    size="xl"
                    variant="default"
                    label="Completar fase"
                    className={styles.completeButton}
                    onClick={onClick}
                  />
                )}
              </DoubleTapActionButton>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ActivePhaseScreen;
