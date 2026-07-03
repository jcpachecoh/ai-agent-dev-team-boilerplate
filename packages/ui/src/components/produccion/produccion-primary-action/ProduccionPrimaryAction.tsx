import { Plus } from 'lucide-react';
import React, { type JSX, type ReactNode } from 'react';

import styles from './ProduccionPrimaryAction.module.scss';
import type { ProduccionSize, ProduccionTheme } from '../shared/produccion-types';

export interface ProduccionPrimaryActionProps {
  label?: string;
  icon?: ReactNode;
  showIcon?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}

export function ProduccionPrimaryAction({
  label = 'NUEVA ESTACIÓN',
  icon,
  showIcon = true,
  onClick,
  disabled = false,
  type = 'button',
  theme = 'dark',
  size = 'md',
  className,
}: ProduccionPrimaryActionProps): JSX.Element {
  const resolvedIcon = icon ?? (showIcon ? <Plus aria-hidden /> : null);
  return (
    <button
      type={type}
      className={[styles.button, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {resolvedIcon ? <span className={styles.icon}>{resolvedIcon}</span> : null}
      <span>{label}</span>
    </button>
  );
}

export default ProduccionPrimaryAction;
