import { ChevronDown, MoreVertical, Smartphone, StickyNote } from 'lucide-react';
import type { JSX } from 'react';

import type {
  AsistenciaTarjetaDayRow,
  AsistenciaTarjetaRowAction,
  AsistenciaTarjetaSortDirection,
  AsistenciaTarjetaSortKey,
  AsistenciaTheme,
} from '../shared/asistencia-types';
import styles from './AsistenciaTarjetaTable.module.scss';

export interface AsistenciaTarjetaTableColumn {
  key: AsistenciaTarjetaSortKey | 'more';
  label: string;
  sortable: boolean;
}

export const ASISTENCIA_TARJETA_TABLE_COLUMNS: AsistenciaTarjetaTableColumn[] = [
  { key: 'dayShort', label: 'Jor', sortable: true },
  { key: 'dateLabel', label: 'Fecha', sortable: true },
  { key: 'shiftName', label: 'Nombre turno', sortable: true },
  { key: 'shiftRange', label: 'Turno', sortable: true },
  { key: 'entryTime', label: 'Entrada', sortable: true },
  { key: 'exitTime', label: 'Salida', sortable: true },
  { key: 'ordinaryHours', label: 'HO', sortable: true },
  { key: 'unworkedHours', label: 'HNT', sortable: true },
  { key: 'overtimeHours', label: 'HHEE', sortable: true },
  { key: 'approvedOvertimeHours', label: 'HEAprob', sortable: true },
  { key: 'targetHours', label: 'HObj', sortable: true },
  { key: 'permissions', label: 'P', sortable: true },
  { key: 'more', label: 'Más', sortable: false },
];

export interface AsistenciaTarjetaTableProps {
  rows: AsistenciaTarjetaDayRow[];
  sortKey?: AsistenciaTarjetaSortKey;
  sortDirection?: AsistenciaTarjetaSortDirection;
  openMenuRowId?: string | null;
  theme?: AsistenciaTheme;
  toleranceNote?: string;
  onSort?: (key: AsistenciaTarjetaSortKey) => void;
  onToggleMenu?: (rowId: string) => void;
  onRowAction?: (row: AsistenciaTarjetaDayRow, action: AsistenciaTarjetaRowAction) => void;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

function TimeCell({
  value,
  automatic,
  manual,
}: {
  value: string;
  automatic?: boolean;
  manual?: boolean;
}): JSX.Element {
  if (value === '—') {
    return <span className={styles.placeholder}>—</span>;
  }

  return (
    <span className={styles.timeCell}>
      {automatic ? <Smartphone className={styles.deviceIcon} aria-hidden /> : null}
      <span>{value}</span>
      {manual ? (
        <span className={styles.manualMark} title="Marcación manual">
          ✎
        </span>
      ) : null}
    </span>
  );
}

export function AsistenciaTarjetaTable({
  rows,
  sortKey,
  sortDirection = 'asc',
  openMenuRowId,
  theme = 'dark',
  toleranceNote = 'Entrada: tolerancia permisiva 10 min',
  onSort,
  onToggleMenu,
  onRowAction,
  menuRef,
  className,
}: AsistenciaTarjetaTableProps): JSX.Element {
  return (
    <div className={[styles.wrap, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}>
      {toleranceNote ? <p className={styles.note}>{toleranceNote}</p> : null}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.expandCol} aria-hidden />
              {ASISTENCIA_TARJETA_TABLE_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className={column.sortable ? styles.sortable : undefined}
                  onClick={
                    column.sortable && onSort
                      ? () => onSort(column.key as AsistenciaTarjetaSortKey)
                      : undefined
                  }
                >
                  {column.label}
                  {column.sortable && sortKey === column.key ? (
                    <span className={styles.sortIndicator}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={[
                  styles.row,
                  row.variant !== 'default' ? styles[`row--${row.variant}`] : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <td className={styles.expandCol}>
                  <ChevronDown className={styles.expandIcon} aria-hidden />
                </td>
                <td>{row.dayShort}</td>
                <td>{row.dateLabel}</td>
                <td className={styles.shiftName}>{row.shiftName}</td>
                <td>{row.shiftRange}</td>
                <td>
                  <TimeCell
                    value={row.entryTime}
                    automatic={row.isAutomaticEntry}
                    manual={row.hasManualMarking}
                  />
                </td>
                <td>
                  <TimeCell value={row.exitTime} automatic={row.isAutomaticExit} />
                </td>
                <td className={styles.mono}>{row.ordinaryHours}</td>
                <td className={styles.mono}>{row.unworkedHours}</td>
                <td className={styles.mono}>{row.overtimeHours}</td>
                <td className={styles.mono}>{row.approvedOvertimeHours}</td>
                <td className={styles.mono}>{row.targetHours}</td>
                <td className={styles.mono}>{row.permissions}</td>
                <td>
                  <div className={styles.menuWrap} ref={openMenuRowId === row.id ? menuRef : null}>
                    {row.hasObservation ? (
                      <button
                        type="button"
                        className={styles.observationButton}
                        aria-label={`Ver observación de ${row.dateLabel}`}
                        onClick={() => onRowAction?.(row, 'observation')}
                      >
                        <StickyNote className={styles.observationMark} size={14} aria-hidden />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.menuButton}
                      aria-label={`Acciones para ${row.dateLabel}`}
                      onClick={() => onToggleMenu?.(row.id)}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuRowId === row.id ? (
                      <div className={styles.menuPanel} role="menu">
                        <button
                          type="button"
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={() => onRowAction?.(row, 'observation')}
                        >
                          Observación
                        </button>
                        <button
                          type="button"
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={() => onRowAction?.(row, 'marking')}
                        >
                          Crear/Editar Marcación
                        </button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AsistenciaTarjetaTable;
