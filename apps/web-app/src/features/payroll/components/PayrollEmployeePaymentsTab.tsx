import {
  Button,
  EmptyState,
  EmpleadoRowActionButton,
  LoadingState,
  Modal,
  RecetaFormButton,
  StatusBadge,
} from '@restopsiq/ui';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';
import { useMemo, useState } from 'react';

import { getErrorMessage } from '@/lib/graphql-client';

import styles from './PayrollEmployeePaymentsTab.module.scss';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import { PayrollTaxWithholdingBreakdownSection } from './PayrollTaxWithholdingBreakdownSection';
import { getPayrollReport, PayrollApiError } from '../api/payroll.client';
import { payrollKeys } from '../api/queryKeys';
import { useEmployeePaymentHistoryQuery } from '../hooks/useEmployeePaymentHistoryQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type { EmployeePaymentHistoryRecord } from '../types/financial-profile.types';
import {
  formatPaymentDate,
  formatPaymentMethod,
  formatPaymentPeriod,
  formatPayrollCurrency,
  mapPaymentStatusToBadge,
} from '../utils/financial-profile-display';

interface PayrollEmployeePaymentsTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

function formatPayrollPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function PayrollEmployeePaymentsTab({
  userId,
  theme,
}: PayrollEmployeePaymentsTabProps): React.JSX.Element {
  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employeeId = employeeQuery.data?.id;
  const paymentsQuery = useEmployeePaymentHistoryQuery(employeeId);
  const [selectedPayment, setSelectedPayment] = useState<EmployeePaymentHistoryRecord | null>(null);

  const liquidationReportQuery =
    selectedPayment && employeeId
      ? {
          period: formatPayrollPeriod(selectedPayment.periodYear, selectedPayment.periodMonth),
          employeeId,
        }
      : null;
  const liquidationQuery = useQuery({
    queryKey: liquidationReportQuery
      ? payrollKeys.payrollReport(liquidationReportQuery)
      : ['payroll-report', 'idle'],
    queryFn: () => getPayrollReport(liquidationReportQuery!),
    enabled: liquidationReportQuery !== null,
  });
  const liquidationBreakdown = liquidationQuery.data?.employees[0]?.taxWithholdingBreakdown;

  const rows = useMemo(
    () => paymentsQuery.data?.pages.flatMap((page) => page.edges) ?? [],
    [paymentsQuery.data],
  );

  if (employeeQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (employeeQuery.isError || !employeeQuery.data || !employeeId) {
    return (
      <div className={styles.state}>
        <p>No se pudo cargar el colaborador.</p>
        <Button variant="secondary" size="small" onClick={() => void employeeQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (paymentsQuery.isLoading) {
    return <PayrollEmployeeProfileTabLoading />;
  }

  if (paymentsQuery.isError) {
    return (
      <div className={styles.state}>
        <p>{getPaymentsErrorMessage(paymentsQuery.error)}</p>
        <p className={styles.hint}>Requiere permiso nomina.financial.history.read.</p>
        <Button variant="secondary" size="small" onClick={() => void paymentsQuery.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Historial de pagos</h2>
          <p className={styles.subtitle}>
            Liquidaciones registradas por periodo. Solo lectura — los pagos se generan desde el
            proceso de nómina.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          theme={theme}
          variant="search"
          icon={<Receipt size={44} strokeWidth={1.5} />}
          title="Sin pagos registrados"
          description="Aún no hay liquidaciones en el historial de este colaborador."
          className={styles.emptyState}
        />
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Bruto</th>
                  <th>Deducciones</th>
                  <th>Neto</th>
                  <th>Fecha pago</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Referencia</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatPaymentPeriod(row.periodYear, row.periodMonth)}</td>
                    <td>{formatPayrollCurrency(row.grossAmount)}</td>
                    <td>{formatPayrollCurrency(row.totalDeductions)}</td>
                    <td className={styles.netAmount}>{formatPayrollCurrency(row.netAmount)}</td>
                    <td>{formatPaymentDate(row.paymentDate)}</td>
                    <td>{formatPaymentMethod(row.paymentMethod)}</td>
                    <td>
                      <StatusBadge
                        status={mapPaymentStatusToBadge(row.status)}
                        theme={theme}
                        size="sm"
                        variant="pill"
                      />
                    </td>
                    <td className={styles.reference}>{row.transactionReference?.trim() || '—'}</td>
                    <td className={styles.actionsCell}>
                      <EmpleadoRowActionButton
                        variant="view"
                        theme={theme}
                        size="sm"
                        onClick={() => setSelectedPayment(row)}
                        aria-label={`Ver detalle de liquidación ${formatPaymentPeriod(row.periodYear, row.periodMonth)}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paymentsQuery.hasNextPage ? (
            <div className={styles.loadMore}>
              <RecetaFormButton
                type="button"
                theme={theme}
                variant="add"
                label={paymentsQuery.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
                disabled={paymentsQuery.isFetchingNextPage}
                onClick={() => void paymentsQuery.fetchNextPage()}
              />
            </div>
          ) : null}
        </>
      )}

      <Modal
        open={selectedPayment !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setSelectedPayment(null);
          }
        }}
        size="lg"
        theme={theme}
        title={
          selectedPayment
            ? `Liquidación ${formatPaymentPeriod(selectedPayment.periodYear, selectedPayment.periodMonth)}`
            : 'Liquidación'
        }
        description="Desglose de retención en la fuente calculado por el motor de nómina."
        footer={null}
      >
        <div className={styles.detailContent}>
          {selectedPayment && liquidationQuery.isLoading ? (
            <LoadingState message="Cargando liquidación…" theme={theme} layout="compact" />
          ) : null}

          {selectedPayment && liquidationQuery.isError ? (
            <div className={styles.detailState}>
              <p>No se pudo cargar el detalle de la liquidación.</p>
              <Button
                variant="secondary"
                size="small"
                onClick={() => void liquidationQuery.refetch()}
              >
                Reintentar
              </Button>
            </div>
          ) : null}

          {selectedPayment && liquidationBreakdown ? (
            <PayrollTaxWithholdingBreakdownSection breakdown={liquidationBreakdown} />
          ) : null}

          {selectedPayment &&
          !liquidationQuery.isLoading &&
          !liquidationQuery.isError &&
          !liquidationBreakdown ? (
            <p className={styles.detailState}>No hay desglose de retención para este periodo.</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

function getPaymentsErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) {
    if (error.status === 403) {
      return 'No tienes permisos para consultar el historial de pagos de este empleado.';
    }
    return error.message;
  }
  return getErrorMessage(error);
}
