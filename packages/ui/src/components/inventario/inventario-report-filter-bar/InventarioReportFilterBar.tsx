import React, { type JSX } from 'react';

import { InventarioDateField } from '../inventario-date-field';
import { InventarioFormField } from '../inventario-form-field';
import { InventarioPrimaryButton } from '../inventario-primary-button';
import { InventarioSelect, type InventarioSelectOption } from '../inventario-select';
import type { InventarioSize, InventarioTheme } from '../shared/inventario-types';
import styles from './InventarioReportFilterBar.module.scss';

export interface InventarioReportFilterBarProps {
  reportTypeOptions?: InventarioSelectOption[];
  reportTypeValue?: string;
  onReportTypeChange?: (value: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
  onGenerate?: () => void;
  generateLabel?: string;
  theme?: InventarioTheme;
  size?: InventarioSize;
  className?: string;
}

const defaultReportTypes: InventarioSelectOption[] = [
  { value: 'category', label: 'Por Categoría' },
  { value: 'supplier', label: 'Por Proveedor' },
  { value: 'movement', label: 'Por Movimiento' },
];

export function InventarioReportFilterBar({
  reportTypeOptions = defaultReportTypes,
  reportTypeValue = 'category',
  onReportTypeChange,
  startDate = '2026-05-01',
  endDate = '2026-05-29',
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  generateLabel = 'GENERAR',
  theme = 'light',
  size = 'md',
  className,
}: InventarioReportFilterBarProps): JSX.Element {
  return (
    <section
      className={[styles.bar, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.typeField}>
        <span className={styles.typeLabel}>Tipo de Reporte</span>
        <InventarioSelect
          options={reportTypeOptions}
          value={reportTypeValue}
          onChange={onReportTypeChange}
          theme={theme}
          size={size}
          className={styles.typeSelect}
          aria-label="Tipo de reporte"
        />
      </div>

      <InventarioFormField label="Fecha Inicio" theme={theme} size={size}>
        <InventarioDateField
          value={startDate}
          onChange={onStartDateChange}
          theme={theme}
          size={size}
          aria-label="Fecha inicio"
        />
      </InventarioFormField>

      <InventarioFormField label="Fecha Fin" theme={theme} size={size}>
        <InventarioDateField
          value={endDate}
          onChange={onEndDateChange}
          theme={theme}
          size={size}
          aria-label="Fecha fin"
        />
      </InventarioFormField>

      <InventarioPrimaryButton
        label={generateLabel}
        variant="primary"
        showIcon={false}
        onClick={onGenerate}
        theme={theme}
        size={size}
        className={styles.generate}
      />
    </section>
  );
}

export default InventarioReportFilterBar;
