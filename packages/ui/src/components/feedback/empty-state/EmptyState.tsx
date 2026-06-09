import { Search, PlusCircle, AlertCircle } from 'lucide-react';
import * as React from 'react';

import styles from './EmptyState.module.scss';

export type EmptyStateTheme = 'light' | 'dark';

export interface EmptyStateProps {
  variant?: 'search' | 'create' | 'error';
  theme?: EmptyStateTheme;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const variantIcons = {
  search: <Search size={48} />,
  create: <PlusCircle size={48} />,
  error: <AlertCircle size={48} />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'search',
  theme = 'light',
  icon,
  title,
  description,
  action,
  className,
}) => {
  const isDark = theme === 'dark';
  const combinedClassName = [styles.emptyState, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  const titleClassName = [styles.title, isDark ? styles.titleDark : styles.titleLight]
    .filter(Boolean)
    .join(' ');
  const descriptionClassName = [
    styles.description,
    isDark ? styles.descriptionDark : styles.descriptionLight,
  ]
    .filter(Boolean)
    .join(' ');
  const iconClassName = [styles.iconContainer, isDark ? styles.iconDark : styles.iconLight]
    .filter(Boolean)
    .join(' ');

  const titleStyle = isDark ? { color: 'rgba(255, 255, 255, 0.92)' } : undefined;
  const descriptionStyle = isDark ? { color: 'rgba(255, 255, 255, 0.58)' } : undefined;
  const iconStyle =
    isDark && variant === 'search' ? { color: 'rgba(255, 255, 255, 0.42)' } : undefined;

  return (
    <div className={combinedClassName} data-theme={theme}>
      <div className={iconClassName} style={iconStyle}>
        {icon || variantIcons[variant]}
      </div>
      <h3 className={titleClassName} style={titleStyle}>
        {title}
      </h3>
      {description ? (
        <p className={descriptionClassName} style={descriptionStyle}>
          {description}
        </p>
      ) : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
};

export default EmptyState;
