import {
  InventarioDateField,
  InventarioFormField,
  InventarioSearch,
  InventarioSelect,
  type InventarioSelectOption,
} from '@restopsiq/ui';

import type { UiTheme } from '@/constants/theme';

import styles from './InventoryMovementsFilterBar.module.scss';

const typeOptions: InventarioSelectOption[] = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'salida', label: 'Salida' },
  { value: 'consumo', label: 'Consumo' },
  { value: 'ajuste', label: 'Ajuste' },
];

const siteOptions: InventarioSelectOption[] = [
  { value: 'all', label: 'Todas las sedes' },
  { value: 'Planta Central', label: 'Planta Central' },
  { value: 'Sede Norte', label: 'Sede Norte' },
  { value: 'Sede Sur', label: 'Sede Sur' },
];

export interface InventoryMovementsFilterBarProps {
  theme: UiTheme;
  className?: string;
  search: string;
  movementType: string;
  site: string;
  dateStart: string;
  dateEnd: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSiteChange: (value: string) => void;
  onDateStartChange: (value: string) => void;
  onDateEndChange: (value: string) => void;
}

export function InventoryMovementsFilterBar({
  theme,
  className,
  search,
  movementType,
  site,
  dateStart,
  dateEnd,
  onSearchChange,
  onTypeChange,
  onSiteChange,
  onDateStartChange,
  onDateEndChange,
}: InventoryMovementsFilterBarProps): React.JSX.Element {
  return (
    <div className={[styles.bar, className].filter(Boolean).join(' ')}>
      <InventarioSearch
        value={search}
        placeholder="Buscar producto..."
        onChange={onSearchChange}
        theme={theme}
        size="md"
        className={styles.search}
      />
      <InventarioSelect
        options={typeOptions}
        value={movementType}
        onChange={onTypeChange}
        theme={theme}
        size="md"
        className={styles.select}
        aria-label="Tipo de movimiento"
      />
      <InventarioSelect
        options={siteOptions}
        value={site}
        onChange={onSiteChange}
        theme={theme}
        size="md"
        className={styles.select}
        aria-label="Sede"
      />
      <InventarioFormField label="Desde" theme={theme} size="sm" className={styles.dateField}>
        <InventarioDateField
          value={dateStart}
          onChange={onDateStartChange}
          theme={theme}
          size="md"
          aria-label="Fecha desde"
        />
      </InventarioFormField>
      <InventarioFormField label="Hasta" theme={theme} size="sm" className={styles.dateField}>
        <InventarioDateField
          value={dateEnd}
          onChange={onDateEndChange}
          theme={theme}
          size="md"
          aria-label="Fecha hasta"
        />
      </InventarioFormField>
    </div>
  );
}
