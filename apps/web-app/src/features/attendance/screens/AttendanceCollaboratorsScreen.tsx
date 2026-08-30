import {
  Button,
  EmpleadoListToolbar,
  EmpleadoPage,
  EmpleadoPageHeader,
  EmpleadoPageSection,
  EmpleadoTable,
  EmpleadoTableItem,
  InventarioPrimaryButton,
  LoadingState,
  Modal,
  RecetaFilterSelect,
  RecetaMetricCard,
  RolTextarea,
  toast,
  toggleEmpleadoSort,
  type EmpleadoSortColumnKey,
  type EmpleadoSortDirection,
} from '@restopsiq/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Eraser, FileSpreadsheet, FileText, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isPayrollReadOnlyRole, SYSTEM_ADMIN_ROLES } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';
import { PayrollDeactivateEmployeeDialog } from '@/features/payroll/components/PayrollDeactivateEmployeeDialog';
import { PayrollEmployeeEditDrawer } from '@/features/payroll/components/PayrollEmployeeEditDrawer';
import { PayrollApiError } from '@/features/payroll/api/payroll.client';
import { useEmployeePositions } from '@/features/payroll/hooks/useEmployeePositions';
import {
  useRemovePayrollEmployeeMutation,
  useUpdatePayrollEmployeeMutation,
} from '@/features/payroll/hooks/usePayrollEmployeeMutations';
import type {
  CreatePayrollEmployeeInput,
  PayrollEmployeeFormValues,
  UpdatePayrollEmployeeInput,
} from '@/features/payroll/types/payroll.types';
import type { PayrollEmployeeCreateWizardPayload } from '@/features/payroll/types/payroll-employee-create-wizard.types';
import { applyPayrollEmployeeCreateFinancialProfile } from '@/features/payroll/utils/applyPayrollEmployeeCreateFinancialProfile';
import { applyPayrollEmployeeCreatePersonalData } from '@/features/payroll/utils/applyPayrollEmployeeCreatePersonalData';
import { buildEmployeeFullName } from '@/features/payroll/utils/employee-name';

