import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioDateTimeField.module.scss';

export interface InventarioDateTimeFieldProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
  'aria-label'?: string;
  min?: string;
  max?: string;
}

export function InventarioDateTimeField({
  id,
  value = '',
  onChange,
  disabled = false,
  theme = 'dark',
  size = 'md',
  className,
  'aria-label': ariaLabel,
  min,
  max,
}: InventarioDateTimeFieldProps): React.JSX.Element {
  return (
    <input
      id={id}
      type="datetime-local"
      className={[
        styles.dateTimeInput,
        styles[`theme--${theme}`],
        styles[`size--${size}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      min={min}
      max={max}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}

export default InventarioDateTimeField;
