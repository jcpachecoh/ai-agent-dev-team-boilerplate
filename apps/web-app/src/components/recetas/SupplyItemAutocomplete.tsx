import { useMemo, useState } from 'react';

import type { SupplyItemApi } from '@/features/inventario/types';

import styles from './SupplyItemAutocomplete.module.scss';

interface SupplyItemAutocompleteProps {
  items: SupplyItemApi[];
  code: string;
  selectedItemId?: string;
  onCodeChange: (code: string) => void;
  onSelect: (item: SupplyItemApi) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
}

export function SupplyItemAutocomplete({
  items,
  code,
  selectedItemId,
  onCodeChange,
  onSelect,
  disabled = false,
  loading = false,
  error,
  placeholder = 'Buscar código de insumo',
}: SupplyItemAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const normalizedQuery = code.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return items.slice(0, 8);
    }
    return items
      .filter(
        (item) =>
          item.codigoInterno.toLowerCase().includes(normalizedQuery) ||
          item.nombre.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [items, normalizedQuery]);

  const hasValidSelection = Boolean(
    selectedItemId && items.some((item) => item.id === selectedItemId),
  );

  return (
    <div className={styles.root}>
      <input
        className={[styles.input, error ? styles.inputError : ''].filter(Boolean).join(' ')}
        value={code}
        onChange={(event) => {
          onCodeChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={disabled || loading}
        placeholder={loading ? 'Cargando insumos...' : placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'supply-autocomplete-error' : undefined}
        autoComplete="off"
      />
      {error ? (
        <span id="supply-autocomplete-error" className={styles.error}>
          {error}
        </span>
      ) : null}
      {open && !disabled && matches.length > 0 ? (
        <ul className={styles.list} role="listbox">
          {matches.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={styles.option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <span className={styles.code}>{item.codigoInterno}</span>
                <span className={styles.name}>{item.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && !disabled && normalizedQuery && matches.length === 0 && !hasValidSelection ? (
        <p className={styles.empty}>No se encontró el insumo en inventarios activos.</p>
      ) : null}
    </div>
  );
}
