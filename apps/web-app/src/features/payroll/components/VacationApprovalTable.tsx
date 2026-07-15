import { EmpleadoTableHeader, toast, type EmpleadoTheme } from '@restopsiq/ui';
import { Check, Download, X } from 'lucide-react';
import type { CSSProperties } from 'react';

import { useVacationApprovalMutations } from '@/features/my-profile/hooks/useVacationMutations';
import { PayrollApiError } from '@/features/payroll/api/payroll.client';
import {
  VACATION_STATUS_LABELS,
  VACATION_TYPE_LABELS,
  type VacationRequestSummary,
  type VacationStatus,
} from '@/features/payroll/types/vacations.types';
import {
  canApproveVacationLevel1,
  canApproveVacationLevel2,
  canDownloadVacationLetter,
  canRejectVacation,
  formatVacationDate,
} from '@/features/payroll/utils/vacation-display.utils';
import {
  getVacationGridTemplate,
  getVacationTableMinWidthPx,
  VACATION_APPROVAL_COLUMNS,
} from '@/features/payroll/utils/vacation-table-columns';

import styles from './VacationEmpleadoTable.module.scss';
import { VacationTableIconAction } from './VacationTableIconAction';

function StatusBadge({ status }: { status: VacationStatus }): React.JSX.Element {
  return (
    <span className={`${styles.badge} ${styles[`status_${status}`]}`}>
      {VACATION_STATUS_LABELS[status]}
    </span>
  );
}

interface Props {
  requests: VacationRequestSummary[];
  roleCode: string | null | undefined;
  theme?: EmpleadoTheme;
  className?: string;
  onReject: (requestId: string) => void;
}

export function VacationApprovalTable({
  requests,
  roleCode,
  theme = 'dark',
  className,
  onReject,
}: Props): React.JSX.Element {
  const { approveL1, approveL2, letterUrl } = useVacationApprovalMutations();
  const gridTemplate = getVacationGridTemplate(VACATION_APPROVAL_COLUMNS);
  const tableMinWidthPx = getVacationTableMinWidthPx(VACATION_APPROVAL_COLUMNS);

  const handleApproveL1 = async (requestId: string) => {
    try {
      await approveL1.mutateAsync(requestId);
      toast.success('Solicitud aprobada en nivel 1');
    } catch (error) {
      toast.error(error instanceof PayrollApiError ? error.message : 'No se pudo aprobar');
    }
  };

  const handleApproveL2 = async (requestId: string) => {
    try {
      await approveL2.mutateAsync(requestId);
      toast.success('Solicitud aprobada por RRHH');
    } catch (error) {
      toast.error(error instanceof PayrollApiError ? error.message : 'No se pudo aprobar');
    }
  };

  const handleDownload = async (requestId: string) => {
    try {
      const result = await letterUrl.mutateAsync(requestId);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof PayrollApiError ? error.message : 'No se pudo obtener la carta');
    }
  };

  return (
    <section
      className={[styles.table, styles.tableNatural, className].filter(Boolean).join(' ')}
      role="table"
      aria-label="Solicitudes de vacaciones"
    >
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
            columns={VACATION_APPROVAL_COLUMNS}
            theme={theme}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {requests.map((request) => {
              const showApproveL1 =
                request.status === 'SOLICITADA' && canApproveVacationLevel1(roleCode);
              const showApproveL2 =
                request.status === 'APROBADA_NIVEL_1' && canApproveVacationLevel2(roleCode);
              const showReject = canRejectVacation(request.status, roleCode);
              const showDownload = canDownloadVacationLetter(request.status);
              const hasActions = showApproveL1 || showApproveL2 || showReject || showDownload;

              return (
                <div
                  key={request.id}
                  className={styles.row}
                  role="row"
                  style={{ '--vacation-columns': gridTemplate } as CSSProperties}
                >
                  <span className={styles.employeeCell} role="cell">
                    {request.employeeName}
                  </span>
                  <span className={styles.locationCell} role="cell">
                    {request.locationName ?? '—'}
                  </span>
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
                    {showApproveL1 ? (
                      <VacationTableIconAction
                        label="Aprobar (Supervisor)"
                        variant="approve"
                        icon={<Check aria-hidden />}
                        onClick={() => void handleApproveL1(request.id)}
                      />
                    ) : null}
                    {showApproveL2 ? (
                      <VacationTableIconAction
                        label="Aprobar (RRHH)"
                        variant="approve"
                        icon={<Check aria-hidden />}
                        onClick={() => void handleApproveL2(request.id)}
                      />
                    ) : null}
                    {showReject ? (
                      <VacationTableIconAction
                        label="Rechazar"
                        variant="reject"
                        icon={<X aria-hidden />}
                        onClick={() => onReject(request.id)}
                      />
                    ) : null}
                    {showDownload ? (
                      <VacationTableIconAction
                        label="Descargar carta"
                        variant="download"
                        icon={<Download aria-hidden />}
                        onClick={() => void handleDownload(request.id)}
                      />
                    ) : null}
                    {!hasActions ? <span className={styles.emptyAction}>—</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
