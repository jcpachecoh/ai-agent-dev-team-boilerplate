import * as React from 'react';
import styles from './TripCard.module.scss';

export interface TripCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  capText?: string;
  variant?: 'light' | 'dark';
  leftIcon?: string; // image URL
  actionIcon1?: string;
  actionIcon2?: string;
}

const DEFAULT_LEFT_ICON =
  'https://www.figma.com/api/mcp/asset/5fe710bb-f45b-4f07-8cfd-c7ee561779b0';
const DEFAULT_ACTION_1 = 'https://www.figma.com/api/mcp/asset/5a5814e9-342a-449d-af34-788e1b0b24d1';
const DEFAULT_ACTION_2 = 'https://www.figma.com/api/mcp/asset/ec682839-e625-4500-884c-158d9b5f8e6c';

export function TripCard({
  title,
  subtitle,
  capText = '0% cap.',
  variant = 'light',
  leftIcon,
  actionIcon1,
  actionIcon2,
  className,
  ...props
}: TripCardProps) {
  const cls = [styles.tripCard, variant === 'dark' ? styles.dark : styles.light, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} {...props}>
      <div className={styles.left}>
        <div className={styles.leftIcon}>
          <img src={leftIcon ?? DEFAULT_LEFT_ICON} alt="icon" />
        </div>
        <div className={styles.texts}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.cap}>{capText}</div>

        <button className={styles.iconBtn} aria-label="action-1">
          <img src={actionIcon1 ?? DEFAULT_ACTION_1} alt="action" />
        </button>

        <button className={styles.iconBtn} aria-label="action-2">
          <img src={actionIcon2 ?? DEFAULT_ACTION_2} alt="action" />
        </button>
      </div>
    </div>
  );
}

export default TripCard;
