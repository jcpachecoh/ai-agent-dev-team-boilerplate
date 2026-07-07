import * as React from 'react';

import type { FieldOpsAccentColor, FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import styles from './PinKey.module.scss';

export interface PinKeyProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  variant?: 'default' | 'semantic';
  accentColor?: FieldOpsAccentColor;
  value?: React.ReactNode;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  'aria-label': string;
}

export const PinKey = React.forwardRef<HTMLButtonElement, PinKeyProps>(function PinKey(
  {
    variant = 'default',
    accentColor = 'default',
    value,
    theme = 'light',
    size = 'md',
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];
  const variantClass =
    variant === 'semantic' ? styles['variant--semantic'] : styles['variant--default'];
  const accentClass =
    variant === 'semantic' && accentColor !== 'default' ? styles[`accent--${accentColor}`] : '';

  const combinedClassName = [
    styles.key,
    themeClass,
    sizeClass,
    variantClass,
    accentClass,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = children ?? value;

  return (
    <button
      ref={ref}
      type={type}
      role="button"
      className={combinedClassName}
      disabled={disabled}
      {...props}
    >
      <span className={styles.content}>{content}</span>
    </button>
  );
});

PinKey.displayName = 'PinKey';

export default PinKey;
