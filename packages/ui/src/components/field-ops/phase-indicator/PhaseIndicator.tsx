import type { JSX } from 'react';

import { Skeleton } from '../../feedback/skeleton';
import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './PhaseIndicator.module.scss';

export type OperatorAccent = 'blue' | 'gold' | 'purple' | 'teal';

export interface PhaseOperator {
  id: string;
  name: string;
  initials: string;
  accent?: OperatorAccent;
  /** Elapsed time display, e.g. "47:22" */
  timer?: string;
  active?: boolean;
}

export interface PhaseIndicatorProps {
  title?: string;
  operators: PhaseOperator[];
  loading?: boolean;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export function PhaseIndicator({
  title = 'Operadores en turno',
  operators,
  loading = false,
  theme = 'light',
  size = 'md',
  className,
}: PhaseIndicatorProps): JSX.Element {
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
      <ul className={styles.list}>
        {operators.map((operator, index) => {
          const accent = operator.accent ?? 'blue';
          const isActive = operator.active !== false;

          return (
            <li
              key={operator.id}
              className={[styles.row, index < operators.length - 1 && styles.rowBorder]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[styles.avatar, styles[`accent--${accent}`]].filter(Boolean).join(' ')}
                aria-hidden
              >
                {operator.initials}
              </span>
              <span className={styles.name}>{operator.name}</span>
              {operator.timer && (
                <span className={styles.status}>
                  {isActive && <span className={styles.dot} aria-hidden />}
                  <time className={styles.timer} aria-label={`Tiempo ${operator.timer}`}>
                    {operator.timer}
                  </time>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default PhaseIndicator;
