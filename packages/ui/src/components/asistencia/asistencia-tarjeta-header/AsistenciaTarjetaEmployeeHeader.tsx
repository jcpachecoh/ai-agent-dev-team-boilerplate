import type { JSX } from 'react';

import { DatePicker } from '../../forms/date-picker';
import type { AsistenciaTarjetaHeaderData, AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaTarjetaEmployeeHeader.module.scss';

export interface AsistenciaTarjetaEmployeeHeaderProps {
  header: AsistenciaTarjetaHeaderData;
  theme?: AsistenciaTheme;
  className?: string;
}

const FIELDS: { key: keyof AsistenciaTarjetaHeaderData; label: string }[] = [
  { key: 'fullName', label: 'Nombre' },
  { key: 'position', label: 'Cargo' },
  { key: 'cedula', label: 'Cédula' },
  { key: 'employer', label: 'Empleador' },
  { key: 'contractType', label: 'Contrato' },
  { key: 'hireDate', label: 'Fecha de ingreso' },
];

export function AsistenciaTarjetaEmployeeHeader({
  header,
  theme = 'dark',
  className,
}: AsistenciaTarjetaEmployeeHeaderProps): JSX.Element {
  return (
    <section
      className={[styles.header, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
      aria-label="Encabezado del colaborador"
    >
      {FIELDS.map((field) => (
        <div key={field.key} className={styles.item}>
          <span className={styles.label}>{field.label}</span>
          <span className={styles.value}>{header[field.key]}</span>
        </div>
      ))}
    </section>
  );
}

export interface AsistenciaTarjetaFiltersProps {
  fromDate?: Date;
  toDate?: Date;
  onFromDateChange?: (date: Date | undefined) => void;
  onToDateChange?: (date: Date | undefined) => void;
  onSearch?: () => void;
  searchDisabled?: boolean;
  errorMessage?: string;
  theme?: AsistenciaTheme;
  className?: string;
}

export function AsistenciaTarjetaFilters({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onSearch,
  searchDisabled = false,
  errorMessage,
  theme = 'dark',
  className,
}: AsistenciaTarjetaFiltersProps): JSX.Element {
  return (
    <div
      className={[styles.filtersWrap, styles[`theme--${theme}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.filters}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Desde</span>
          <DatePicker
            value={fromDate}
            onChange={onFromDateChange}
            theme={theme}
            size="md"
            className={styles.datePicker}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Hasta</span>
          <DatePicker
            value={toDate}
            onChange={onToDateChange}
            theme={theme}
            size="md"
            className={styles.datePicker}
          />
        </div>
        <button
          type="button"
          className={styles.searchButton}
          onClick={onSearch}
          disabled={searchDisabled}
        >
          Buscar
        </button>
      </div>
      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export default AsistenciaTarjetaEmployeeHeader;
