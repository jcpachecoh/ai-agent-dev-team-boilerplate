import { EmptyState, LoadingState, toast } from '@restopsiq/ui';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type JSX } from 'react';

import { SYSTEM_ADMIN_ROLES } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getErrorMessage } from '@/lib/graphql-client';
import { useTheme } from '@/providers/ThemeProvider';

import { LaborLegalParameterFormModal } from '@/features/labor-legal-parameters/components/LaborLegalParameterFormModal';
import {
  useCreateLaborLegalParameter,
  useDeleteLaborLegalParameter,
  useUpdateLaborLegalParameter,
} from '@/features/labor-legal-parameters/hooks/useLaborLegalParameterMutations';
import {
  useLaborLegalParameterHistory,
  useLaborLegalParameters,
} from '@/features/labor-legal-parameters/hooks/useLaborLegalParameters';
import {
  LABOR_LEGAL_PARAMETER_KEY_LABELS,
  LABOR_LEGAL_PARAMETER_KEYS,
  type LaborLegalParameter,
} from '@/features/labor-legal-parameters/types';

import styles from './PayrollLegalParametersScreen.module.scss';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return value.slice(0, 10);
}

function isCurrentlyActive(row: LaborLegalParameter): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const from = row.validFrom.slice(0, 10);
  const to = row.validTo ? row.validTo.slice(0, 10) : null;
  return from <= today && (!to || to >= today);
}

