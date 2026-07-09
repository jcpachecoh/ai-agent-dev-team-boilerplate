import {
  EmpleadoActionButton,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  LoadingState,
  RecetaFilterSelect,
  toast,
} from '@restopsiq/ui';
import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { canWriteMedicalLeaves } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';

import { fetchMedicalLeaveSupportDocumentUrl } from '../api/medical-leaves.client';
import { MedicalLeaveDetailModal } from '../components/MedicalLeaveDetailModal';
import { MedicalLeaveFormModal } from '../components/MedicalLeaveFormModal';
import { MedicalLeaveRejectModal } from '../components/MedicalLeaveRejectModal';
import { MedicalLeavesTable } from '../components/MedicalLeavesTable';
import { useMedicalLeaveMutations } from '../hooks/useMedicalLeaveMutations';
import { useMedicalLeavesQuery } from '../hooks/useMedicalLeavesQuery';
import { useActivePayrollEmployeesQuery } from '../hooks/useActivePayrollEmployeesQuery';
import type {
  LeaveStatus,
  ListMedicalLeavesFilters,
  MedicalLeaveSummary,
} from '../types/medical-leaves.types';
import {
  LEAVE_ORIGIN_FILTER_OPTIONS,
  LEAVE_STATUS_FILTER_OPTIONS,
  buildMedicalLeaveMonthOptions,
  getCurrentMonthValue,
} from '../utils/medical-leaves-display';
import styles from './MedicalLeavesScreen.module.scss';

