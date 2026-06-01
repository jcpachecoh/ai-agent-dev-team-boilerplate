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
  const combinedClassName = [
    styles.emptyState,
    styles[variant],
    styles[`theme--${theme}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClassName}>
      <div className={styles.iconContainer}>{icon || variantIcons[variant]}</div>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
};

export default EmptyState;
