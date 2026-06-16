import { Plus, Minus } from 'lucide-react';
import * as React from 'react';

import styles from './NumberInput.module.scss';

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'size'
> {
  value?: number;
  onChange?: (value: number) => void;
  variant?: 'currency' | 'quantity';
  step?: number;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      variant = 'quantity',
      step = 1,
      min = 0,
      max,
      allowNegative = false,
      theme = 'dark',
      size = 'md',
      className,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = React.useState<string>(
      value !== undefined ? String(value) : '',
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setInputValue(String(value));
      }
    }, [value]);

    const formatCurrency = (val: number): string => {
      return new Intl.NumberFormat('es-CO', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    };

    const parseValue = (val: string): number => {
      const sanitized = val.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(sanitized);
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const raw = e.target.value;

      // Basic non-numeric block (allow digits, minus sign if allowed, and decimal point if quantity)
      const regex =
        variant === 'quantity'
          ? allowNegative
            ? /^-?\d*\.?\d*$/
            : /^\d*\.?\d*$/
          : allowNegative
            ? /^-?\d*$/
            : /^\d*$/;

      if (raw === '' || regex.test(raw)) {
        setInputValue(raw);
        if (raw !== '' && raw !== '-') {
          const num = parseFloat(raw);
          if (!isNaN(num)) {
            onChange?.(num);
          }
        }
      }
    };

    const handleBlur = (): void => {
      let num = parseValue(inputValue);
      if (min !== undefined) {
        num = Math.max(min, num);
      }
      if (max !== undefined) {
        num = Math.min(max, num);
      }

      setInputValue(String(num));
      onChange?.(num);
    };

    const handleIncrement = (): void => {
      let num = parseValue(inputValue) + step;
      if (max !== undefined) {
        num = Math.min(max, num);
      }
      setInputValue(String(num));
      onChange?.(num);
    };

    const handleDecrement = (): void => {
      let num = parseValue(inputValue) - step;
      if (min !== undefined) {
        num = Math.max(min, num);
      }
      setInputValue(String(num));
      onChange?.(num);
    };

    const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
    const sizeClass = styles[`size--${size}`];

    return (
      <div className={[styles.wrapper, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
        <button
          type="button"
          className={styles.button}
          onClick={handleDecrement}
          disabled={props.disabled || (min !== undefined && parseValue(inputValue) <= min)}
        >
          <Minus size={16} />
        </button>
        <div className={styles.inputContainer}>
          {variant === 'currency' && <span className={styles.prefix}>$</span>}
          <input
            ref={ref}
            type="text"
            className={styles.input}
            value={
              variant === 'currency' && inputValue !== '' && inputValue !== '-'
                ? formatCurrency(parseValue(inputValue))
                : inputValue
            }
            onChange={handleInputChange}
            onBlur={handleBlur}
            {...props}
          />
        </div>
        <button
          type="button"
          className={styles.button}
          onClick={handleIncrement}
          disabled={props.disabled || (max !== undefined && parseValue(inputValue) >= max)}
        >
          <Plus size={16} />
        </button>
      </div>
    );
  },
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
