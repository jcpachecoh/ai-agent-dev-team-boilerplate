import { Plus, Minus } from 'lucide-react';
import * as React from 'react';

import styles from './NumberInput.module.scss';
import {
  countDecimalPlaces,
  DEFAULT_MAX_CURRENCY_DIGITS,
  formatCurrencyCop,
  formatStepValue,
  parseCurrencyDigits,
  sanitizeCurrencyDigits,
  snapToStep,
} from './number-input.utils';

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'size'
> {
  value?: number;
  onChange?: (value: number) => void;
  variant?: 'currency' | 'quantity' | 'grouped';
  step?: number;
  min?: number;
  max?: number;
  /** +/- buttons (default: true except `grouped`). */
  showSteppers?: boolean;
  /** Max digit count for `currency` / `grouped` (default 12). */
  maxCurrencyDigits?: number;
  /** Decimal places for display and snapping (defaults from `step` when fractional). */
  decimalPlaces?: number;
  allowNegative?: boolean;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
}

function selectionIndexForDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;

  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i] ?? '')) {
      seen += 1;
      if (seen >= digitCount) return i + 1;
    }
  }
  return formatted.length;
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
      maxCurrencyDigits = DEFAULT_MAX_CURRENCY_DIGITS,
      decimalPlaces: decimalPlacesProp,
      allowNegative = false,
      theme = 'dark',
      size = 'md',
      showSteppers: showSteppersProp,
      className,
      onFocus: onFocusProp,
      onBlur: onBlurProp,
      ...inputProps
    },
    ref,
  ) => {
    const usesGroupedDigits = variant === 'currency' || variant === 'grouped';
    const showCurrencyPrefix = variant === 'currency';
    const showSteppers = showSteppersProp ?? variant !== 'grouped';
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const decimalPlaces =
      decimalPlacesProp ?? (countDecimalPlaces(step) > 0 ? countDecimalPlaces(step) : 0);

    const normalize = React.useCallback(
      (raw: number): number => snapToStep(raw, step, min, max),
      [max, min, step],
    );

    const formatDisplay = React.useCallback(
      (num: number): string => formatStepValue(normalize(num), decimalPlaces),
      [decimalPlaces, normalize],
    );

    const toCurrencyDigits = React.useCallback(
      (num: number): string => {
        if (!Number.isFinite(num) || num <= 0) return num === 0 ? '0' : '';
        return sanitizeCurrencyDigits(String(Math.trunc(num)), maxCurrencyDigits);
      },
      [maxCurrencyDigits],
    );

    const formatCurrencyDisplay = React.useCallback(
      (digits: string): string => {
        if (!digits) return '';
        return formatCurrencyCop(parseCurrencyDigits(digits, maxCurrencyDigits));
      },
      [maxCurrencyDigits],
    );

    const valueToInputString = React.useCallback(
      (num: number | undefined): string => {
        if (num === undefined) return '';
        if (usesGroupedDigits) return toCurrencyDigits(normalize(num));
        return formatDisplay(num);
      },
      [formatDisplay, normalize, toCurrencyDigits, usesGroupedDigits],
    );

    const [inputValue, setInputValue] = React.useState<string>(valueToInputString(value));
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      if (value !== undefined && !isFocused) {
        setInputValue(valueToInputString(value));
      }
    }, [isFocused, value, valueToInputString]);

    const parseQuantityValue = (val: string): number => {
      const sanitized = val.replace(/[^0-9.-]/g, '');
      const parsed = Number.parseFloat(sanitized);
      return Number.isNaN(parsed) ? min : parsed;
    };

    const parseInputValue = (val: string): number => {
      if (usesGroupedDigits) return parseCurrencyDigits(val, maxCurrencyDigits);
      return parseQuantityValue(val);
    };

    const commitValue = (raw: string): void => {
      if (usesGroupedDigits) {
        const sanitized = sanitizeCurrencyDigits(raw, maxCurrencyDigits);
        if (!sanitized) {
          setInputValue('');
          onChange?.(min);
          return;
        }
        const num = normalize(parseCurrencyDigits(sanitized, maxCurrencyDigits));
        setInputValue(toCurrencyDigits(num));
        onChange?.(num);
        return;
      }

      if (raw === '' || raw === '-') {
        setInputValue('');
        onChange?.(min);
        return;
      }

      const num = normalize(parseInputValue(raw));
      setInputValue(formatDisplay(num));
      onChange?.(num);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const raw = e.target.value;
      const el = e.target;
      const selectionStart = el.selectionStart ?? raw.length;

      if (usesGroupedDigits) {
        const digitsBeforeCursor = sanitizeCurrencyDigits(
          raw.slice(0, selectionStart),
          maxCurrencyDigits,
        ).length;
        const sanitized = sanitizeCurrencyDigits(raw, maxCurrencyDigits);

        setInputValue(sanitized);
        if (sanitized === '') {
          onChange?.(min);
          return;
        }

        onChange?.(normalize(parseCurrencyDigits(sanitized, maxCurrencyDigits)));

        const formatted = formatCurrencyDisplay(sanitized);
        requestAnimationFrame(() => {
          const node = inputRef.current;
          if (!node) return;
          const nextIndex = selectionIndexForDigitCount(formatted, digitsBeforeCursor);
          node.setSelectionRange(nextIndex, nextIndex);
        });
        return;
      }

      const decimalPattern =
        decimalPlaces > 0
          ? allowNegative
            ? new RegExp(`^-?\\d*(\\.\\d{0,${decimalPlaces}})?$`)
            : new RegExp(`^\\d*(\\.\\d{0,${decimalPlaces}})?$`)
          : null;

      const regex = decimalPattern ?? (allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/);

      if (raw === '' || regex.test(raw)) {
        setInputValue(raw);
        if (raw !== '' && raw !== '-' && !raw.endsWith('.')) {
          const num = parseQuantityValue(raw);
          if (!Number.isNaN(num)) {
            onChange?.(normalize(num));
          }
        }
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
      setIsFocused(true);
      onFocusProp?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
      setIsFocused(false);
      commitValue(inputValue);
      onBlurProp?.(e);
    };

    const handleIncrement = (): void => {
      const current = normalize(parseInputValue(inputValue || '0'));
      const next = normalize(current + step);
      const nextRaw = usesGroupedDigits ? toCurrencyDigits(next) : formatDisplay(next);
      setInputValue(nextRaw);
      onChange?.(next);
    };

    const handleDecrement = (): void => {
      const current = normalize(parseInputValue(inputValue || '0'));
      const next = normalize(current - step);
      const nextRaw = usesGroupedDigits ? toCurrencyDigits(next) : formatDisplay(next);
      setInputValue(nextRaw);
      onChange?.(next);
    };

    const currentNumeric = normalize(parseInputValue(inputValue || '0'));

    const displayedValue = usesGroupedDigits ? formatCurrencyDisplay(inputValue) : inputValue;

    const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
    const sizeClass = styles[`size--${size}`];

    const groupedInput = (
      <div className={styles.groupedField}>
        {showCurrencyPrefix ? (
          <span className={styles.prefix} aria-hidden>
            $
          </span>
        ) : null}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          className={[styles.input, styles.inputGrouped].join(' ')}
          value={displayedValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0"
          {...inputProps}
        />
      </div>
    );

    return (
      <div
        className={[
          styles.wrapper,
          themeClass,
          sizeClass,
          !showSteppers && styles.wrapperNoSteppers,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {showSteppers ? (
          <button
            type="button"
            className={styles.button}
            onClick={handleDecrement}
            disabled={inputProps.disabled || currentNumeric <= min}
          >
            <Minus size={16} />
          </button>
        ) : null}
        <div
          className={[styles.inputContainer, usesGroupedDigits && styles.inputContainerGrouped]
            .filter(Boolean)
            .join(' ')}
        >
          {usesGroupedDigits ? (
            groupedInput
          ) : (
            <input
              ref={inputRef}
              type="text"
              inputMode={decimalPlaces > 0 ? 'decimal' : 'numeric'}
              className={styles.input}
              value={displayedValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...inputProps}
            />
          )}
        </div>
        {showSteppers ? (
          <button
            type="button"
            className={styles.button}
            onClick={handleIncrement}
            disabled={inputProps.disabled || (max !== undefined && currentNumeric >= max)}
          >
            <Plus size={16} />
          </button>
        ) : null}
      </div>
    );
  },
);

NumberInput.displayName = 'NumberInput';

export default NumberInput;
