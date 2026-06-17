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
    <input
      type="date"
      className={[styles.dateInput, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}

export default InventarioDateField;
