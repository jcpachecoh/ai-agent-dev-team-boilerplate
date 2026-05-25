import * as React from 'react';
import { Pencil, Trash2, Truck } from 'lucide-react';
import styles from './TripCard.module.scss';

const ICON_SIZES = { sm: 16, md: 20, lg: 24 } as const;

export interface TripCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  capText?: string;
  /** @deprecated Prefer `theme` — kept for backward compatibility */
  variant?: 'light' | 'dark';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  /** Custom left icon slot (Lucide or other React node). */
  leftIcon?: React.ReactNode;
  /** Custom edit action icon. */
  actionIcon1?: React.ReactNode;
  /** Custom delete action icon. */
  actionIcon2?: React.ReactNode;
}

export function TripCard({
  title,
  subtitle,
  capText = '0% cap.',
  variant,
  theme,
  size = 'md',
  leftIcon,
  actionIcon1,
  actionIcon2,
  className,
  ...props
}: TripCardProps) {
  const resolvedTheme = theme ?? variant ?? 'light';
  const iconSize = ICON_SIZES[size];

  const cls = [
    styles.tripCard,
    styles[`size--${size}`],
    resolvedTheme === 'dark' ? styles.dark : styles.light,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const defaultLeft = <Truck size={iconSize} aria-hidden />;
  const defaultEdit = <Pencil size={iconSize - 4} aria-hidden />;
  const defaultDelete = <Trash2 size={iconSize - 4} aria-hidden />;

  return (
    <div className={cls} {...props}>
      <div className={styles.left}>
        <div className={styles.leftIcon}>{leftIcon ?? defaultLeft}</div>
        <div className={styles.texts}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.cap}>{capText}</div>

        <button type="button" className={styles.iconBtn} aria-label="Editar viaje">
          {actionIcon1 ?? defaultEdit}
        </button>

        <button type="button" className={styles.iconBtn} aria-label="Eliminar viaje">
          {actionIcon2 ?? defaultDelete}
        </button>
      </div>
    </div>
  );
}

export default TripCard;
