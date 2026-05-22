import { Delete } from 'lucide-react';
import * as React from 'react';

import type { FieldOpsSize, FieldOpsTheme } from '../shared/field-ops-types';
import { PinKey } from '../pin-key';
import styles from './DecimalKeypad.module.scss';

const DIGIT_ROWS: string[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
];

export interface DecimalKeypadProps {
  onKeyPress?: (key: string) => void;
  onBackspace?: () => void;
  theme?: FieldOpsTheme;
  size?: FieldOpsSize;
  className?: string;
  decimalSeparator?: string;
}

export const DecimalKeypad: React.FC<DecimalKeypadProps> = ({
  onKeyPress,
  onBackspace,
  theme = 'light',
  size = 'md',
  className,
  decimalSeparator = '.',
}) => {
  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  const handleDigit = (digit: string): void => {
    onKeyPress?.(digit);
  };

  const handleDecimal = (): void => {
    onKeyPress?.(decimalSeparator);
  };

  const handleBackspace = (): void => {
    if (onBackspace) {
      onBackspace();
      return;
    }
    onKeyPress?.('backspace');
  };

  return (
    <div
      className={[styles.keypad, themeClass, sizeClass, className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Teclado numérico"
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
          accentColor="gold"
          value={decimalSeparator}
          aria-label="Separador decimal"
          onClick={handleDecimal}
        />
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
          accentColor="danger"
          aria-label="Borrar"
          onClick={handleBackspace}
        >
          <Delete size={size === 'sm' ? 18 : size === 'xl' ? 28 : 22} aria-hidden />
        </PinKey>
      </div>
    </div>
  );
};

export default DecimalKeypad;
