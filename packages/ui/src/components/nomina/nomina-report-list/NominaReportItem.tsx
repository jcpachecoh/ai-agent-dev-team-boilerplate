import type { JSX, ReactNode } from 'react';
import { Download } from 'lucide-react';

import type { NominaReportTone, NominaTheme } from '../shared/nomina-types';
import styles from './NominaReportItem.module.scss';

export interface NominaReportItemProps {
  code: string;
  title: string;
  description: string;
  tone?: NominaReportTone;
  icon?: ReactNode;
  onDownload?: () => void;
  theme?: NominaTheme;
  className?: string;
}

export function NominaReportItem({
  code,
  title,
  description,
  tone = 'accent',
  icon,
  onDownload,
  theme = 'dark',
  className,
}: NominaReportItemProps): JSX.Element {
  return (
    <article
      className={[styles.item, styles[`theme--${theme}`], styles[`tone--${tone}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.leading}>
        <span className={styles.code}>{code}</span>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <div className={styles.copy}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
      <button
        type="button"
        className={styles.download}
        onClick={onDownload}
        aria-label={`Descargar ${title}`}
      >
        <Download aria-hidden />
      </button>
    </article>
  );
}

export default NominaReportItem;
