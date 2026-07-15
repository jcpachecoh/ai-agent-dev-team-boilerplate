import { EmpleadoTableHeader, type EmpleadoTheme } from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { PayrollNovedadSummary } from '../types/payroll-novedades.types';
import {
  PAYROLL_NOVEDADES_TABLE_COLUMNS,
  getPayrollNovedadesGridTemplate,
  getPayrollNovedadesTableMinWidthPx,
} from '../utils/payroll-novedades-table.columns';
import { PayrollNovedadTableItem } from './PayrollNovedadTableItem';
import styles from './PayrollNovedadesTable.module.scss';

interface Props {
  novedades: PayrollNovedadSummary[];
  theme: EmpleadoTheme;
  showInboxActions: boolean;
  canWrite: boolean;
  supervisor: boolean;
  rrhh: boolean;
  onApprove: (novedad: PayrollNovedadSummary) => void;
  onReject: (novedad: PayrollNovedadSummary) => void;
  onEdit: (novedad: PayrollNovedadSummary) => void;
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
  canWrite,
  supervisor,
  rrhh,
  onApprove,
  onReject,
  onEdit,
}: Props): React.JSX.Element {
  const gridTemplate = getPayrollNovedadesGridTemplate();

  return (
    <section className={styles.table} role="table" aria-label="Listado de novedades de nómina">
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--empleado-columns': gridTemplate,
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
            {novedades.map((novedad) => {
              const showActions = canActOnNovedad(novedad, showInboxActions, supervisor, rrhh);
              return (
                <PayrollNovedadTableItem
                  key={novedad.id}
                  novedad={novedad}
                  theme={theme}
                  gridTemplate={gridTemplate}
                  showActions={showActions}
                  showEdit={canWrite && !showActions}
                  onApprove={() => onApprove(novedad)}
                  onReject={() => onReject(novedad)}
                  onEdit={() => onEdit(novedad)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
