import {
  type CargoColumnDef,
  CargoActionButton,
  CargoPage,
  CargoPageHeader,
  CargoPageSection,
  CargoTable,
  CargoTableItem,
  EmptyState,
  InventarioExportActions,
  InventarioPrimaryButton,
  InventarioSearch,
  RecetaFilterSelect,
  toast,
} from '@restopsiq/ui';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { canWriteTurnos } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getRoleCodeFromToken } from '@/lib/auth-token';
import { useTheme } from '@/providers/ThemeProvider';

import { TurnosApiError, downloadBlob } from '../api/turnos.api';
import { TurnosCreateModal } from '../components/turnos/TurnosCreateModal';
import { TurnosDeactivateDialog } from '../components/turnos/TurnosDeactivateDialog';
import { TurnosEditModal } from '../components/turnos/TurnosEditModal';
import { TurnosSubNav } from '../components/turnos/TurnosSubNav';
import { TURNOS_PAGE_SIZE_OPTIONS, useTurnosFilters } from '../hooks/useTurnosFilters';
import {
  useCreateTurnoMutation,
  useExportTurnosMutation,
  useUpdateTurnoEstadoMutation,
  useUpdateTurnoMutation,
} from '../hooks/useTurnosMutations';
import { useTurnosQuery } from '../hooks/useTurnosQuery';
import type {
  CreateTurnoInput,
  Turno,
  TurnoConflictErrorBody,
  TurnoEstadoFilter,
  TurnoFormValues,
  TurnoJornada,
  TurnoTipo,
  UpdateTurnoInput,
} from '../types/turnos.types';
import styles from './TurnosListScreen.module.scss';

const ESTADO_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all', label: 'Todos' },
] as const;

const TIPO_LABELS: Record<TurnoTipo, string> = {
  PERMANENTE: 'Permanente',
  VARIABLE: 'Variable',
};

const JORNADA_LABELS: Record<TurnoJornada, string> = {
  DIURNO: 'Diurno',
  NOCTURNO: 'Nocturno',
  MIXTO: 'Mixto',
};

const TURNOS_TABLE_COLUMNS: CargoColumnDef[] = [
  { key: 'title', label: 'Nombre del turno', width: 'minmax(200px, 1.4fr)', align: 'center' },
  { key: 'area', label: 'Sigla', width: 'minmax(140px, 1fr)', align: 'center' },
  { key: 'salary', label: 'Horario', width: 'minmax(220px, 1.4fr)', align: 'center' },
  { key: 'status', label: 'Estado', width: 'minmax(108px, max-content)', align: 'center' },
  { key: 'actions', label: 'Acciones', width: '72px', align: 'center' },
];

function getTurnosTableColumns(showActions: boolean): CargoColumnDef[] {
  if (showActions) {
    return TURNOS_TABLE_COLUMNS;
  }
  return TURNOS_TABLE_COLUMNS.filter((column) => column.key !== 'actions');
}

