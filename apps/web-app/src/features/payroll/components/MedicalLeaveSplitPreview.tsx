import type {
  MedicalLeaveDetail,
  MedicalLeaveRecord,
  MedicalLeaveSummary,
} from '../types/medical-leaves.types';
import {
  LEAVE_ORIGIN_LABELS,
  formatMedicalLeaveCurrency,
  formatMedicalLeaveDate,
} from '../utils/medical-leaves-display';
import styles from './MedicalLeaveSplitPreview.module.scss';

type SplitSource = Pick<
  MedicalLeaveRecord,
  | 'origin'
  | 'totalDays'
  | 'employerPaidDays'
  | 'epsArlPaidDays'
  | 'employerAmount'
  | 'epsArlAmount'
  | 'startDate'
  | 'endDate'
>;

interface Props {
  leave: SplitSource;
  annualAccumulatedDays?: number;
}

export function MedicalLeaveSplitPreview({
  leave,
  annualAccumulatedDays,
}: Props): React.JSX.Element {
  const payerLabel = leave.origin === 'LABORAL' ? 'ARL' : 'EPS';

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <span className={styles.origin}>{LEAVE_ORIGIN_LABELS[leave.origin]}</span>
        <span className={styles.period}>
          {formatMedicalLeaveDate(leave.startDate)} — {formatMedicalLeaveDate(leave.endDate)}
        </span>
      </div>

      <div className={styles.grid}>
        <div className={styles.metric}>
          <span className={styles.label}>Días totales</span>
          <strong className={styles.value}>{leave.totalDays}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Días empleador</span>
          <strong className={styles.value}>{leave.employerPaidDays}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Días {payerLabel}</span>
          <strong className={styles.value}>{leave.epsArlPaidDays}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Monto empleador</span>
          <strong className={styles.value}>
            {formatMedicalLeaveCurrency(leave.employerAmount)}
          </strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.label}>Monto {payerLabel}</span>
          <strong className={styles.value}>{formatMedicalLeaveCurrency(leave.epsArlAmount)}</strong>
        </div>
      </div>

      {annualAccumulatedDays !== undefined ? (
        <p className={styles.accumulated}>
          Días acumulados en el año: <strong>{annualAccumulatedDays}</strong>
        </p>
      ) : null}

      <p className={styles.note}>
        Los montos se calculan automáticamente según el salario del empleado y las reglas legales.
        No es posible editarlos manualmente.
      </p>
    </div>
  );
}

export function isMedicalLeaveDetail(
  leave: MedicalLeaveSummary | MedicalLeaveDetail,
): leave is MedicalLeaveDetail {
  return 'annualAccumulatedDays' in leave;
}