export function MedicalLeavesScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWriteMedicalLeaves(roleCode);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailSummary, setDetailSummary] = useState<MedicalLeaveSummary | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MedicalLeaveSummary | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const listFilters = useMemo<ListMedicalLeavesFilters>(
    () => ({
      month: selectedMonth || undefined,
      locationId: selectedLocationId || undefined,
      employeeId: selectedEmployeeId || undefined,
      status: (selectedStatus || undefined) as LeaveStatus | undefined,
      origin: (selectedOrigin || undefined) as ListMedicalLeavesFilters['origin'],
      take: 50,
    }),
    [selectedMonth, selectedLocationId, selectedEmployeeId, selectedStatus, selectedOrigin],
  );

  const leavesQuery = useMedicalLeavesQuery(listFilters);
  const locationsQuery = useLocations();
  const employeesQuery = useActivePayrollEmployeesQuery();
  const { updateStatusMutation } = useMedicalLeaveMutations(listFilters);

  const leaves = leavesQuery.data ?? [];

  const locationOptions = useMemo(
    () => [
      { value: '', label: 'Todas las sedes' },
      ...(locationsQuery.data?.map((location) => ({ value: location.id, label: location.name })) ??
        []),
    ],
    [locationsQuery.data],
  );

  const employeeOptions = useMemo(
    () => [
      { value: '', label: 'Todos los empleados' },
      ...(employeesQuery.data ?? [])
        .filter((employee) => employee.id && employee.name)
        .map((employee) => ({
          value: employee.id,
          label: employee.name,
        })),
    ],
    [employeesQuery.data],
  );

  const openDetail = (leave: MedicalLeaveSummary) => {
    setDetailId(leave.id);
    setDetailSummary(leave);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetailSummary(null);
  };

  const handleDownloadSupport = async (leave: MedicalLeaveSummary) => {
    if (!leave.supportStorageObjectId) {
      toast.error('Esta incapacidad no tiene soporte adjunto');
      return;
    }
    setDownloadingId(leave.id);
    try {
      const url = await fetchMedicalLeaveSupportDocumentUrl(leave.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo descargar el soporte';
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusChange = async (leaveId: string, status: LeaveStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: leaveId, input: { status } });
      toast.success('Estado actualizado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el estado';
      toast.error(message);
      throw error;
    }
  };

  return (
    <EmpleadoPage theme={empleadoTheme} className={styles.screen}>
      <EmpleadoPageSection theme={empleadoTheme} divider variant="header">
        <EmpleadoPageHeader
          title="Incapacidades médicas"
          subtitle="Novedades de nómina — registro, radicación y seguimiento EPS/ARL"
          theme={empleadoTheme}
          size="md"
          primaryAction={
            canWrite ? (
              <EmpleadoActionButton
                theme={empleadoTheme}
                size="md"
                label="Registrar incapacidad"
                onClick={() => setCreateOpen(true)}
              />
            ) : undefined
          }
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme}>
        <div className={styles.filtersBar}>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Mes</span>
            <RecetaFilterSelect
              value={selectedMonth}
              options={buildMedicalLeaveMonthOptions()}
              onChange={setSelectedMonth}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Sede</span>
            <RecetaFilterSelect
              value={selectedLocationId}
              options={locationOptions}
              onChange={setSelectedLocationId}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Empleado</span>
            <RecetaFilterSelect
              value={selectedEmployeeId}
              options={employeeOptions}
              onChange={setSelectedEmployeeId}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Estado</span>
            <RecetaFilterSelect
              value={selectedStatus}
              options={LEAVE_STATUS_FILTER_OPTIONS}
              onChange={setSelectedStatus}
              theme={empleadoTheme}
              size="md"
            />
          </div>
          <div className={styles.filterField}>
            <span className={styles.filterLabel}>Origen</span>
            <RecetaFilterSelect
              value={selectedOrigin}
              options={LEAVE_ORIGIN_FILTER_OPTIONS}
              onChange={setSelectedOrigin}
              theme={empleadoTheme}
              size="md"
            />
          </div>
        </div>

        <div className={styles.toolbar}>
          <span className={styles.count}>
            {leaves.length} incapacidad{leaves.length === 1 ? '' : 'es'}
          </span>
        </div>

        {leavesQuery.isLoading ? (
          <LoadingState
            message="Cargando incapacidades…"
            theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
            layout="compact"
          />
        ) : leavesQuery.isError ? (
          <div className={styles.state}>
            <p>No se pudo cargar el listado de incapacidades.</p>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => void leavesQuery.refetch()}
            >
              <RefreshCw size={13} aria-hidden />
              Reintentar
            </button>
          </div>
        ) : leaves.length === 0 ? (
          <div className={styles.state}>
            <p>No hay incapacidades para los filtros seleccionados.</p>
          </div>
        ) : (
          <MedicalLeavesTable
            leaves={leaves}
            theme={empleadoTheme}
            canWrite={canWrite}
            downloadingId={downloadingId}
            statusBusy={updateStatusMutation.isPending}
            onView={openDetail}
            onDownload={(leave) => void handleDownloadSupport(leave)}
            onRadicate={(leave) => void handleStatusChange(leave.id, 'RADICADA_EPS')}
            onRecovered={(leave) => void handleStatusChange(leave.id, 'RECOBRADA')}
            onReject={setRejectTarget}
          />
        )}
      </EmpleadoPageSection>

      <MedicalLeaveFormModal
        open={createOpen}
        listFilters={listFilters}
        onClose={() => setCreateOpen(false)}
      />

      <MedicalLeaveDetailModal
        open={!!detailId}
        leaveId={detailId}
        summary={detailSummary}
        listFilters={listFilters}
        canWrite={canWrite}
        onClose={closeDetail}
        onReject={setRejectTarget}
      />

      {rejectTarget ? (
        <MedicalLeaveRejectModal
          leaveId={rejectTarget.id}
          targetStatus="RECHAZADA"
          busy={updateStatusMutation.isPending}
          onClose={() => setRejectTarget(null)}
          onConfirm={async (reason) => {
            await updateStatusMutation.mutateAsync({
              id: rejectTarget.id,
              input: { status: 'RECHAZADA', rejectionReason: reason },
            });
            setRejectTarget(null);
          }}
        />
      ) : null}
    </EmpleadoPage>
  );
}
