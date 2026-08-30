import type { JSX } from 'react';

import type { NominaPeriodMode, NominaTheme } from '../shared/nomina-types';
import styles from './NominaPeriodToggle.module.scss';

export interface NominaPeriodToggleProps {
  value: NominaPeriodMode;
  onChange?: (value: NominaPeriodMode) => void;
  theme?: NominaTheme;
  className?: string;
}

export function NominaPeriodToggle({
  value,
  onChange,
  theme = 'dark',
  className,
}: NominaPeriodToggleProps): JSX.Element {
  return (
    <div
      className={[styles.root, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label="Periodo de métricas"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'week'}
        className={[styles.option, value === 'week' ? styles.optionActive : ''].join(' ')}
        onClick={() => onChange?.('week')}
      >
        SEMANA
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'month'}
        className={[styles.option, value === 'month' ? styles.optionActive : ''].join(' ')}
        onClick={() => onChange?.('month')}
      >
        MES
      </button>
    </div>
  );
}

export default NominaPeriodToggle;
