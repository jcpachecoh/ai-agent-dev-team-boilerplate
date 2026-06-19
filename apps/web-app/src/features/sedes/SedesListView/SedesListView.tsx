import {
  ConfirmModal,
  SedeActionButton,
  SedeKpiCard,
  SedeKpiGrid,
  SedeListToolbar,
  SedePage,
  SedePageHeader,
  SedePageSection,
  SedeTable,
  SedeTableItem,
  type SedeStatusFilter,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUiTheme } from '@/hooks/useUiTheme';
import { getErrorMessage, isGraphqlConfigured } from '@/lib/graphql-client';

import { useLocationMetrics } from '../hooks/useLocations';
import { useDeleteLocation, useToggleLocationStatus } from '../hooks/useLocationMutations';
import styles from '../sedes.module.scss';

export default function SedesListView(): JSX.Element {
  const navigate = useNavigate();
  const theme = useUiTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SedeStatusFilter>('all');

  const { data: rows = [], metrics, isPending, isError, error } = useLocationMetrics();
  const toggleStatus = useToggleLocationStatus();
  const deleteLocation = useDeleteLocation();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && row.isActive) ||
        (statusFilter === 'inactive' && !row.isActive);
      if (!matchesStatus) return false;
      if (!query) return true;
      return [row.name, row.city, row.address]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [rows, search, statusFilter]);

  const handleToggleStatus = (id: string) => {
    setPendingToggleId(id);
    toggleStatus.mutate(id, {
      onSuccess: () => toast.success('Estado de sede actualizado.'),
      onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
      onSettled: () => setPendingToggleId(null),
    });
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    const { id } = deleteTarget;
    setPendingDeleteId(id);
    deleteLocation.mutate(id, {
      onSuccess: () => toast.success('Sede eliminada.'),
      onError: (mutationError) => toast.error(getErrorMessage(mutationError)),
      onSettled: () => {
        setPendingDeleteId(null);
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <SedePage theme={theme} layout="sections">
        {!isGraphqlConfigured() && (
          <p className={styles.banner}>
            Inicia sesión para cargar sedes. En dev:{' '}
            <code>pnpm --filter @restopsiq/api start:dev</code> y{' '}
            <code>VITE_GRAPHQL_URL=/graphql</code>.
          </p>
        )}

        <SedePageSection theme={theme} divider variant="header">
          <SedePageHeader
            title="Sedes"
            subtitle="Gestión de sedes del tenant"
            theme={theme}
            primaryAction={
              <SedeActionButton theme={theme} onClick={() => navigate('/empresa/sedes/nueva')} />
            }
          />
        </SedePageSection>

        <SedePageSection theme={theme} divider>
          <SedeKpiGrid theme={theme}>
            <SedeKpiCard
              label="Total sedes"
              value={metrics.total}
              valueColor="primary"
              theme={theme}
            />
            <SedeKpiCard
              label="Activas"
              value={metrics.activeCount}
              valueColor="success"
              theme={theme}
            />
            <SedeKpiCard
              label="Inactivas"
              value={metrics.inactiveCount}
              valueColor="muted"
              theme={theme}
            />
          </SedeKpiGrid>
        </SedePageSection>

        <SedePageSection theme={theme} divider variant="toolbar">
          <SedeListToolbar
            searchValue={search}
            statusFilter={statusFilter}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            theme={theme}
          />
        </SedePageSection>

        <SedePageSection theme={theme}>
          {isGraphqlConfigured() && isError ? (
            <p className={`${styles.stateMessage} ${styles.stateMessageError}`} role="alert">
              {getErrorMessage(error)}
            </p>
          ) : (
            <SedeTable
              theme={theme}
              pagination={{
                page: 1,
                totalPages: 1,
                summary: isPending
                  ? 'Cargando sedes…'
                  : `Mostrando 1-${filteredRows.length} de ${rows.length}`,
              }}
            >
              {filteredRows.map((row) => (
                <SedeTableItem
                  key={row.id}
                  {...row}
                  theme={theme}
                  onEdit={() => navigate(`/empresa/sedes/${row.id}/editar`)}
                  onToggleStatus={() => handleToggleStatus(row.id)}
                  onDelete={() => handleDeleteRequest(row.id, row.name)}
                  toggleLoading={pendingToggleId === row.id && toggleStatus.isPending}
                  deleteLoading={pendingDeleteId === row.id && deleteLocation.isPending}
                />
              ))}
            </SedeTable>
          )}
        </SedePageSection>
      </SedePage>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteLocation.isPending) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        confirmVariant="danger"
        theme={theme}
        title={deleteTarget ? `¿Eliminar sede "${deleteTarget.name}"?` : '¿Eliminar sede?'}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </>
  );
}
