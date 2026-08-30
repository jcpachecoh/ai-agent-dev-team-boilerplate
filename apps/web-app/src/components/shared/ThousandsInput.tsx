import { type InputHTMLAttributes, useState, useEffect } from 'react';
import { formatThousands, parseThousands } from '@/lib/format-number';

interface ThousandsInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value?: number | string;
  onChange?: (value: number) => void;
}

/**
 * Text input that displays integer values with Colombian thousands separators (dots)
 * while calling onChange with the raw numeric value.
 */
export function ThousandsInput({ value, onChange, ...props }: ThousandsInputProps) {
  const [display, setDisplay] = useState(() => formatThousands(value));

  useEffect(() => {
    setDisplay(formatThousands(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10);
    setDisplay(raw === '' ? '' : formatThousands(num));
    onChange?.(num);
  }

  return (
    <input {...props} type="text" inputMode="numeric" value={display} onChange={handleChange} />
  );
}
