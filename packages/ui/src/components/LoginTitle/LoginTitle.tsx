import * as React from 'react';
import styles from './LoginTitle.module.scss';

export interface LoginTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: 'light' | 'dark';
  titleSize?: 'sm' | 'md' | 'lg';
  statusColor?: string; // optional small dot color shown before subtitle
}

export function LoginTitle({
  title = 'Bienvenido a RestOpsIQ',
  subtitle = 'Módulo · Planificación de Despachos',
  variant = 'light',
  titleSize = 'md',
  statusColor,
  className,
  ...props
}: LoginTitleProps) {
  const sizeClass =
    titleSize === 'sm'
      ? styles['size-sm']
      : titleSize === 'lg'
        ? styles['size-lg']
        : styles['size-md'];
  const cls = [
    styles.container,
    variant === 'dark' ? styles.dark : styles.light,
    sizeClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} {...props}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>
        {statusColor && (
          <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
        )}
        <span className={styles.subtitleText}>{subtitle}</span>
      </p>
    </div>
  );
}

export default LoginTitle;
