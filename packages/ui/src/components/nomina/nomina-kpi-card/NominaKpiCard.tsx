import type { JSX, ReactNode } from 'react';

import type { NominaKpiTone, NominaTheme } from '../shared/nomina-types';
import styles from './NominaKpiCard.module.scss';

export interface NominaKpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  tone?: NominaKpiTone;
  theme?: NominaTheme;
  className?: string;
}

export function NominaKpiCard({
  title,
  value,
  description,
  icon,
  tone = 'accent',
  theme = 'dark',
  className,
}: NominaKpiCardProps): JSX.Element {
  return (
    <article
      className={[styles.card, styles[`theme--${theme}`], styles[`tone--${tone}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.header}>
        <p className={styles.title}>{title}</p>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <p className={styles.value}>{value}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
    </article>
  );
}

export default NominaKpiCard;
