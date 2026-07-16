import {
  EmpleadoActionButton,
  RecetaTableHeader,
  type EmpleadoTheme,
  type RecetaTableColumn,
} from '@restopsiq/ui';
import { MapPin } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { PendingAssignment } from '../types/daily-cost-center.types';
import styles from './RotantePendingTable.module.scss';

const COLUMNS: RecetaTableColumn[] = [
  { key: 'employee', label: 'Empleado', width: 'minmax(180px, 1.4fr)' },
  { key: 'date', label: 'Fecha', width: 'minmax(140px, 0.8fr)' },
  { key: 'suggested', label: 'Sede sugerida', width: 'minmax(140px, 1fr)' },
  { key: 'actions', label: 'Acciones', width: '140px', align: 'right' },
];

const GRID_TEMPLATE = COLUMNS.map((column) => column.width ?? '1fr').join(' ');

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

interface Props {
  rows: PendingAssignment[];
  theme: EmpleadoTheme;
  locationNameById: Map<string, string>;
  onAssign: (row: PendingAssignment) => void;
}

export function RotantePendingTable({
  rows,
  theme,
  locationNameById,
  onAssign,
}: Props): React.JSX.Element {
  const recetaTheme = theme === 'light' ? 'light' : 'dark';
  const gridStyle = { '--receta-columns': GRID_TEMPLATE } as CSSProperties;

  return (
    <section className={styles.table} role="table" aria-label="Días pendientes de sede Rotante">
      <div className={styles.scrollRegion}>
        <div className={styles.scrollContent}>
          <RecetaTableHeader
            theme={recetaTheme}
            size="md"
            columns={COLUMNS}
            className={styles.header}
          />
          <div className={styles.body} role="rowgroup">
            {rows.map((row) => {
              const suggested = row.suggestedLocationId
                ? (locationNameById.get(row.suggestedLocationId) ?? row.suggestedLocationId)
                : '—';

              return (
                <div
                  key={`${row.employeeId}-${row.date}`}
                  className={styles.row}
                  role="row"
                  style={gridStyle}
                >
                  <span className={styles.cell} role="cell">
                    {row.employeeName}
                  </span>
                  <span className={styles.cell} role="cell">
                    {formatDate(row.date)}
                  </span>
                  <span className={styles.cellMuted} role="cell">
                    {suggested}
                  </span>
                  <span className={styles.actions} role="cell">
                    <EmpleadoActionButton
                      theme={theme}
                      size="sm"
                      label="Asignar sede"
                      icon={<MapPin size={14} aria-hidden />}
                      onClick={() => onAssign(row)}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
