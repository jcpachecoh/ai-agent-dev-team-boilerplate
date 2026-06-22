import {
  ProduccionFilterChipGroup,
  ProduccionModuleTabs,
  ProduccionPrimaryAction,
  ProduccionStationTableHeader,
  ProduccionStationTableRow,
  ProduccionSubTabs,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useUiTheme } from '@/hooks/useUiTheme';
import { getErrorMessage } from '@/lib/graphql-client';

import { WorkstationDetailModal } from '../components/WorkstationDetailModal';
import {
  WorkstationFormModal,
  type WorkstationFormMode,
} from '../components/WorkstationFormModal/WorkstationFormModal';
import { useCreateWorkstation } from '../hooks/useCreateWorkstation';
import { useUpdateWorkstation } from '../hooks/useUpdateWorkstation';
import { useSupervisorStations } from '../hooks/useSupervisorOverview';
import {
  filterSupervisorStations,
  toStationDetail,
  toWorkstationFormValues,
} from '../mappers/display';
import type { SupervisorStationFilter, SupervisorStationMaster } from '../types';
import styles from '../supervisor.module.scss';

export default function SupervisorStationsListView(): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<SupervisorStationFilter>('all');
  const [viewStation, setViewStation] = useState<SupervisorStationMaster | undefined>();
  const [formMode, setFormMode] = useState<WorkstationFormMode>('create');
  const [editingStation, setEditingStation] = useState<SupervisorStationMaster | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useSupervisorStations();
  const createMutation = useCreateWorkstation();
  const updateMutation = useUpdateWorkstation();

  const filteredRows = useMemo(
    () => filterSupervisorStations(data?.stations ?? [], filter),
    [data?.stations, filter],
  );

  const openCreateModal = (): void => {
    setFormMode('create');
    setEditingStation(undefined);
    setFormOpen(true);
  };

  const openEditModal = (station: SupervisorStationMaster): void => {
    setFormMode('edit');
    setEditingStation(station);
    setFormOpen(true);
  };

  const handleCreate = async (values: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      const created = await createMutation.mutateAsync(values);
      toast.success(`Estación ${created.code} creada correctamente`);
      setFormOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdate = async (
    values: Parameters<typeof updateMutation.mutateAsync>[0]['values'],
  ) => {
    if (!editingStation) return;

    try {
      const updated = await updateMutation.mutateAsync({ id: editingStation.id, values });
      toast.success(`Estación ${updated.code} actualizada correctamente`);
      setFormOpen(false);
      setEditingStation(undefined);
      if (viewStation?.id === editingStation.id) {
        setViewStation((current) =>
          current
            ? {
                ...current,
                code: updated.code,
                name: updated.name,
                location: updated.location ?? '',
                description: updated.description,
                status: updated.isActive ? 'active' : 'inactive',
              }
            : undefined,
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleFormSave = (values: Parameters<typeof createMutation.mutateAsync>[0]): void => {
    if (formMode === 'edit') {
      void handleUpdate(values);
      return;
    }
    void handleCreate(values);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.stickyTop}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            <h1>Estaciones de producción</h1>
            <p>Configuración y consulta de estaciones de trabajo en planta</p>
          </div>
          <ProduccionPrimaryAction
            label="NUEVA ESTACIÓN"
            theme={theme}
            size="md"
            className={styles.pageHeaderAction}
            onClick={openCreateModal}
          />
        </header>

        <section className={styles.toolbarSection}>
          <h2 className={styles.toolbarTitle}>
            Estaciones de producción — {filteredRows.length} registros
          </h2>
          <ProduccionFilterChipGroup
            theme={theme}
            size="sm"
            activeId={filter}
            onChange={(chipId) => setFilter(chipId as SupervisorStationFilter)}
          />
        </section>
      </div>

      <div className={styles.scrollBody}>
        {isLoading ? (
          <InventoryScreenState variant="loading" />
        ) : isError ? (
          <InventoryScreenState variant="error" onRetry={() => void refetch()} />
        ) : (
          <main className={[styles.content, styles.contentStations].join(' ')}>
            <div className={styles.tableWrap} role="table">
              <div className={styles.tableScroll}>
                <ProduccionStationTableHeader theme={theme} size="xl" />
                <div className={styles.rows} role="rowgroup">
                  {filteredRows.map((row) => (
                    <ProduccionStationTableRow
                      key={row.code}
                      {...row}
                      theme={theme}
                      size="xl"
                      onView={() => setViewStation(row)}
                      onEdit={() => openEditModal(row)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      <WorkstationDetailModal
        open={Boolean(viewStation)}
        station={viewStation ? toStationDetail(viewStation) : undefined}
        theme={theme}
        onClose={() => setViewStation(undefined)}
      />

      <WorkstationFormModal
        open={formOpen}
        mode={formMode}
        initialValues={editingStation ? toWorkstationFormValues(editingStation) : undefined}
        theme={theme}
        saving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditingStation(undefined);
        }}
        onSave={handleFormSave}
      />
    </div>
  );
}
