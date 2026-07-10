import { EmpleadoTableHeader, toast, type EmpleadoTheme } from '@restopsiq/ui';
import { Download } from 'lucide-react';
import type { CSSProperties } from 'react';

import { fetchPayrollNovedadSupportUrl } from '@/features/payroll/api/payroll-novedades.client';
import { PayrollNovedadStatusBadge } from '@/features/payroll/components/PayrollNovedadStatusBadge';
import styles from '@/features/payroll/components/PayrollNovedadesTable.module.scss';
import { VacationTableIconAction } from '@/features/payroll/components/VacationTableIconAction';
import type { PayrollNovedadSummary } from '@/features/payroll/types/payroll-novedades.types';
import { NOVEDAD_TYPE_LABELS } from '@/features/payroll/types/payroll-novedades.types';

import {
  getMyNovedadesGridTemplate,
  getMyNovedadesTableMinWidthPx,
  MY_NOVEDADES_TABLE_COLUMNS,
} from '../utils/my-novedades-table.columns';
import rowStyles from './MyNovedadesTable.module.scss';

function formatNovedadDate(value: string): string {
  return value.slice(0, 10);
}

interface Props {
  novedades: PayrollNovedadSummary[];
  theme?: EmpleadoTheme;
}

export function MyNovedadesTable({ novedades, theme = 'dark' }: Props): React.JSX.Element {
  const handleDownload = async (novedadId: string) => {
    try {
      const url = await fetchPayrollNovedadSupportUrl(novedadId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo descargar el soporte');
    }
  };

  return (
    <section className={styles.table} role="table" aria-label="Mis novedades de nómina">
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--empleado-table-min-width': `${getMyNovedadesTableMinWidthPx()}px`,
            } as CSSProperties
          }
        >
          <EmpleadoTableHeader
            columns={MY_NOVEDADES_TABLE_COLUMNS}
            theme={theme}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {novedades.map((novedad) => (
              <div
                key={novedad.id}
                className={rowStyles.row}
                role="row"
                style={
                  {
                    '--empleado-columns': getMyNovedadesGridTemplate(),
                  } as CSSProperties
                }
              >
                <span className={rowStyles.textCell} role="cell">
                  {NOVEDAD_TYPE_LABELS[novedad.type]}
                </span>
                <span className={rowStyles.datesCell} role="cell">
                  {formatNovedadDate(novedad.startDate)} — {formatNovedadDate(novedad.endDate)}
                </span>
                <div className={rowStyles.statusCell} role="cell">
                  <PayrollNovedadStatusBadge status={novedad.status} />
                </div>
                <div className={rowStyles.actionsCell} role="cell">
                  {novedad.supportStorageObjectId ? (
                    <VacationTableIconAction
                      label="Descargar soporte"
                      variant="download"
                      icon={<Download aria-hidden />}
                      onClick={() => void handleDownload(novedad.id)}
                    />
                  ) : novedad.rejectionReason ? (
                    <span className={rowStyles.rejectionHint} title={novedad.rejectionReason}>
                      Motivo de rechazo
                    </span>
                  ) : (
                    <span className={rowStyles.emptyAction}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