import { downloadBlob } from '../api/turnos.api';
import { ATTENDANCE_ROUTES } from '../constants/routes';
import { useAttendanceCollaboratorAuditQuery } from '../hooks/useAttendanceCollaboratorAuditQuery';
import {
  useEmailAttendanceCollaboratorsExportMutation,
  useExportAttendanceCollaboratorsMutation,
  useTogglePortalWorkerMutation,
} from '../hooks/useAttendanceCollaboratorMutations';
import { useAttendanceCollaboratorSupervisorsQuery } from '../hooks/useAttendanceCollaboratorSupervisorsQuery';
import { useAttendanceCollaboratorsQuery } from '../hooks/useAttendanceCollaboratorsQuery';
import {
  ATTENDANCE_COLLABORATORS_PAGE_SIZE_OPTIONS,
  useAttendanceCollaboratorsFilters,
  type AttendanceCollaboratorsPageSize,
} from '../hooks/useAttendanceCollaboratorsFilters';
import { useAttendanceScopeLocations } from '../hooks/useAttendanceScopeLocations';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import {
  resetAttendanceModuleFilters,
  useLaborClassificationFilter,
} from '../stores/attendance-labor-filter.store';
import type {
  AttendanceCollaborator,
  AttendanceCollaboratorAuditEntry,
  AttendanceCollaboratorExportFormat,
  AttendanceCollaboratorTodayShift,
} from '../types/attendance.types';
import styles from './AttendanceCollaboratorsScreen.module.scss';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXPORT_FORMAT_OPTIONS = [
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

const CONTRACT_OPTIONS = [
  { value: 'all', label: 'Todos los contratos' },
  { value: 'FIJO', label: 'Fijo' },
  { value: 'INDEFINIDO', label: 'Indefinido' },
  { value: 'OBRA', label: 'Obra o labor' },
  { value: 'PRESTACION', label: 'Prestación de servicios' },
  { value: 'APRENDIZAJE', label: 'Aprendizaje' },
];

function toCreateInput(values: PayrollEmployeeFormValues): CreatePayrollEmployeeInput {
  return {
    cedula: values.cedula.trim(),
    documentType: values.documentType,
    email: values.email.trim(),
    locationId: values.locationId.trim(),
    name: buildEmployeeFullName(values),
    positionId: values.positionId.trim(),
    area: values.area.trim(),
    department: values.department.trim(),
    contractType: values.contractType,
    hireDate: values.hireDate,
    contractStart: values.contractStart,
    contractEnd: values.contractEnd.trim() || undefined,
    salaryType: values.salaryType,
    salaryAmount: Number(values.salaryAmount),
    epsName: values.epsName.trim(),
    pensionFundName: values.pensionFundName.trim(),
    cesantiasFundName: values.cesantiasFundName.trim(),
    arlName: values.arlName.trim(),
    arlRiskLevel: values.arlRiskLevel,
    cajaCompensacion: values.cajaCompensacion.trim(),
    costCenter: values.costCenter,
    laborClassification: values.laborClassification,
    barrio: values.barrio.trim() || undefined,
    localidad: values.localidad.trim() || undefined,
    nonSalaryAmount:
      values.nonSalaryAmount.trim() !== '' ? Number(values.nonSalaryAmount) : undefined,
    beneficiaries: values.beneficiaries.map((b) => ({
      documentType: b.documentType || undefined,
      documentNumber: b.documentNumber.trim() || undefined,
      primerNombre: b.primerNombre.trim(),
      segundoNombre: b.segundoNombre.trim() || undefined,
      primerApellido: b.primerApellido.trim(),
      segundoApellido: b.segundoApellido.trim() || undefined,
      relationshipType: b.relationshipType,
      disability: b.disability,
      fechaNacimiento: b.fechaNacimiento,
    })),
  };
}

function toUpdateInput(values: PayrollEmployeeFormValues): UpdatePayrollEmployeeInput {
  return toCreateInput(values);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof PayrollApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

function formatTodayShiftLabel(todayShift: AttendanceCollaboratorTodayShift): string {
  if (todayShift.type === 'ASSIGNED' && todayShift.turno) {
    return `${todayShift.turno.sigla} ${todayShift.turno.horaInicio}-${todayShift.turno.horaFin}`;
  }
  if (todayShift.type === 'REST') return 'Descanso';
  return 'Turno Base';
}

function formatSupervisorsLabel(collaborator: AttendanceCollaborator): string {
  if (collaborator.supervisors.length === 0) return 'N/A';
  return collaborator.supervisors.map((supervisor) => supervisor.name).join(', ');
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `${key}: ${String(val)}`)
      .join(', ');
  }
  return String(value);
}

