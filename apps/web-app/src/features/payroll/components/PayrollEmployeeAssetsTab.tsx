import { EmptyState, toast } from '@restopsiq/ui';
import { Download, Package } from 'lucide-react';
import { useState } from 'react';

import { canWritePayrollEmployee } from '@/config/rbac.config';
import { useMe } from '@/features/auth/hooks/useMe';
import { getErrorMessage } from '@/lib/graphql-client';
import { getRoleCodeFromToken } from '@/lib/auth-token';

import { fetchEmployeeAssetDownloadUrl } from '../api/employee-assets.upload';
import { useEmployeeAssetsMutations } from '../hooks/useEmployeeAssetsMutations';
import { useEmployeeAssetsQuery } from '../hooks/useEmployeeAssetsQuery';
import { usePayrollEmployeeQuery } from '../hooks/usePayrollEmployeeQuery';
import type { AssetStatus, EmployeeAsset } from '../types/employee-asset.types';
import {
  ASSET_STATUS_LABELS,
  ASSET_STATUS_OPTIONS,
  ASSET_TYPE_LABELS,
} from '../types/employee-asset.types';
import { EmployeeAssetFormModal } from './EmployeeAssetFormModal';
import { PayrollEmployeeProfileTabLoading } from './PayrollEmployeeProfileTabLoading';
import styles from './PayrollEmployeeAssetsTab.module.scss';

interface PayrollEmployeeAssetsTabProps {
  userId: string;
  theme: 'light' | 'dark';
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PayrollEmployeeAssetsTab({
  userId,
  theme,
}: PayrollEmployeeAssetsTabProps): React.JSX.Element {
  const { data: me } = useMe();
  const roleCode = me?.roleCode ?? getRoleCodeFromToken();
  const canWrite = canWritePayrollEmployee(roleCode);

  const employeeQuery = usePayrollEmployeeQuery(userId);
  const employeeId = employeeQuery.data?.id;
  const assetsQuery = useEmployeeAssetsQuery(employeeId);
  const mutations = useEmployeeAssetsMutations(employeeId ?? '');

  const [formOpen, setFormOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleStatusChange = async (asset: EmployeeAsset, newStatus: AssetStatus) => {
    if (newStatus === asset.status) return;
    setUpdatingId(asset.id);
    try {
      await mutations.updateMutation.mutateAsync({ id: asset.id, input: { status: newStatus } });
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownload = async (asset: EmployeeAsset) => {
    setDownloadingId(asset.id);
    try {
      const url = await fetchEmployeeAssetDownloadUrl(asset.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('No se pudo obtener el enlace de descarga');
    } finally {
      setDownloadingId(null);
    }
  };

  const isLoading = employeeQuery.isLoading || assetsQuery.isLoading;
  const assets = assetsQuery.data ?? [];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Package size={16} aria-hidden />
          <span className={styles.headerTitle}>Activos del colaborador</span>
          {assets.length > 0 ? <span className={styles.count}>{assets.length}</span> : null}
        </div>
        {canWrite ? (
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setFormOpen(true)}
            disabled={!employeeId}
          >
            + Agregar activo
          </button>
        ) : null}
      </div>

      {isLoading ? <PayrollEmployeeProfileTabLoading /> : null}

      {!isLoading && assetsQuery.isError ? (
        <div className={styles.errorState}>
          <p>No se pudieron cargar los activos.</p>
          <button type="button" onClick={() => void assetsQuery.refetch()}>
            Reintentar
          </button>
        </div>
      ) : null}

      {!isLoading && !assetsQuery.isError && assets.length === 0 ? (
        <EmptyState
          title="Sin activos asignados"
          description="No hay activos registrados para este colaborador."
        />
      ) : null}

      {!isLoading && !assetsQuery.isError && assets.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Categoría</th>
                <th className={styles.th}>Valor</th>
                <th className={styles.th}>Fecha asignación</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th} />
                {canWrite ? <th className={styles.th} /> : null}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.assetName}>{asset.assetName}</span>
                    {asset.notes ? <span className={styles.assetNotes}>{asset.notes}</span> : null}
                  </td>
                  <td className={styles.td}>
                    <span className={styles.typeBadge}>
                      {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.value}>{formatCOP(asset.value)}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.date}>{formatDate(asset.assignmentDate)}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.statusBadge} ${styles[`status${asset.status}`]}`}>
                      {ASSET_STATUS_LABELS[asset.status]}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {asset.storageObjectId ? (
                      <button
                        type="button"
                        className={styles.downloadButton}
                        disabled={downloadingId === asset.id}
                        onClick={() => void handleDownload(asset)}
                        aria-label={`Descargar archivo de ${asset.assetName}`}
                        title="Descargar documento adjunto"
                      >
                        <Download size={13} aria-hidden />
                      </button>
                    ) : null}
                  </td>
                  {canWrite ? (
                    <td className={styles.td}>
                      <select
                        className={styles.statusSelect}
                        value={asset.status}
                        disabled={updatingId === asset.id}
                        onChange={(e) =>
                          void handleStatusChange(asset, e.target.value as AssetStatus)
                        }
                        aria-label={`Cambiar estado de ${asset.assetName}`}
                      >
                        {ASSET_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {employeeId ? (
        <EmployeeAssetFormModal
          open={formOpen}
          theme={theme}
          employeeId={employeeId}
          onClose={() => setFormOpen(false)}
          onSuccess={() => setFormOpen(false)}
        />
      ) : null}
    </div>
  );
}
