import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import React, { type JSX, useMemo, useState } from 'react';

import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioSelect.module.scss';

export interface InventarioSelectOption {
  value: string;
  label: string;
}

export interface InventarioSelectProps {
  options: InventarioSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
  'aria-label'?: string;
}

export function InventarioSelect({
  options,
  value = '',
  onChange,
  placeholder = 'Seleccionar',
  disabled = false,
  theme = 'light',
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: InventarioSelectProps): JSX.Element {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === value)?.label,
    [options, value],
  );

  const handleSelect = (next: string) => {
    onChange?.(next);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className={[styles.wrap, styles[`theme--${theme}`], styles[`size--${size}`], className]
          .filter(Boolean)
          .join(' ')}
      >
        <Popover.Trigger asChild disabled={disabled}>
          <button
            type="button"
            className={styles.trigger}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className={[styles.label, !selectedLabel ? styles.placeholder : ''].join(' ')}>
              {selectedLabel ?? placeholder}
            </span>
            <ChevronDown className={[styles.chevron, open ? styles.chevronOpen : ''].join(' ')} />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className={[styles.content, styles[`contentTheme--${theme}`]].join(' ')}
            align="start"
            sideOffset={6}
            collisionPadding={12}
          >
            <ul className={styles.list} role="listbox">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={[styles.option, isSelected ? styles.optionSelected : ''].join(' ')}
                      onClick={() => handleSelect(option.value)}
                    >
                      <span>{option.label}</span>
                      {isSelected ? <Check className={styles.check} aria-hidden /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}

export default InventarioSelect;