function getErrorMessage(error: unknown): string {
  if (error instanceof TurnosApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

function toCreateInput(values: TurnoFormValues): CreateTurnoInput {
  return {
    nombre: values.nombre.trim(),
    sigla: values.sigla.trim(),
    tipo: values.tipo,
    jornada: values.jornada,
    horaInicio: values.horaInicio,
    horaFin: values.horaFin,
  };
}

function toUpdateInput(values: TurnoFormValues): UpdateTurnoInput {
  return toCreateInput(values);
}

function getConflictBody(error: unknown): TurnoConflictErrorBody | undefined {
  if (error instanceof TurnosApiError && error.body && typeof error.body === 'object') {
    return error.body as TurnoConflictErrorBody;
  }
  return undefined;
}

function formatTurnoSchedule(turno: Turno): string {
  return `${TIPO_LABELS[turno.tipo]} · ${JORNADA_LABELS[turno.jornada]} · ${turno.horaInicio}–${turno.horaFin}`;
}

export function TurnosListScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const cargoTheme = theme === 'light' ? 'light' : 'dark';
  const inventarioTheme = cargoTheme;
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWriteTurnos(roleCode);

  const {
    state,
    queryFilters,
    exportFilters,
    setSearch,
    setEstadoDraft,
    applyEstadoFilter,
    setPage,
    setPageSize,
  } = useTurnosFilters(50);

  const turnosQuery = useTurnosQuery(queryFilters);
  const createTurno = useCreateTurnoMutation();
  const updateTurno = useUpdateTurnoMutation();
  const updateEstado = useUpdateTurnoEstadoMutation();
  const exportTurnos = useExportTurnosMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | undefined>();
  const [statusChangeTurno, setStatusChangeTurno] = useState<Turno | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const turnos = turnosQuery.data?.data ?? [];
  const pagination = turnosQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const page = pagination?.page ?? state.page;
  const limit = pagination?.limit ?? state.pageSize;
  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = Math.min(page * limit, total);

  const handleCreate = async (values: TurnoFormValues) => {
    try {
      await createTurno.mutateAsync(toCreateInput(values));
      toast.success('Turno creado correctamente');
      setCreateOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = async (values: TurnoFormValues) => {
    if (!editingTurno) {
      return;
    }

    try {
      await updateTurno.mutateAsync({
        id: editingTurno.id,
        input: toUpdateInput(values),
      });
      toast.success('Turno actualizado');
      setEditingTurno(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleToggleRequest = (turno: Turno) => {
    if (!canWrite) {
      return;
    }
    setStatusChangeTurno(turno);
  };

  const handleStatusChange = async () => {
    if (!statusChangeTurno) {
      return;
    }

    const nextEstado = !statusChangeTurno.estado;
    setTogglingId(statusChangeTurno.id);

    try {
      await updateEstado.mutateAsync({
        id: statusChangeTurno.id,
        estado: nextEstado,
      });
      toast.success(nextEstado ? 'Turno activado' : 'Turno desactivado');
      setStatusChangeTurno(undefined);
    } catch (error) {
      const conflict = getConflictBody(error);
      if (conflict?.affectedCount && conflict.affectedCount > 0) {
        toast.error(
          conflict.message ??
            `No se puede desactivar: ${conflict.affectedCount} colaborador(es) con asignación activa.`,
        );
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportTurnos.mutateAsync(exportFilters);
      if (!blob) {
        toast.info('No hay datos para exportar con los filtros actuales');
        return;
      }
      downloadBlob(blob, `turnos-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Exportación completada');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const emptyMessage =
    total === 0 && !turnosQuery.isLoading
      ? 'No hay turnos para los filtros seleccionados'
      : 'No hay turnos registrados';

  return (
    <CargoPage theme={cargoTheme} className={styles.screen}>
      <CargoPageSection theme={cargoTheme} divider variant="header">
        <TurnosSubNav />
        <CargoPageHeader
          title="Detalle de turnos"
          subtitle="Consulta, filtra y administra los turnos configurados"
          theme={cargoTheme}
          primaryAction={
            canWrite ? (
              <span className={styles.createButtonWrap}>
                <CargoActionButton
                  label="Crear turno"
                  theme={cargoTheme}
                  onClick={() => setCreateOpen(true)}
                />
              </span>
            ) : undefined
          }
        />
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme} divider variant="toolbar">
        {canWrite ? null : (
          <p className={styles.readOnlyBanner} role="status">
            Tu rol solo permite consultar y exportar turnos. Para crear, editar o cambiar estado,
            contacta a un administrador.
          </p>
        )}
        <div className={styles.filterBar}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Estado</span>
            <RecetaFilterSelect
              aria-label="Filtrar por estado"
              options={ESTADO_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              value={state.estadoDraft}
              onChange={(value) => setEstadoDraft(value as TurnoEstadoFilter)}
              theme={cargoTheme}
              size="md"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Entradas por página</span>
            <RecetaFilterSelect
              aria-label="Entradas por página"
              options={TURNOS_PAGE_SIZE_OPTIONS.map((size) => ({
                value: String(size),
                label: String(size),
              }))}
              value={String(state.pageSize)}
              onChange={(value) =>
                setPageSize(Number(value) as (typeof TURNOS_PAGE_SIZE_OPTIONS)[number])
              }
              theme={cargoTheme}
              size="md"
            />
          </label>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Buscar</span>
            <InventarioSearch
              value={state.search}
              placeholder="Nombre, sigla o tipo"
              onChange={setSearch}
              theme={inventarioTheme}
              size="md"
              ariaLabel="Buscar turnos"
            />
          </div>

          <div className={styles.exportActions}>
            <InventarioExportActions
              theme={inventarioTheme}
              size="md"
              csvLabel="EXPORTAR EXCEL"
              onExportCsv={() => void handleExport()}
              onExportPdf={() => toast.info('Exportación PDF — próximamente')}
            />
          </div>

          <InventarioPrimaryButton
            label="FILTRAR"
            variant="primary"
            showIcon={false}
            theme={inventarioTheme}
            size="md"
            className={styles.filterButton}
            onClick={applyEstadoFilter}
          />
        </div>
      </CargoPageSection>

      <CargoPageSection theme={cargoTheme}>
        {turnosQuery.isLoading ? (
          <div className={styles.state}>
            <div className={styles.skeletonRows}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={styles.skeletonRow} aria-hidden />
              ))}
            </div>
            <span className={styles.loadingLabel}>Cargando turnos...</span>
          </div>
        ) : null}

        {turnosQuery.isError ? (
          <div className={styles.feedbackState}>
            <EmptyState
              variant="error"
              theme={cargoTheme}
              title="No se pudieron cargar los turnos"
              description="Verifica tu conexión e intenta de nuevo."
              action={
                <CargoActionButton
                  label="Reintentar"
                  icon={<RefreshCw aria-hidden />}
                  theme={cargoTheme}
                  onClick={() => void turnosQuery.refetch()}
                />
              }
            />
          </div>
        ) : null}

        {!turnosQuery.isLoading && !turnosQuery.isError && turnos.length === 0 ? (
          <div className={styles.state}>{emptyMessage}</div>
        ) : null}

        {!turnosQuery.isLoading && !turnosQuery.isError && turnos.length > 0 ? (
          <CargoTable
            theme={cargoTheme}
            showActions={canWrite}
            columns={getTurnosTableColumns(canWrite)}
            ariaLabel="Listado de turnos"
            enableSorting={false}
            pagination={{
              page,
              totalPages,
              summary: `${pageStart}-${pageEnd} de ${total}`,
              onPrevious: () => setPage(Math.max(1, page - 1)),
              onNext: () => setPage(Math.min(totalPages, page + 1)),
            }}
          >
            {turnos.map((turno) => (
              <CargoTableItem
                key={turno.id}
                id={turno.id}
                title={turno.nombre}
                area={turno.sigla}
                baseSalaryRange={formatTurnoSchedule(turno)}
                isActive={turno.estado}
                theme={cargoTheme}
                showActions={canWrite}
                toggleLoading={togglingId === turno.id}
                onEdit={canWrite ? () => setEditingTurno(turno) : undefined}
                onToggleStatus={canWrite ? () => handleToggleRequest(turno) : undefined}
              />
            ))}
          </CargoTable>
        ) : null}
      </CargoPageSection>

      {canWrite ? (
        <>
          <TurnosCreateModal
            open={createOpen}
            submitting={createTurno.isPending}
            theme={cargoTheme}
            onClose={() => setCreateOpen(false)}
            onSubmit={(values) => void handleCreate(values)}
          />

          <TurnosEditModal
            turno={editingTurno}
            open={Boolean(editingTurno)}
            submitting={updateTurno.isPending}
            theme={cargoTheme}
            onClose={() => setEditingTurno(undefined)}
            onSubmit={(values) => void handleEdit(values)}
          />

          <TurnosDeactivateDialog
            turno={statusChangeTurno}
            open={Boolean(statusChangeTurno)}
            submitting={updateEstado.isPending}
            theme={cargoTheme}
            onCancel={() => setStatusChangeTurno(undefined)}
            onConfirm={() => void handleStatusChange()}
          />
        </>
      ) : null}
    </CargoPage>
  );
}
