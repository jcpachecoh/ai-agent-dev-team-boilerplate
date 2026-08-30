import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import * as React from 'react';

import styles from './Alert.module.scss';

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: React.ReactNode;
  mode?: 'inline' | 'banner';
  className?: string;
}

const variantIcons = {
  success: <CheckCircle size={20} />,
  error: <AlertCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  icon,
  dismissible = false,
  onDismiss,
  action,
  mode = 'inline',
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) {
    return null;
  }

  const handleDismiss = (): void => {
    setIsVisible(false);
    onDismiss?.();
  };

  const combinedClassName = [styles.alert, styles[variant], styles[mode], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClassName} role="alert">
      <div className={styles.iconContainer}>{icon || variantIcons[variant]}</div>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{children}</div>
      </div>
      {(action || dismissible) && (
        <div className={styles.actions}>
          {action}
          {dismissible && (
            <button className={styles.dismissButton} onClick={handleDismiss} aria-label="Dismiss">
              <X size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Alert;