export function PayrollLegalParametersScreen(): JSX.Element {
  const { theme } = useTheme();
  const { data: me } = useMe();
  const isSystemAdmin = (SYSTEM_ADMIN_ROLES as readonly string[]).includes(me?.roleCode ?? '');
  const isSuperAdmin = me?.roleCode === 'SUPER_ADMIN';

  const currentQuery = useLaborLegalParameters();
  const [historyKey, setHistoryKey] = useState<string | undefined>(undefined);
  const historyQuery = useLaborLegalParameterHistory(historyKey);

  const createMutation = useCreateLaborLegalParameter();
  const updateMutation = useUpdateLaborLegalParameter();
  const deleteMutation = useDeleteLaborLegalParameter();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<LaborLegalParameter | undefined>();
  const [deleting, setDeleting] = useState<LaborLegalParameter | undefined>();
  const [filterKey, setFilterKey] = useState<string>('ALL');

  const currentRows = currentQuery.data ?? [];
  const filteredRows = useMemo(
    () => (filterKey === 'ALL' ? currentRows : currentRows.filter((r) => r.key === filterKey)),
    [currentRows, filterKey],
  );

  if (!isSystemAdmin) {
    return (
      <div className={styles.screen}>
        <EmptyState
          variant="error"
          theme={theme}
          title="Acceso denegado"
          description="Solo Owner/SuperAdmin pueden administrar los parámetros legales."
        />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleCreate = async (values: Parameters<typeof createMutation.mutateAsync>[0]) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success(`Vigencia de "${values.key}" creada correctamente.`);
      setCreating(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdate = async (
    values: Parameters<typeof updateMutation.mutateAsync>[0]['input'],
  ) => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, input: values });
      toast.success(`Vigencia de "${editing.key}" actualizada.`);
      setEditing(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success(`Vigencia de "${deleting.key}" eliminada.`);
      setDeleting(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <div className={styles.screen}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Parámetros legales</h1>
            <p>Valores legales versionados por vigencia (SMLV, recargos, jornada, etc.)</p>
          </div>
          <button type="button" className={styles.newBtn} onClick={() => setCreating(true)}>
            <Plus size={14} aria-hidden />
            Nueva vigencia
          </button>
        </header>

        <div className={styles.filterRow}>
          <label htmlFor="labor-legal-parameter-filter">Filtrar por parámetro:</label>
          <select
            id="labor-legal-parameter-filter"
            value={filterKey}
            onChange={(e) => {
              setFilterKey(e.target.value);
              setHistoryKey(undefined);
            }}
          >
            <option value="ALL">Todos</option>
            {LABOR_LEGAL_PARAMETER_KEYS.map((k) => (
              <option key={k} value={k}>
                {LABOR_LEGAL_PARAMETER_KEY_LABELS[k]} ({k})
              </option>
            ))}
          </select>
        </div>

        {currentQuery.isLoading ? (
          <LoadingState message="Cargando parámetros legales…" layout="compact" />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            theme={theme}
            title="Sin vigencias registradas"
            description="No hay parámetros legales vigentes para este filtro."
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Parámetro</th>
                  <th>Alcance</th>
                  <th>Valor</th>
                  <th>Vigente desde</th>
                  <th>Vigente hasta</th>
                  <th>Fuente</th>
                  <th>Estado</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <button
                        type="button"
                        className={styles.keyLink}
                        onClick={() => setHistoryKey(row.key)}
                        title="Ver histórico de vigencias"
                      >
                        {LABOR_LEGAL_PARAMETER_KEY_LABELS[
                          row.key as keyof typeof LABOR_LEGAL_PARAMETER_KEY_LABELS
                        ] ?? row.key}
                      </button>
                    </td>
                    <td>
                      <span className={row.isGlobal ? styles.badgeGlobal : styles.badgeTenant}>
                        {row.isGlobal ? 'Global' : 'Tenant'}
                      </span>
                    </td>
                    <td>{row.value}</td>
                    <td>{formatDate(row.validFrom)}</td>
                    <td>{formatDate(row.validTo)}</td>
                    <td>{row.source ?? '—'}</td>
                    <td>
                      <span
                        className={
                          isCurrentlyActive(row) ? styles.badgeActive : styles.badgeInactive
                        }
                      >
                        {isCurrentlyActive(row) ? 'Vigente' : 'Fuera de vigencia'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setEditing(row)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={[styles.actionBtn, styles.actionBtnDanger].join(' ')}
                          onClick={() => setDeleting(row)}
                          aria-label={`Eliminar vigencia de ${row.key}`}
                        >
                          <Trash2 size={13} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {historyKey ? (
          <section className={styles.historySection}>
            <div className={styles.historyHeader}>
              <h2>
                Histórico —{' '}
                {LABOR_LEGAL_PARAMETER_KEY_LABELS[
                  historyKey as keyof typeof LABOR_LEGAL_PARAMETER_KEY_LABELS
                ] ?? historyKey}
              </h2>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setHistoryKey(undefined)}
              >
                Cerrar histórico
              </button>
            </div>
            {historyQuery.isLoading ? (
              <LoadingState message="Cargando histórico…" layout="compact" />
            ) : (
              <ul className={styles.historyList}>
                {(historyQuery.data ?? []).map((row) => (
                  <li key={row.id}>
                    <span className={row.isGlobal ? styles.badgeGlobal : styles.badgeTenant}>
                      {row.isGlobal ? 'Global' : 'Tenant'}
                    </span>{' '}
                    {row.value} — {formatDate(row.validFrom)} a {formatDate(row.validTo)}
                    {row.source ? ` (${row.source})` : ''}
                    {row.deletedAt ? ' — eliminada' : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      {creating ? (
        <LaborLegalParameterFormModal
          open={creating}
          mode="create"
          canCreateGlobal={isSuperAdmin}
          actorTenantId={me?.tenantId ?? ''}
          saving={isSaving}
          onClose={() => setCreating(false)}
          onSave={(values) => void handleCreate(values)}
        />
      ) : null}

      {editing ? (
        <LaborLegalParameterFormModal
          open={Boolean(editing)}
          mode="edit"
          keyLabel={
            LABOR_LEGAL_PARAMETER_KEY_LABELS[
              editing.key as keyof typeof LABOR_LEGAL_PARAMETER_KEY_LABELS
            ] ?? editing.key
          }
          initialValue={{
            value: editing.value,
            validFrom: editing.validFrom,
            validTo: editing.validTo,
            source: editing.source,
          }}
          saving={isSaving}
          onClose={() => setEditing(undefined)}
          onSave={(values) => void handleUpdate(values)}
        />
      ) : null}

      {deleting ? (
        <div
          className={styles.confirmBackdrop}
          onClick={() => setDeleting(undefined)}
          role="presentation"
        >
          <div
            className={styles.confirmDialog}
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.confirmMsg}>
              ¿Eliminar la vigencia de <code>{deleting.key}</code> ({formatDate(deleting.validFrom)}{' '}
              — {formatDate(deleting.validTo)})?
              <br />
              <span className={styles.confirmSub}>
                Esta acción es un soft delete — queda registrada en el histórico y en AuditLog.
              </span>
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeleting(undefined)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.deactivateBtn}
                onClick={() => void handleDelete()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
