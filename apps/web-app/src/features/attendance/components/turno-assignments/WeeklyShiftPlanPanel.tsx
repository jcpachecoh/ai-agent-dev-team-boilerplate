import { CargoModal, InventarioPrimaryButton, RecetaFormButton } from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import type { WeeklyShiftPlan, WeeklyShiftPlanStatus } from '../../types/weekly-shift-plan.types';
import { weeklyShiftPlanStatusLabel } from '../../utils/weekly-shift-plan-labels';
import styles from './WeeklyShiftPlanPanel.module.scss';

interface WeeklyShiftPlanPanelProps {
  plans: WeeklyShiftPlan[];
  locationNameById: Map<string, string>;
  canSubmit: boolean;
  canApprove: boolean;
  busyPlanId: string | null;
  theme?: 'light' | 'dark';
  onSubmit: (planId: string) => void;
  onApprove: (planId: string) => void;
  onReject: (planId: string, reason: string) => void;
}

function rowClass(status: WeeklyShiftPlanStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return `${styles.row} ${styles.rowPending}`;
    case 'APPROVED':
      return `${styles.row} ${styles.rowApproved}`;
    case 'REJECTED':
      return `${styles.row} ${styles.rowRejected}`;
    default:
      return `${styles.row} ${styles.rowDraft}`;
  }
}

function badgeClass(status: WeeklyShiftPlanStatus): string {
  switch (status) {
    case 'PENDING_APPROVAL':
      return `${styles.badge} ${styles.badgePending}`;
    case 'APPROVED':
      return `${styles.badge} ${styles.badgeApproved}`;
    case 'REJECTED':
      return `${styles.badge} ${styles.badgeRejected}`;
    default:
      return `${styles.badge} ${styles.badgeDraft}`;
  }
}

function statusHint(plan: WeeklyShiftPlan): string | null {
  if (plan.status === 'APPROVED') {
    return 'Malla operativa. Solo se puede editar el día de hoy.';
  }
  if (plan.status === 'PENDING_APPROVAL') {
    return 'En revisión — aún no alimenta corte ni liquidación.';
  }
  if (plan.status === 'REJECTED' && plan.rejectionReason) {
    return `Motivo: ${plan.rejectionReason}`;
  }
  if (plan.status === 'DRAFT') {
    return 'Editable. Envíala cuando la malla de la sede esté lista.';
  }
  return null;
}

export function WeeklyShiftPlanPanel({
  plans,
  locationNameById,
  canSubmit,
  canApprove,
  busyPlanId,
  theme = 'dark',
  onSubmit,
  onApprove,
  onReject,
}: WeeklyShiftPlanPanelProps): React.JSX.Element | null {
  const [rejectPlanId, setRejectPlanId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const counts: Partial<Record<WeeklyShiftPlanStatus, number>> = {};
    plans.forEach((plan) => {
      counts[plan.status] = (counts[plan.status] ?? 0) + 1;
    });
    return (Object.entries(counts) as Array<[WeeklyShiftPlanStatus, number]>).map(
      ([status, count]) => ({
        status,
        count,
        label: weeklyShiftPlanStatusLabel(status),
      }),
    );
  }, [plans]);

  if (plans.length === 0) {
    return null;
  }

  const closeReject = (): void => {
    setRejectPlanId(null);
    setRejectReason('');
    setRejectError(null);
  };

  const confirmReject = (): void => {
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError('El motivo del rechazo es obligatorio.');
      return;
    }
    if (!rejectPlanId) return;
    onReject(rejectPlanId, trimmed);
    closeReject();
  };

  return (
    <>
      <section className={styles.panel} aria-label="Estado de planeación semanal">
        <header className={styles.header}>
          <h3 className={styles.panelTitle}>Planeación semanal</h3>
          <ul className={styles.summary} aria-label="Resumen por estado">
            {summary.map((item) => (
              <li key={item.status} className={styles.summaryItem}>
                {item.count} {item.label.toLowerCase()}
              </li>
            ))}
          </ul>
        </header>

        <ul className={styles.list}>
          {plans.map((plan) => {
            const busy = busyPlanId === plan.id;
            const locationLabel =
              locationNameById.get(plan.locationId) ?? `Sede ${plan.locationId.slice(0, 8)}`;
            const showSubmit = canSubmit && (plan.status === 'DRAFT' || plan.status === 'REJECTED');
            const showApproveReject = canApprove && plan.status === 'PENDING_APPROVAL';
            const hint = statusHint(plan);

            return (
              <li key={plan.id} className={rowClass(plan.status)}>
                <div className={styles.identity}>
                  <div className={styles.identityTop}>
                    <span className={styles.locationName}>{locationLabel}</span>
                    <span className={badgeClass(plan.status)} data-status={plan.status}>
                      {weeklyShiftPlanStatusLabel(plan.status)}
                    </span>
                  </div>
                  {hint ? <p className={styles.hint}>{hint}</p> : null}
                </div>

                <div className={styles.actions}>
                  {showSubmit ? (
                    <InventarioPrimaryButton
                      label="Enviar a aprobación"
                      variant="primary"
                      showIcon={false}
                      theme={theme}
                      size="sm"
                      disabled={busy}
                      onClick={() => onSubmit(plan.id)}
                    />
                  ) : null}
                  {showApproveReject ? (
                    <>
                      <InventarioPrimaryButton
                        label="Aprobar"
                        variant="primary"
                        showIcon={false}
                        theme={theme}
                        size="sm"
                        disabled={busy}
                        onClick={() => onApprove(plan.id)}
                      />
                      <InventarioPrimaryButton
                        label="Rechazar"
                        variant="ghost"
                        showIcon={false}
                        theme={theme}
                        size="sm"
                        disabled={busy}
                        onClick={() => setRejectPlanId(plan.id)}
                      />
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <CargoModal
        open={Boolean(rejectPlanId)}
        title="Rechazar planeación"
        subtitle="Indique el motivo para que el administrador de sede pueda corregirla."
        theme={theme}
        size="sm"
        onClose={closeReject}
      >
        <div className={styles.rejectBody}>
          <p className={styles.rejectHelp}>El motivo es obligatorio (máx. 500 caracteres).</p>
          <textarea
            className={styles.rejectTextarea}
            value={rejectReason}
            maxLength={500}
            rows={4}
            aria-label="Motivo del rechazo"
            onChange={(event) => {
              setRejectReason(event.target.value);
              setRejectError(null);
            }}
          />
          {rejectError ? <p className={styles.rejectError}>{rejectError}</p> : null}
          <div className={styles.rejectActions}>
            <RecetaFormButton
              type="button"
              variant="cancel"
              label="Cancelar"
              theme={theme}
              onClick={closeReject}
            />
            <RecetaFormButton
              type="button"
              variant="save"
              label="Confirmar rechazo"
              theme={theme}
              onClick={confirmReject}
            />
          </div>
        </div>
      </CargoModal>
    </>
  );
}
