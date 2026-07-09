import { TriangleAlert } from 'lucide-react';

import { MEDICAL_LEAVE_180_DAY_WARNING } from '../utils/medical-leaves-display';
import styles from './MedicalLeave180DayBanner.module.scss';

interface Props {
  annualAccumulatedDays?: number;
}

export function MedicalLeave180DayBanner({ annualAccumulatedDays }: Props): React.JSX.Element {
  return (
    <div className={styles.banner} role="alert">
      <TriangleAlert size={18} className={styles.icon} aria-hidden />
      <div className={styles.content}>
        <strong className={styles.title}>Alerta legal — 180 días acumulados</strong>
        <p className={styles.message}>{MEDICAL_LEAVE_180_DAY_WARNING}</p>
        {annualAccumulatedDays !== undefined ? (
          <p className={styles.meta}>
            Días acumulados en el año calendario: <strong>{annualAccumulatedDays}</strong>
          </p>
        ) : null}
      </div>
    </div>
  );
}
