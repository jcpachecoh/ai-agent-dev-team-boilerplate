import { EmpleadoTableHeader, toast, type EmpleadoTheme } from '@restopsiq/ui';
import { Download } from 'lucide-react';
import type { CSSProperties } from 'react';

import { PayrollApiError } from '@/features/payroll/api/payroll.client';
import styles from '@/features/payroll/components/VacationEmpleadoTable.module.scss';
import { VacationTableIconAction } from '@/features/payroll/components/VacationTableIconAction';
import {
  VACATION_STATUS_LABELS,
  VACATION_TYPE_LABELS,
  type VacationRequest,
  type VacationStatus,
} from '@/features/payroll/types/vacations.types';
import {
  canDownloadVacationLetter,
  formatVacationDate,
} from '@/features/payroll/utils/vacation-display.utils';
import {
  getVacationGridTemplate,
  getVacationTableMinWidthPx,
  VACATION_REQUEST_COLUMNS,
} from '@/features/payroll/utils/vacation-table-columns';

import { useVacationApprovalMutations } from '../hooks/useVacationMutations';

function StatusBadge({ status }: { status: VacationStatus }): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${styles[`status_${status}`]}`}>
      {VACATION_STATUS_LABELS[status]}
    </span>
  );
}

interface Props {
  requests: VacationRequest[];
  theme?: EmpleadoTheme;
}

export function MyVacationRequestsTable({ requests, theme = 'dark' }: Props): React.JSX.Element {
  const { letterUrl } = useVacationApprovalMutations();
  const gridTemplate = getVacationGridTemplate(VACATION_REQUEST_COLUMNS);
  const tableMinWidthPx = getVacationTableMinWidthPx(VACATION_REQUEST_COLUMNS);

  const handleDownload = async (requestId: string) => {
    try {
      const result = await letterUrl.mutateAsync(requestId);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message =
        error instanceof PayrollApiError ? error.message : 'No se pudo obtener la carta';
      toast.error(message);
    }
  };

  return (
    <section className={styles.table} role="table" aria-label="Solicitudes de vacaciones">
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--vacation-table-min-width': `${tableMinWidthPx}px`,
            } as CSSProperties
          }
        >
          <EmpleadoTableHeader
            columns={VACATION_REQUEST_COLUMNS}
            theme={theme}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {requests.map((request) => (
              <div
                key={request.id}
                className={styles.row}
                role="row"
                style={{ '--vacation-columns': gridTemplate } as CSSProperties}
              >
                <span className={styles.datesCell} role="cell">
                  {formatVacationDate(request.startDate)} – {formatVacationDate(request.endDate)}
                </span>
                <span className={styles.typeCell} role="cell">
                  {VACATION_TYPE_LABELS[request.type]}
                </span>
                <span className={styles.daysCell} role="cell">
                  {request.daysRequested}
                </span>
                <div className={styles.statusCell} role="cell">
                  <StatusBadge status={request.status} />
                </div>
                <div className={styles.actionsCell} role="cell">
                  {canDownloadVacationLetter(request.status) ? (
                    <VacationTableIconAction
                      label="Descargar carta"
                      variant="download"
                      icon={<Download aria-hidden />}
                      onClick={() => void handleDownload(request.id)}
                    />
                  ) : (
                    <span className={styles.emptyAction}>—</span>
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