function parseEmailRecipients(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function AttendanceCollaboratorsScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const empleadoTheme = theme === 'light' ? 'light' : 'dark';
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const readOnly = isPayrollReadOnlyRole(roleCode);
  const isSystemAdmin = (SYSTEM_ADMIN_ROLES as readonly string[]).includes(roleCode ?? '');
  const { value: laborFilter } = useLaborClassificationFilter();
  const { locations: scopedLocations } = useAttendanceScopeLocations();
  const positionsQuery = useEmployeePositions();
  const supervisorsQuery = useAttendanceCollaboratorSupervisorsQuery();

  const {
    state,
    buildQueryFilters,
    setSearch,
    setArea,
    setContractType,
    setLocationId,
    setPositionId,
    setSupervisorUserId,
    setStatusFilter,
    setPage,
    setPageSize,
    resetFilters,
  } = useAttendanceCollaboratorsFilters(20);

  const [sortColumn, setSortColumn] = useState<EmpleadoSortColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<EmpleadoSortDirection>('asc');

  const queryFilters = {
    ...buildQueryFilters(laborFilter),
    sortBy: sortColumn ?? undefined,
    sortDir: sortColumn ? sortDirection : undefined,
  };

  const collaboratorsQuery = useAttendanceCollaboratorsQuery(queryFilters);
  const queryClient = useQueryClient();
  const updateEmployee = useUpdatePayrollEmployeeMutation();
  const removeEmployee = useRemovePayrollEmployeeMutation();

  const [editingUserId, setEditingUserId] = useState<string | undefined>();
  const [statusChangeUserId, setStatusChangeUserId] = useState<string | undefined>();

  const editingEmployeeQuery = usePayrollEmployeeQuery(editingUserId ?? '');
  const statusChangeEmployeeQuery = usePayrollEmployeeQuery(statusChangeUserId ?? '');

  const togglePortalWorker = useTogglePortalWorkerMutation();
  const exportCollaborators = useExportAttendanceCollaboratorsMutation();
  const emailExportCollaborators = useEmailAttendanceCollaboratorsExportMutation();

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailFormat, setEmailFormat] = useState<AttendanceCollaboratorExportFormat>('excel');
  const [historyEmployeeDetailsId, setHistoryEmployeeDetailsId] = useState<string | undefined>();

  const auditQuery = useAttendanceCollaboratorAuditQuery(historyEmployeeDetailsId);
  const emailRecipientList = parseEmailRecipients(emailRecipients);
  const emailRecipientsValid =
    emailRecipientList.length > 0 &&
    emailRecipientList.length <= 10 &&
    emailRecipientList.every((recipient) => EMAIL_REGEX.test(recipient));

  const handleSortColumn = (column: EmpleadoSortColumnKey) => {
    const next = toggleEmpleadoSort(sortColumn, sortDirection, column);
    setSortColumn(next.column);
    setSortDirection(next.direction);
  };

  const handleClearFilters = () => {
    resetFilters();
    resetAttendanceModuleFilters();
  };

  const handleView = (collaborator: AttendanceCollaborator) => {
    if (!collaborator.locationId) {
      toast.error('Este colaborador no tiene una sede asignada.');
      return;
    }
    navigate(ATTENDANCE_ROUTES.employeeCard(collaborator.locationId, collaborator.userId));
  };

  const handleTogglePortalWorker = async (employeeDetailsId: string, enabled: boolean) => {
    try {
      await togglePortalWorker.mutateAsync({ employeeDetailsId, enabled });
      toast.success(enabled ? 'Portal trabajador activado' : 'Portal trabajador desactivado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleExport = async (format: AttendanceCollaboratorExportFormat) => {
    try {
      const blob = await exportCollaborators.mutateAsync({ format, filters: queryFilters });
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `colaboradores_asistencia_${date}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      toast.success('Exportación completada');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleSendEmailExport = async () => {
    try {
      await emailExportCollaborators.mutateAsync({
        recipients: emailRecipientList,
        format: emailFormat,
        filters: queryFilters,
      });
      toast.success('Correo enviado');
      setEmailModalOpen(false);
      setEmailRecipients('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const items = collaboratorsQuery.data?.items ?? [];
  const summary = collaboratorsQuery.data?.summary;
  const pagination = collaboratorsQuery.data?.pagination;
  const totalCount = summary?.total ?? 0;
  const activeCount = summary?.active ?? 0;
  const inactiveCount = summary?.inactive ?? 0;
  const page = pagination?.page ?? state.page;
  const pageSize = pagination?.pageSize ?? state.pageSize;
  const totalPages = pagination?.totalPages ?? 1;
  const pageStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalCount);

  const areaOptions = [
    { value: 'all', label: 'Todas las áreas' },
    ...[...new Set(items.map((item) => item.area).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, 'es'))
      .map((value) => ({ value, label: value })),
  ];

  const positionOptions = [
    { value: 'all', label: 'Todas las especialidades' },
    ...(positionsQuery.data ?? [])
      .filter((position) => position.isActive)
      .map((position) => ({ value: position.id, label: position.title })),
  ];

  const supervisorList = supervisorsQuery.data ?? [];
  // Bug fix OS-550: si ya cargó y no hay ningún SUPERVISOR/MANAGER visible en el scope del
  // caller, decirlo explícitamente en vez de dejar solo "Todos los supervisores" — eso se ve
  // idéntico a un dropdown roto/sin cargar.
  const noSupervisorsConfigured =
    !supervisorsQuery.isLoading && !supervisorsQuery.isError && supervisorList.length === 0;

  const supervisorOptions = noSupervisorsConfigured
    ? [{ value: 'all', label: 'No hay supervisores configurados' }]
    : [
        { value: 'all', label: 'Todos los supervisores' },
        ...supervisorList.map((supervisor) => ({
          value: supervisor.id,
          label: supervisor.name,
        })),
      ];

  const locationOptions = [
    { value: 'all', label: 'Todas las sedes' },
    ...scopedLocations
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name, 'es'))
      .map((location) => ({ value: location.id, label: location.name })),
  ];

  const handleEdit = async (payload: PayrollEmployeeCreateWizardPayload) => {
    if (!editingEmployeeQuery.data) return;

    try {
      await updateEmployee.mutateAsync({
        userId: editingEmployeeQuery.data.userId,
        input: toUpdateInput(payload.employee),
      });
      await applyPayrollEmployeeCreatePersonalData(
        editingEmployeeQuery.data.userId,
        payload.employee,
      );
      await applyPayrollEmployeeCreateFinancialProfile(
        editingEmployeeQuery.data.id,
        payload,
        queryClient,
      );
      toast.success('Colaborador actualizado');
      setEditingUserId(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleStatusChange = async () => {
    const employee = statusChangeEmployeeQuery.data;
    if (!employee) return;

    try {
      if (employee.isActive) {
        await removeEmployee.mutateAsync(employee.userId);
        toast.success('Colaborador desactivado');
      } else {
        await updateEmployee.mutateAsync({
          userId: employee.userId,
          input: { isActive: true },
        });
        toast.success('Colaborador activado');
      }
      setStatusChangeUserId(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <EmpleadoPage theme={empleadoTheme}>
      <EmpleadoPageSection theme={empleadoTheme} divider variant="header">
        <EmpleadoPageHeader
          title="Colaboradores"
          subtitle={`Clasificación, sede y contrato · ${activeCount} activos de ${totalCount}`}
          theme={empleadoTheme}
        />
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider>
        <div className={styles.metrics}>
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Total"
            value={totalCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Activos"
            value={activeCount}
            variant="type-2"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Inactivos"
            value={inactiveCount}
            variant="type-3"
            showIcon={false}
          />
          <RecetaMetricCard
            theme={empleadoTheme}
            size="sm"
            title="Alcance sede"
            value={scopedLocations.length}
            variant="type-1"
            showIcon={false}
          />
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} divider variant="toolbar">
        {readOnly ? (
          <p className={styles.readOnlyBanner} role="status">
            Tu rol solo permite consultar colaboradores. Para crear, editar o desactivar registros,
            contacta a un administrador.
          </p>
        ) : null}
        <EmpleadoListToolbar
          searchValue={state.search}
          statusFilter={state.statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          theme={empleadoTheme}
        />
        <div className={styles.toolbarFilters}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Especialidad</span>
            <RecetaFilterSelect
              aria-label="Filtrar por especialidad"
              options={positionOptions}
              value={state.positionId}
              onChange={setPositionId}
              theme={empleadoTheme}
              size="md"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Área</span>
            <RecetaFilterSelect
              aria-label="Filtrar por área"
              options={areaOptions}
              value={state.area}
              onChange={setArea}
              theme={empleadoTheme}
              size="md"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Contrato</span>
            <RecetaFilterSelect
              aria-label="Filtrar por tipo de contrato"
              options={CONTRACT_OPTIONS}
              value={state.contractType}
              onChange={(value) => setContractType(value as typeof state.contractType)}
              theme={empleadoTheme}
              size="md"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Supervisor</span>
            <RecetaFilterSelect
              aria-label="Filtrar por supervisor"
              options={supervisorOptions}
              value={state.supervisorUserId}
              onChange={setSupervisorUserId}
              theme={empleadoTheme}
              size="md"
              disabled={noSupervisorsConfigured}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Sede</span>
            <RecetaFilterSelect
              aria-label="Filtrar por sede"
              options={locationOptions}
              value={state.locationId}
              onChange={setLocationId}
              theme={empleadoTheme}
              size="md"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Entradas por página</span>
            <RecetaFilterSelect
              aria-label="Entradas por página"
              options={ATTENDANCE_COLLABORATORS_PAGE_SIZE_OPTIONS.map((size) => ({
                value: String(size),
                label: String(size),
              }))}
              value={String(state.pageSize)}
              onChange={(value) => setPageSize(Number(value) as AttendanceCollaboratorsPageSize)}
              theme={empleadoTheme}
              size="md"
            />
          </label>
        </div>
        <div className={styles.actionsRow}>
          <InventarioPrimaryButton
            label="Limpiar filtros"
            variant="ghost"
            icon={<Eraser aria-hidden />}
            theme={empleadoTheme}
            size="sm"
            onClick={() => {
              handleClearFilters();
              setSortColumn(null);
              setSortDirection('asc');
            }}
          />
          <div className={styles.exportActions}>
            <InventarioPrimaryButton
              label="Exportar Excel"
              variant="success"
              icon={<FileSpreadsheet aria-hidden />}
              theme={empleadoTheme}
              size="sm"
              disabled={exportCollaborators.isPending}
              onClick={() => void handleExport('excel')}
            />
            <InventarioPrimaryButton
              label="Exportar PDF"
              variant="danger"
              icon={<FileText aria-hidden />}
              theme={empleadoTheme}
              size="sm"
              disabled={exportCollaborators.isPending}
              onClick={() => void handleExport('pdf')}
            />
            <InventarioPrimaryButton
              label="Enviar por correo"
              variant="primary"
              icon={<Mail aria-hidden />}
              theme={empleadoTheme}
              size="sm"
              onClick={() => setEmailModalOpen(true)}
            />
          </div>
        </div>
      </EmpleadoPageSection>

      <EmpleadoPageSection theme={empleadoTheme} className={styles.tableSection}>
        {collaboratorsQuery.isLoading ? (
          <LoadingState
            message="Cargando colaboradores…"
            theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
            layout="compact"
          />
        ) : null}

        {collaboratorsQuery.isError ? (
          <div className={styles.state}>
            <p>No se pudieron cargar colaboradores.</p>
            <button type="button" onClick={() => void collaboratorsQuery.refetch()}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!collaboratorsQuery.isLoading && !collaboratorsQuery.isError && items.length === 0 ? (
          <div className={styles.state}>
            No se encontraron colaboradores con los criterios ingresados
          </div>
        ) : null}

        {!collaboratorsQuery.isLoading && !collaboratorsQuery.isError && items.length > 0 ? (
          <EmpleadoTable
            theme={empleadoTheme}
            showActions
            showAttendanceColumns
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSortColumn={handleSortColumn}
            pagination={{
              page,
              totalPages,
              summary: `${pageStart}-${pageEnd} de ${totalCount}`,
              onPrevious: () => setPage(Math.max(1, page - 1)),
              onNext: () => setPage(Math.min(totalPages, page + 1)),
            }}
          >
            {items.map((collaborator) => (
              <EmpleadoTableItem
                key={collaborator.id}
                id={collaborator.id}
                name={collaborator.name}
                email={collaborator.email}
                cedula={collaborator.cedula}
                position={collaborator.positionName}
                area={collaborator.area}
                contractType={collaborator.contractType}
                locationName={collaborator.locationName ?? collaborator.locationId}
                isActive={collaborator.isActive}
                theme={empleadoTheme}
                showActions
                showAttendanceColumns
                primerApellido={collaborator.primerApellido}
                segundoApellido={collaborator.segundoApellido}
                supervisorsLabel={formatSupervisorsLabel(collaborator)}
                turnoLabel={formatTodayShiftLabel(collaborator.todayShift)}
                portalWorker={{
                  checked: collaborator.portalWorkerEnabled,
                  disabled: !isSystemAdmin,
                  loading:
                    togglePortalWorker.isPending &&
                    togglePortalWorker.variables?.employeeDetailsId === collaborator.id,
                  onChange: (checked) => void handleTogglePortalWorker(collaborator.id, checked),
                }}
                onView={() => handleView(collaborator)}
                viewLabel="Ver tarjeta de asistencia"
                onEdit={readOnly ? undefined : () => setEditingUserId(collaborator.userId)}
                onToggleStatus={
                  readOnly ? undefined : () => setStatusChangeUserId(collaborator.userId)
                }
                onHistory={
                  isSystemAdmin ? () => setHistoryEmployeeDetailsId(collaborator.id) : undefined
                }
              />
            ))}
          </EmpleadoTable>
        ) : null}
      </EmpleadoPageSection>

      {!readOnly ? (
        <>
          <PayrollEmployeeEditDrawer
            employee={editingEmployeeQuery.data}
            open={Boolean(editingUserId)}
            submitting={updateEmployee.isPending}
            theme={empleadoTheme}
            onClose={() => setEditingUserId(undefined)}
            onSubmit={(payload) => void handleEdit(payload)}
          />

          <PayrollDeactivateEmployeeDialog
            employee={statusChangeEmployeeQuery.data}
            open={Boolean(statusChangeUserId)}
            submitting={removeEmployee.isPending || updateEmployee.isPending}
            theme={empleadoTheme}
            onCancel={() => setStatusChangeUserId(undefined)}
            onConfirm={() => void handleStatusChange()}
          />
        </>
      ) : null}

      <Modal
        open={emailModalOpen}
        onOpenChange={(next) => {
          if (!next && !emailExportCollaborators.isPending) setEmailModalOpen(false);
        }}
        size="md"
        theme={empleadoTheme}
        title="Enviar listado por correo"
        description="Se enviará el listado con los filtros actualmente aplicados en la pantalla."
        footer={
          <>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => setEmailModalOpen(false)}
              disabled={emailExportCollaborators.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={() => void handleSendEmailExport()}
              disabled={!emailRecipientsValid || emailExportCollaborators.isPending}
            >
              {emailExportCollaborators.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </>
        }
      >
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Destinatarios (separados por coma, máx. 10)</span>
          <RolTextarea
            value={emailRecipients}
            onChange={(event) => setEmailRecipients(event.target.value)}
            theme={empleadoTheme}
            rows={3}
            placeholder="correo1@empresa.com, correo2@empresa.com"
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Formato</span>
          <RecetaFilterSelect
            aria-label="Formato de exportación"
            options={EXPORT_FORMAT_OPTIONS}
            value={emailFormat}
            onChange={(value) => setEmailFormat(value as AttendanceCollaboratorExportFormat)}
            theme={empleadoTheme}
            size="md"
          />
        </div>
      </Modal>

      <Modal
        open={Boolean(historyEmployeeDetailsId)}
        onOpenChange={(next) => {
          if (!next) setHistoryEmployeeDetailsId(undefined);
        }}
        size="md"
        theme={empleadoTheme}
        title="Historial de cambios"
        description="Últimos cambios registrados en auditoría para este colaborador."
      >
        {auditQuery.isLoading ? (
          <LoadingState
            message="Cargando historial…"
            theme={empleadoTheme === 'dark' ? 'dark' : 'light'}
            layout="inline"
          />
        ) : null}
        {auditQuery.isError ? <p>No se pudo cargar el historial.</p> : null}
        {!auditQuery.isLoading && !auditQuery.isError && (auditQuery.data ?? []).length === 0 ? (
          <p>No hay historial de cambios para este colaborador</p>
        ) : null}
        {(auditQuery.data ?? []).length > 0 ? (
          <ul className={styles.historyList}>
            {(auditQuery.data as AttendanceCollaboratorAuditEntry[]).map((entry) => (
              <li key={entry.id} className={styles.historyEntry}>
                <div className={styles.historyMeta}>
                  <span>{entry.actorName ?? 'Sistema'}</span>
                  <span>{new Date(entry.createdAt).toLocaleString('es-CO')}</span>
                </div>
                <div className={styles.historyValue}>
                  <strong>Acción:</strong> {entry.action}
                </div>
                <div className={styles.historyValue}>
                  <strong>Anterior:</strong> {formatAuditValue(entry.oldValue)}
                </div>
                <div className={styles.historyValue}>
                  <strong>Nuevo:</strong> {formatAuditValue(entry.newValue)}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Modal>
    </EmpleadoPage>
  );
}
