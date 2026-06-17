import * as React from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './PhaseSummaryPanel.module.scss';

export type PhaseSummaryValueTone = 'default' | 'gold' | 'success';

export interface PhaseSummaryRow {
  id: string;
  label: string;
  value: React.ReactNode;
  tone?: PhaseSummaryValueTone;
}

export interface PhaseSummaryPanelProps {
  title?: string;
  rows: PhaseSummaryRow[];
  loading?: boolean;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function PhaseSummaryPanel({
  title = 'Resumen de fase',
  rows,
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}: PhaseSummaryPanelProps): React.JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  if (loading) {
    return (
      <section
        className={[styles.panel, sizeClass, themeClass, className].filter(Boolean).join(' ')}
        aria-busy
      >
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </section>
    );
  }

  return (
    <section className={[styles.panel, sizeClass, themeClass, className].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </header>
      <dl className={styles.list}>
        {rows.map((row) => (
          <div key={row.id} className={styles.row}>
            <dt className={styles.label}>{row.label}</dt>
            <dd
              className={[
                styles.value,
                row.tone && row.tone !== 'default' && styles[`tone--${row.tone}`],
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default PhaseSummaryPanel;
