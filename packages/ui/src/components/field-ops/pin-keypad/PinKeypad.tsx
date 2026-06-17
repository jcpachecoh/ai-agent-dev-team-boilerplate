import { Delete } from 'lucide-react';
import type { JSX } from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import { PinKey } from '../pin-key';
import styles from './PinKeypad.module.scss';

const DIGIT_ROWS: string[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

export interface PinKeypadProps {
  onKeyPress?: (key: string) => void;
  onConfirm?: () => void;
  onBackspace?: () => void;
  value?: string;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
  confirmLabel?: string;
}

export function PinKeypad({
  onKeyPress,
  onConfirm,
  onBackspace,
  theme = 'light',
  size = 'md',
  className,
  confirmLabel = 'OK',
}: PinKeypadProps): JSX.Element {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  const handleDigit = (digit: string): void => {
    onKeyPress?.(digit);
  };

  const handleBackspace = (): void => {
    if (onBackspace) {
      onBackspace();
      return;
    }
    onKeyPress?.('backspace');
  };

  const handleConfirm = (): void => {
    if (onConfirm) {
      onConfirm();
      return;
    }
    onKeyPress?.('confirm');
  };

  return (
    <div
      className={[styles.keypad, themeClass, sizeClass, className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Teclado PIN"
    >
      {DIGIT_ROWS.map((row) => (
        <div key={row.join('-')} className={styles.row}>
          {row.map((digit) => (
            <PinKey
              key={digit}
              theme={theme}
              size={size}
              value={digit}
              aria-label={`Tecla ${digit}`}
              onClick={() => handleDigit(digit)}
            />
          ))}
        </div>
      ))}
      <div className={styles.row}>
        <PinKey
          theme={theme}
          size={size}
          variant="semantic"
          accentColor="danger"
          aria-label="Borrar"
          onClick={handleBackspace}
        >
          <Delete size={size === 'sm' ? 18 : size === 'xl' ? 28 : 22} aria-hidden />
        </PinKey>
        <PinKey
          theme={theme}
          size={size}
          value="0"
          aria-label="Tecla 0"
          onClick={() => handleDigit('0')}
        />
        <PinKey
          theme={theme}
          size={size}
          variant="semantic"
          accentColor="success"
          aria-label={confirmLabel}
          onClick={handleConfirm}
        >
          <span className={styles.confirmLabel}>{confirmLabel}</span>
        </PinKey>
      </div>
    </div>
  );
}

export default PinKeypad;
