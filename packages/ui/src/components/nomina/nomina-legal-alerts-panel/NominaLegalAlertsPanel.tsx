import type { JSX } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import type { NominaLegalAlertItem, NominaTheme } from '../shared/nomina-types';
import styles from './NominaLegalAlertsPanel.module.scss';

export interface NominaLegalAlertsPanelProps {
  title?: string;
  items?: NominaLegalAlertItem[];
  emptyTitle: string;
  emptyDescription: string;
  theme?: NominaTheme;
  className?: string;
}

export function NominaLegalAlertsPanel({
  title = 'Alertas legales',
  items = [],
  emptyTitle,
  emptyDescription,
  theme = 'dark',
  className,
}: NominaLegalAlertsPanelProps): JSX.Element {
  const hasAlerts = items.length > 0;

  return (
    <section
      className={[styles.panel, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Cumplimiento</p>
        <h2 className={styles.title}>{title}</h2>
      </header>
      {hasAlerts ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <AlertTriangle className={styles.alertIcon} aria-hidden />
              <div className={styles.itemContent}>
                <p className={styles.itemTitle}>{item.title}</p>
                {item.subtitle ? <p className={styles.itemSubtitle}>{item.subtitle}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <CheckCircle2 className={styles.icon} aria-hidden />
          <p className={styles.emptyTitle}>{emptyTitle}</p>
          <p className={styles.emptyDescription}>{emptyDescription}</p>
        </div>
      )}
    </section>
  );
}

export default NominaLegalAlertsPanel;
