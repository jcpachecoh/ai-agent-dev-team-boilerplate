import type { ReactNode } from 'react';

import styles from './ResponsiveTable.module.scss';

export interface ResponsiveTableCardField {
  label: string;
  value: ReactNode;
}

export interface ResponsiveTableCardProps {
  title: ReactNode;
  badge?: ReactNode;
  fields: ResponsiveTableCardField[];
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ResponsiveTableCard({
  title,
  badge,
  fields,
  footer,
  onClick,
  className,
}: ResponsiveTableCardProps): React.JSX.Element {
  const Tag = onClick ? 'button' : 'article';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={[styles.card, onClick ? styles.cardInteractive : '', className]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{title}</div>
        {badge ? <div className={styles.cardBadge}>{badge}</div> : null}
      </div>

      <dl className={styles.cardBody}>
        {fields.map((field) => (
          <div key={field.label} className={styles.cardField}>
            <dt className={styles.cardLabel}>{field.label}</dt>
            <dd className={styles.cardValue}>{field.value}</dd>
          </div>
        ))}
      </dl>

      {footer ? <div className={styles.cardFooter}>{footer}</div> : null}
    </Tag>
  );
}
