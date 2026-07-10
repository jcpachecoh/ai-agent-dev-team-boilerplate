import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, X } from 'lucide-react';
import * as React from 'react';

import styles from './Combobox.module.scss';
import { SearchInput } from '../search-input';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  /** Notifica cada búsqueda (con debounce) — útil para búsqueda server-side. No reemplaza el filtro local. */
  onSearch?: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  multiple?: boolean;
  loading?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  size?: 'sm' | 'md' | 'xl';
}

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  onSearch,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados.',
  multiple = false,
  loading = false,
  theme = 'dark',
  className,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filtro local por defecto (case/acento-insensitive): `options` suele ser una lista ya
  // cargada en memoria, no paginada — sin esto el buscador no filtraba nada y solo quedaba
  // el callback `onSearch` externo, que ningún consumidor actual conecta a un filtro real.
  const filteredOptions = React.useMemo(() => {
    const needle = normalizeForMatch(searchQuery);
    if (!needle) {
      return options;
    }
    return options.filter((option) => normalizeForMatch(option.label).includes(needle));
  }, [options, searchQuery]);

  const isSelected = (optionValue: string): boolean => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleSelect = (optionValue: string): void => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange?.(newValues);
    } else {
      onChange?.(optionValue);
      setIsOpen(false);
    }
  };

  const removeValue = (val: string): void => {
    if (multiple && Array.isArray(value)) {
      onChange?.(value.filter((v) => v !== val));
    }
  };

  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const contentThemeClass = theme === 'light' ? styles.contentLight : styles.contentDark;
  const sizeClass = styles[`size--${size}`];

  const selectedLabels = React.useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return options.filter((opt) => value.includes(opt.value)).map((opt) => opt.label);
    }
    return options.find((opt) => opt.value === value)?.label || '';
  }, [value, options, multiple]);

  return (
    <div className={[styles.container, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <div className={styles.triggerWrapper}>
          <Popover.Trigger asChild>
            <div className={styles.trigger}>
              <div className={styles.valuesContainer}>
                {multiple && Array.isArray(value) && value.length > 0 ? (
                  <div className={styles.chips}>
                    {value.map((v) => {
                      const label = options.find((opt) => opt.value === v)?.label || v;
                      return (
                        <div key={v} className={styles.chip}>
                          <span>{label}</span>
                          <button
                            type="button"
                            className={styles.chipRemove}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeValue(v);
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className={!value ? styles.placeholder : ''}>
                    {multiple
                      ? Array.isArray(value) && value.length > 0
                        ? `${value.length} selected`
                        : placeholder
                      : selectedLabels || placeholder}
                  </span>
                )}
              </div>
              <ChevronDown size={16} className={styles.chevron} />
            </div>
          </Popover.Trigger>
        </div>

        <Popover.Content
          className={[styles.content, contentThemeClass].filter(Boolean).join(' ')}
          align="start"
          sideOffset={5}
        >
          <div className={styles.searchWrapper}>
            <SearchInput
              placeholder={searchPlaceholder}
              theme={theme}
              value={searchQuery}
              // El filtro de `filteredOptions` es local (en memoria) — no hay razón para
              // esperar el debounce de 300ms pensado para búsquedas contra servidor, y ese
              // retraso es justamente lo que se sentía como lag al escribir.
              debounce={0}
              onSearch={(q) => {
                setSearchQuery(q);
                onSearch?.(q);
              }}
              loading={loading}
              autoFocus
            />
          </div>
          <div className={styles.list}>
            {filteredOptions.length === 0 && !loading && (
              <div className={styles.empty}>{emptyMessage}</div>
            )}
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className={[styles.item, isSelected(option.value) && styles.selected]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelect(option.value)}
              >
                <span className={styles.itemLabel}>{option.label}</span>
                {isSelected(option.value) && <Check size={16} className={styles.check} />}
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

export default Combobox;
