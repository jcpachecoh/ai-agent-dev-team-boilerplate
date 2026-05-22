import { CircleCheck } from 'lucide-react';
import * as React from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './PhaseCompletionHeader.module.scss';

export interface PhaseCompletionHeaderProps {
  title?: string;
  icon?: React.ReactNode;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
}

export const PhaseCompletionHeader: React.FC<PhaseCompletionHeaderProps> = ({
  title = 'Completar fase',
  icon,
  theme = 'light',
  size = 'md',
  className,
}) => {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const iconSize = size === 'sm' ? 28 : size === 'xl' ? 48 : 36;

  return (
    <header className={[styles.header, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
      <span className={styles.iconWrap} aria-hidden>
        {icon ?? <CircleCheck size={iconSize} strokeWidth={1.75} />}
      </span>
      <h2 className={styles.title}>{title}</h2>
    </header>
  );
};

export default PhaseCompletionHeader;
