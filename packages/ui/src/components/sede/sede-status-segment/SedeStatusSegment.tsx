import { Check, Circle } from 'lucide-react';
import React, { type JSX } from 'react';

import type { SedeLocationStatus, SedeSize, SedeTheme } from '../shared/sede-types';
import styles from './SedeStatusSegment.module.scss';

export interface SedeStatusSegmentProps {
  value?: SedeLocationStatus;
  onChange?: (value: SedeLocationStatus) => void;
  activeLabel?: string;
  inactiveLabel?: string;
  fieldLabel?: string;
  theme?: SedeTheme;
  size?: SedeSize;
  className?: string;
}

export function SedeStatusSegment({
  value = 'active',
  onChange,
  activeLabel = 'ACTIVA',
  inactiveLabel = 'INACTIVA',
  fieldLabel = 'Estado inicial',
  theme = 'dark',
  size = 'md',
  className,
}: SedeStatusSegmentProps): JSX.Element {
  return (
    <div
      className={[styles.field, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.label}>{fieldLabel}</span>
      <div className={styles.segment} role="group" aria-label={fieldLabel}>
        <button
          type="button"
          className={[styles.button, value === 'active' && styles.active].filter(Boolean).join(' ')}
          aria-pressed={value === 'active'}
          onClick={() => onChange?.('active')}
        >
          <Check aria-hidden />
          <span>{activeLabel}</span>
        </button>
        <button
          type="button"
          className={[styles.button, value === 'inactive' && styles.inactiveSelected]
            .filter(Boolean)
            .join(' ')}
          aria-pressed={value === 'inactive'}
          onClick={() => onChange?.('inactive')}
        >
          <Circle aria-hidden />
          <span>{inactiveLabel}</span>
        </button>
      </div>
    </div>
  );
}

export default SedeStatusSegment;
