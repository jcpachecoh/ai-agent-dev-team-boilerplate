import {
  DatePicker,
  EmpleadoActionButton,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  LoadingState,
  toast,
} from '@restopsiq/ui';
import { format, isValid, parse } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';
import { useClientTablePagination } from '@/utils/useClientTablePagination';

import styles from './OvertimeInboxScreen.module.scss';
import { AttendanceApiError } from '../api/attendance.client';
import { AdministrativeOvertimeRequestModal } from '../components/AdministrativeOvertimeRequestModal';
import { OvertimeObjectModal } from '../components/OvertimeObjectModal';
import { OvertimeTable } from '../components/OvertimeTable';
import {
  useApproveOvertimeMutation,
  useCreateAdministrativeOvertimeMutation,
  useObjectOvertimeMutation,
  useOvertimePeriodSummaryQuery,
  useOvertimeRequestsQuery,
} from '../hooks/useOvertimeRequests';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type {
  CreateAdministrativeOvertimeRequestInput,
  OvertimeRequestItem,
} from '../types/overtime.types';
import { canRequestAdministrativeOvertime } from '../utils/overtime-request-rbac';

function currentPayrollPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function payrollPeriodToDate(period: string): Date | undefined {
  const parsed = parse(`${period}-01`, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : undefined;
}

function dateToPayrollPeriod(date: Date): string {
  return format(date, 'yyyy-MM');
}

function mapCreateError(error: unknown): string {
  if (error instanceof AttendanceApiError) {
    if (error.status === 403) {
      return error.message || 'No tiene permiso o sede autorizada para crear la solicitud.';
    }
    if (error.status === 404) {
      return error.message || 'Empleado o motivo no encontrado.';
    }
    if (error.status === 409) {
      return error.message || 'Ya existe una solicitud solapada o duplicada.';
    }
    if (error.status === 400) {
      return error.message || 'Revise los datos del formulario.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'No se pudo crear la solicitud.';
}

export function OvertimeInboxScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const [payrollPeriod, setPayrollPeriod] = useState(currentPayrollPeriod());
  const [objectTarget, setObjectTarget] = useState<OvertimeRequestItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const meQuery = useMe();
  const roleCode = meQuery.data?.roleCode ?? getRoleCodeFromToken();
  const canCreateAdminRequest = canRequestAdministrativeOvertime(roleCode);
  const employeeQuery = usePayrollEmployeeQuery(meQuery.data?.id ?? '');
  const positionId = employeeQuery.data?.positionId ?? null;

  const inboxQuery = useOvertimeRequestsQuery({ payrollPeriod, take: 50 });
  const summaryQuery = useOvertimePeriodSummaryQuery(payrollPeriod);
  const approveMutation = useApproveOvertimeMutation();
  const objectMutation = useObjectOvertimeMutation();
  const createMutation = useCreateAdministrativeOvertimeMutation();

  const items = inboxQuery.data?.items ?? [];
  const pendingCount = summaryQuery.data?.pendingCount ?? 0;
  const { page, pageItems, range, onPrevious, onNext } = useClientTablePagination(items);

  const subtitle = useMemo(
    () => `Período ${payrollPeriod} · ${items.length} solicitud(es)`,
    [payrollPeriod, items.length],
  );

  const handleApprove = async (item: OvertimeRequestItem): Promise<void> => {
    try {
      await approveMutation.mutateAsync({ id: item.id });
      toast.success('Solicitud aprobada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo aprobar la solicitud');
    }
  };

  const handleCreate = async (input: CreateAdministrativeOvertimeRequestInput): Promise<void> => {
    if (createMutation.isPending) {
      return;
    }
    setCreateError(null);
    try {
      const result = await createMutation.mutateAsync(input);
      setCreateOpen(false);
      toast.success(
        result.createdCount === 1
          ? 'Se creó 1 solicitud administrativa'
          : `Se crearon ${result.createdCount} solicitudes administrativas`,
      );
    } catch (error) {
      setCreateError(mapCreateError(error));
    }
  };

  if (inboxQuery.isLoading) {
    return (
      <LoadingState
        message="Cargando solicitudes de tiempo extra…"
        theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
        layout="compact"
      />
    );
  }

  if (inboxQuery.isError) {
    return (
      <div className={styles.state}>
        <p>No fue posible cargar las solicitudes.</p>
        <button type="button" onClick={() => void inboxQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} variant="header" divider>
        <EmpleadoPageHeader
          title="Tiempo extra"
          subtitle={subtitle}
          theme={empleadoTheme}
          size="md"
          primaryAction={
            canCreateAdminRequest ? (
              <EmpleadoActionButton
                theme={empleadoTheme}
                size="md"
                label="Solicitar extensión de jornada"
                onClick={() => {
                  setCreateError(null);
                  setCreateOpen(true);
                }}
              />
            ) : undefined
          }
        />
      </EmpleadoPageSection>

      {pendingCount > 0 ? (
        <EmpleadoPageSection theme={empleadoTheme}>
          <div className={styles.warningBanner} role="status">
            <AlertTriangle size={18} aria-hidden />
            <span>
              Hay {pendingCount} solicitud(es) de tiempo extra pendientes de aprobación para este
              período. Puede continuar el cierre de nómina, pero los minutos no aprobados no se
              liquidarán.
            </span>
          </div>
        </EmpleadoPageSection>
      ) : null}

      <EmpleadoPageSection theme={empleadoTheme} className={styles.tableSection}>
        <div className={styles.filtersBar}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Período de nómina</span>
            <DatePicker
              value={payrollPeriodToDate(payrollPeriod)}
              onChange={(date) => {
                if (!date) {
                  return;
                }
                setPayrollPeriod(dateToPayrollPeriod(date));
              }}
              theme={empleadoTheme}
              size="md"
              className={styles.datePicker}
              placeholder="mm/aaaa"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <div className={styles.state}>No hay solicitudes para este período.</div>
        ) : (
          <OvertimeTable
            items={pageItems}
            theme={empleadoTheme}
            roleCode={roleCode}
            positionId={positionId}
            actionsDisabled={approveMutation.isPending || objectMutation.isPending}
            pagination={{
              page,
              totalPages: range.totalPages,
              summary: range.summary,
              pageLabel: range.pageLabel,
              onPrevious,
              onNext,
            }}
            onApprove={(item) => void handleApprove(item)}
            onObject={setObjectTarget}
          />
        )}
      </EmpleadoPageSection>

      <OvertimeObjectModal
        open={objectTarget !== null}
        loading={objectMutation.isPending}
        onClose={() => setObjectTarget(null)}
        onSubmit={(comment) => {
          if (!objectTarget) {
            return;
          }
          objectMutation.mutate(
            { id: objectTarget.id, comment },
            {
              onSuccess: () => {
                setObjectTarget(null);
                toast.success('Solicitud objetada');
              },
              onError: (error) => {
                toast.error(
                  error instanceof Error ? error.message : 'No se pudo objetar la solicitud',
                );
              },
            },
          );
        }}
      />

      <AdministrativeOvertimeRequestModal
        open={createOpen}
        loading={createMutation.isPending}
        roleCode={roleCode}
        errorMessage={createError}
        onClose={() => {
          if (createMutation.isPending) {
            return;
          }
          setCreateOpen(false);
          setCreateError(null);
        }}
        onSubmit={(input) => void handleCreate(input)}
      />
    </EmpleadoPage>
  );
}
