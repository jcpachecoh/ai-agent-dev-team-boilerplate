import * as React from 'react';
import styles from './BadgeButton.module.scss';

export interface BadgeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  /** primary color used to derive text/icon/border and a lighter background */
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

const hexToRgba = (hex?: string, alpha = 1) => {
  if (!hex) return undefined;
  const h = hex.replace('#', '');
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (h.length === 6) {
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
};

export function BadgeButton({
  children,
  leftIcon,
  color,
  size = 'md',
  theme,
  className,
  ...props
}: BadgeButtonProps) {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : styles.md;
  const themeClass =
    theme === 'dark' ? styles['theme-dark'] : theme === 'light' ? styles['theme-light'] : '';
  const cls = [styles.button, sizeClass, themeClass, className].filter(Boolean).join(' ');

  const derivedBorder = color ? `1px solid ${hexToRgba(color, 0.15)}` : undefined;
  const derivedBg = color ? hexToRgba(color, 0.06) : undefined;
  const textColor = color ?? undefined;

  const style: React.CSSProperties = {};
  if (derivedBg) style.backgroundColor = derivedBg;
  if (derivedBorder) style.border = derivedBorder;
  if (textColor) style.color = textColor;

  const iconStyle: React.CSSProperties | undefined = textColor
    ? { color: textColor, fill: textColor }
    : undefined;

  return (
    <button className={cls} style={style} {...props}>
      {leftIcon && (
        <span className={styles.icon} style={iconStyle} aria-hidden>
          {leftIcon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
    </button>
  );
}

export default BadgeButton;
