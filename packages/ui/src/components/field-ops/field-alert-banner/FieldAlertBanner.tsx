import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useState, type JSX, type ReactNode } from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './FieldAlertBanner.module.scss';

export interface FieldAlertBannerProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: ReactNode;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

const variantIcons = {
  success: CheckCircle,
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export function FieldAlertBanner({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  action,
  theme = 'light',
  size = 'md',
  className,
}: FieldAlertBannerProps): JSX.Element | null {
  const [visible, setVisible] = useState(true);
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const variantClass = styles[`variant--${variant}`];

  if (!visible) {
    return null;
  }

  const IconComponent = variantIcons[variant];
  const iconSize = size === 'sm' ? 18 : size === 'xl' ? 24 : 20;

  const handleDismiss = (): void => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={[styles.banner, themeClass, sizeClass, variantClass, className]
        .filter(Boolean)
        .join(' ')}
      role="alert"
    >
      <div className={styles.iconWrap}>{icon ?? <IconComponent size={iconSize} aria-hidden />}</div>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>
      {(action || dismissible) && (
        <div className={styles.actions}>
          {action}
          {dismissible && (
            <button
              type="button"
              className={styles.dismiss}
              onClick={handleDismiss}
              aria-label="Cerrar alerta"
            >
              <X size={16} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FieldAlertBanner;
