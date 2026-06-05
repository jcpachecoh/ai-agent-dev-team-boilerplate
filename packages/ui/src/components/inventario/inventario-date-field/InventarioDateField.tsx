import { Calendar } from 'lucide-react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioDateField.module.scss';

export interface InventarioDateFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
  'aria-label'?: string;
}

export function InventarioDateField({
  value = '',
  onChange,
  disabled = false,
  theme = 'dark',
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: InventarioDateFieldProps): React.JSX.Element {
  return (
    <div
      className={[styles.wrap, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        type="date"
        className={styles.dateInput}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <Calendar className={styles.calendarIcon} aria-hidden strokeWidth={1.75} />
    </div>
  );
}

export default InventarioDateField;
