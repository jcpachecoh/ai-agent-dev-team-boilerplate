import { EmpleadoTableHeader, type EmpleadoTheme } from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { PayrollNovedadSummary } from '../types/payroll-novedades.types';
import {
  PAYROLL_NOVEDADES_TABLE_COLUMNS,
  getPayrollNovedadesTableMinWidthPx,
} from '../utils/payroll-novedades-table.columns';
import { PayrollNovedadTableItem } from './PayrollNovedadTableItem';
import styles from './PayrollNovedadesTable.module.scss';

interface Props {
  novedades: PayrollNovedadSummary[];
  theme: EmpleadoTheme;
  showInboxActions: boolean;
  supervisor: boolean;
  rrhh: boolean;
  onApprove: (novedad: PayrollNovedadSummary) => void;
  onReject: (novedad: PayrollNovedadSummary) => void;
}

function canActOnNovedad(
  novedad: PayrollNovedadSummary,
  showInboxActions: boolean,
  supervisor: boolean,
  rrhh: boolean,
): boolean {
  if (!showInboxActions) return false;
  if (novedad.status === 'PENDIENTE_SUPERVISOR' && supervisor) return true;
  if (novedad.status === 'PENDIENTE_RRHH' && rrhh) return true;
  return false;
}

export function PayrollNovedadesTable({
  novedades,
  theme,
  showInboxActions,
  supervisor,
  rrhh,
  onApprove,
  onReject,
}: Props): React.JSX.Element {
  return (
    <section className={styles.table} role="table" aria-label="Listado de novedades de nómina">
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--empleado-table-min-width': `${getPayrollNovedadesTableMinWidthPx()}px`,
            } as CSSProperties
          }
        >
          <EmpleadoTableHeader
            columns={PAYROLL_NOVEDADES_TABLE_COLUMNS}
            theme={theme}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {novedades.map((novedad) => (
              <PayrollNovedadTableItem
                key={novedad.id}
                novedad={novedad}
                theme={theme}
                showActions={canActOnNovedad(novedad, showInboxActions, supervisor, rrhh)}
                onApprove={() => onApprove(novedad)}
                onReject={() => onReject(novedad)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
