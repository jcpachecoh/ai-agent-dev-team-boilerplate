import type { JSX, ReactNode } from 'react';

import { AsistenciaPage } from '../asistencia-page';
import { AsistenciaPageHeader } from '../asistencia-page-header';
import { AsistenciaTarjetaActionsMenu } from '../asistencia-tarjeta-actions';
import {
  AsistenciaTarjetaEmployeeHeader,
  AsistenciaTarjetaFilters,
} from '../asistencia-tarjeta-header';
import { AsistenciaTarjetaSummary } from '../asistencia-tarjeta-summary';
import { AsistenciaTarjetaTable } from '../asistencia-tarjeta-table';
import type {
  AsistenciaTarjetaDayRow,
  AsistenciaTarjetaExportAction,
  AsistenciaTarjetaHeaderData,
  AsistenciaTarjetaMetricData,
  AsistenciaTarjetaRowAction,
  AsistenciaTarjetaSortDirection,
  AsistenciaTarjetaSortKey,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaTarjeta.module.scss';

export interface AsistenciaTarjetaProps {
  title?: string;
  header: AsistenciaTarjetaHeaderData;
  summaryMetrics: AsistenciaTarjetaMetricData[];
  rows: AsistenciaTarjetaDayRow[];
  fromDate?: Date;
  toDate?: Date;
  onFromDateChange?: (date: Date | undefined) => void;
  onToDateChange?: (date: Date | undefined) => void;
  sortKey?: AsistenciaTarjetaSortKey;
  sortDirection?: AsistenciaTarjetaSortDirection;
  openMenuRowId?: string | null;
  rangeError?: string;
  loading?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  pagination?: ReactNode;
  theme?: AsistenciaTheme;
  onBack?: () => void;
  onSearch?: () => void;
  onExport?: (action: AsistenciaTarjetaExportAction) => void;
  onSort?: (key: AsistenciaTarjetaSortKey) => void;
  onToggleMenu?: (rowId: string) => void;
  onRowAction?: (row: AsistenciaTarjetaDayRow, action: AsistenciaTarjetaRowAction) => void;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  modals?: ReactNode;
  className?: string;
}

export function AsistenciaTarjeta({
  title = 'Tarjeta de Asistencia',
  header,
  summaryMetrics,
  rows,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  sortKey,
  sortDirection,
  openMenuRowId,
  rangeError,
  loading = false,
  errorMessage,
  emptyMessage,
  pagination,
  theme = 'dark',
  onBack,
  onSearch,
  onExport,
  onSort,
  onToggleMenu,
  onRowAction,
  menuRef,
  modals,
  className,
}: AsistenciaTarjetaProps): JSX.Element {
  return (
    <AsistenciaPage theme={theme} className={className}>
      <div className={[styles.layout, styles[`theme--${theme}`]].join(' ')}>
        <div className={styles.topBar}>
          {onBack ? (
            <button type="button" className={styles.backButton} onClick={onBack}>
              ← Volver al listado de colaboradores
            </button>
          ) : (
            <span />
          )}
          <AsistenciaTarjetaActionsMenu theme={theme} onExport={onExport} />
        </div>

        <AsistenciaPageHeader title={title} subtitle="" theme={theme} />

        <AsistenciaTarjetaEmployeeHeader header={header} theme={theme} />

        <AsistenciaTarjetaFilters
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={onFromDateChange}
          onToDateChange={onToDateChange}
          onSearch={onSearch}
          errorMessage={rangeError}
          theme={theme}
        />

        <AsistenciaTarjetaSummary metrics={summaryMetrics} theme={theme} />

        {loading ? (
          <p className={styles.stateMessage}>Cargando tarjeta de asistencia…</p>
        ) : errorMessage ? (
          <p className={styles.stateMessageError} role="alert">
            {errorMessage}
          </p>
        ) : rows.length === 0 && emptyMessage ? (
          <p className={styles.stateMessage}>{emptyMessage}</p>
        ) : (
          <>
            <AsistenciaTarjetaTable
              rows={rows}
              sortKey={sortKey}
              sortDirection={sortDirection}
              openMenuRowId={openMenuRowId}
              theme={theme}
              onSort={onSort}
              onToggleMenu={onToggleMenu}
              onRowAction={onRowAction}
              menuRef={menuRef}
            />
            {pagination}
          </>
        )}

        {modals}
      </div>
    </AsistenciaPage>
  );
}

export default AsistenciaTarjeta;
