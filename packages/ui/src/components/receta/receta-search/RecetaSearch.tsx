import { Search, X } from 'lucide-react';
import React, { type ChangeEvent, type JSX } from 'react';

import type { RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaSearch.module.scss';

export interface RecetaSearchProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  theme?: RecetaTheme;
  size?: RecetaSize;
  className?: string;
  ariaLabel?: string;
}

export function RecetaSearch({
  value = '',
  placeholder = 'Buscar recetas...',
  onChange,
  onClear,
  disabled = false,
  theme = 'light',
  size = 'md',
  className,
  ariaLabel = 'Buscar recetas',
}: RecetaSearchProps): JSX.Element {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value);
  const handleClear = () => {
    onChange?.('');
    onClear?.();
  };

  return (
    <div
      className={[styles.search, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <Search className={styles.searchIcon} aria-hidden />
      <input
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      {value && !disabled && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
        >
          <X aria-hidden />
        </button>
      )}
    </div>
  );
}

export default RecetaSearch;
