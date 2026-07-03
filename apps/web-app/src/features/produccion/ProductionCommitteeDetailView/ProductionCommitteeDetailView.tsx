import {
  InventarioPageToolbar,
  RecetaActionButton,
  RecetaTableHeader,
  RecetaUtilityButton,
  StatusBadge,
  toast,
  type RecetaTableColumn,
} from '@restopsiq/ui';
import { ArrowLeft, Plus } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { CreateProductionOrderModal } from '../components/CreateProductionOrderModal';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useUiTheme } from '@/hooks/useUiTheme';

import { PlantApiError } from '@/api/plant/client';
import { COMMITTEE_ORDER_TABLE_COLUMNS, RECETA_TABLE_SIZE } from '../constants';
import {
  useCloseProductionCommittee,
  useProductionCommittee,
  useUpdateProductionCommittee,
} from '../hooks/useProductionCommittees';
import { useDownloadProductionOrderPdf } from '../hooks/useDownloadProductionOrderPdf';
import { useProductionOrders } from '../hooks/useProductionOrders';
import {
  committeeStatusToBadge,
  formatCommitteeStatus,
  formatPlannedDate,
  formatPriority,
  formatShift,
  orderStatusToBadge,
} from '../mappers/display';
import type { ProductionOrderListItem } from '../types';
import styles from '../produccion.module.scss';

const ORDER_TABLE_COLUMNS: RecetaTableColumn[] = [
  { key: 'number', label: 'Número OP', width: 'minmax(7rem, 0.9fr)' },
  { key: 'status', label: 'Estado', width: 'minmax(6rem, 0.8fr)' },
  { key: 'priority', label: 'Prioridad', width: 'minmax(5rem, 0.7fr)' },
  { key: 'shift', label: 'Turno', width: 'minmax(5rem, 0.7fr)' },
  { key: 'planned', label: 'Inicio planificado', width: 'minmax(8rem, 1fr)' },
  { key: 'actions', label: 'Acciones', width: 'minmax(6rem, 0.8fr)', align: 'right' },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof PlantApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

export default function ProductionCommitteeDetailView(): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const { committeeId } = useParams();
  const committeeQuery = useProductionCommittee(committeeId);
  const ordersQuery = useProductionOrders(committeeId ? { committeeId } : {});
  const updateMutation = useUpdateProductionCommittee();
  const closeMutation = useCloseProductionCommittee();
  const downloadPdfMutation = useDownloadProductionOrderPdf();

  const [createOpOpen, setCreateOpOpen] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const committee = committeeQuery.data;
  const orders = ordersQuery.data ?? [];

  const canCreateOrder = committee?.status === 'ACTIVE';
  const canActivate = committee?.status === 'DRAFT';
  const canClose = committee?.status === 'ACTIVE';

  const gridStyle = useMemo(
    () => ({ '--receta-columns': COMMITTEE_ORDER_TABLE_COLUMNS }) as CSSProperties,
    [],
  );

  const handleDownloadPdf = async (order: ProductionOrderListItem, event: React.MouseEvent) => {
    event.stopPropagation();
    setDownloadingPdfId(order.id);
    try {
      await downloadPdfMutation.mutateAsync(order.id);
      toast.success(`PDF de OP ${order.number} descargado.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleActivate = async () => {
    if (!committee) return;
    try {
      await updateMutation.mutateAsync({
        id: committee.id,
        input: { status: 'ACTIVE' },
      });
      toast.success(`Comité ${committee.number} activado. Ya puede crear OPs.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleClose = async () => {
    if (!committee) return;
    try {
      await closeMutation.mutateAsync(committee.id);
      toast.success(`Comité ${committee.number} cerrado.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (committeeQuery.isPending) {
    return <InventoryScreenState variant="loading" message="Cargando comité…" />;
  }

  if (committeeQuery.isError || !committee) {
    return (
      <div className={styles.content}>
        <div className={styles.errorBox} role="alert">
          {getErrorMessage(committeeQuery.error)}
        </div>
        <Link to="/produccion/comites" className={styles.backLink}>
          Volver al listado de comités
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <Link to="/produccion/comites" className={styles.backLink}>
        <ArrowLeft aria-hidden size={16} />
        Comités de producción
      </Link>

      <InventarioPageToolbar
        theme={theme}
        size="md"
        title={committee.number}
        subtitle={`${formatCommitteeStatus(committee.status)} · ${committee.ordersCount} OPs creadas · ${committee.members.length} miembros`}
        action={
          <div className={styles.toolbarActions}>
            {canActivate && (
              <RecetaActionButton
                theme={theme}
                size="sm"
                accent="orange"
                variant="soft"
                label="Activar"
                loading={updateMutation.isPending}
                onClick={() => void handleActivate()}
              />
            )}
            {canClose && (
              <RecetaActionButton
                theme={theme}
                size="md"
                accent="orange"
                variant="soft"
                label="Cerrar comité"
                loading={closeMutation.isPending}
                onClick={() => void handleClose()}
              />
            )}
            {canCreateOrder && (
              <RecetaActionButton
                theme={theme}
                size="md"
                accent="orange"
                variant="solid"
                label="Nueva OP"
                icon={<Plus aria-hidden size={14} />}
                onClick={() => setCreateOpOpen(true)}
              />
            )}
          </div>
        }
      />

      <section className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div>
            <StatusBadge
              status={committeeStatusToBadge(committee.status)}
              variant="pill"
              size="sm"
              theme={theme}
            />
          </div>
          <p className={styles.hint}>
            Creado {formatPlannedDate(committee.createdAt)} · Actualizado{' '}
            {formatPlannedDate(committee.updatedAt)}
          </p>
        </div>

        <div>
          <h3 className={styles.sectionTitle}>Miembros del comité</h3>
          <ul className={styles.memberList}>
            {committee.members.map((member) => (
              <li key={member.userId}>{member.email}</li>
            ))}
          </ul>
        </div>
      </section>

      <h3 className={styles.sectionTitle}>Órdenes del comité</h3>

      {committee.status !== 'ACTIVE' && (
        <p className={styles.hint}>
          Solo los comités activos permiten crear nuevas órdenes de producción.
        </p>
      )}

      {ordersQuery.isPending && (
        <InventoryScreenState variant="loading" message="Cargando órdenes del comité…" />
      )}

      {ordersQuery.isError && (
        <div className={styles.errorBox} role="alert">
          {getErrorMessage(ordersQuery.error)}
        </div>
      )}

      {!ordersQuery.isPending && !ordersQuery.isError && orders.length === 0 && (
        <InventoryScreenState
          variant="empty"
          message={
            canCreateOrder
              ? 'Este comité aún no tiene órdenes. Cree la primera OP.'
              : 'Este comité no tiene órdenes de producción.'
          }
        />
      )}

      {orders.length > 0 && (
        <div className={styles.tableWrap}>
          <RecetaTableHeader theme={theme} size={RECETA_TABLE_SIZE} columns={ORDER_TABLE_COLUMNS} />
          <div className={styles.tableBody} role="rowgroup">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                theme={theme}
                order={order}
                gridStyle={gridStyle}
                onSelect={() =>
                  navigate(`/produccion/ordenes/${order.id}`, {
                    state: {
                      fromCommitteeId: committee.id,
                      fromCommitteeNumber: committee.number,
                    },
                  })
                }
                onDownloadPdf={(e) => void handleDownloadPdf(order, e)}
                isDownloadingPdf={downloadingPdfId === order.id}
              />
            ))}
          </div>
        </div>
      )}

      <CreateProductionOrderModal
        open={createOpOpen}
        onClose={() => setCreateOpOpen(false)}
        defaultCommitteeId={committee.id}
        lockCommittee
        onCreated={() => {
          void committeeQuery.refetch();
          void ordersQuery.refetch();
        }}
      />
    </div>
  );
}

function OrderRow({
  theme,
  order,
  gridStyle,
  onSelect,
  onDownloadPdf,
  isDownloadingPdf,
}: {
  theme: 'light' | 'dark';
  order: ProductionOrderListItem;
  gridStyle: CSSProperties;
  onSelect: () => void;
  onDownloadPdf: (event: React.MouseEvent) => void;
  isDownloadingPdf: boolean;
}): React.JSX.Element {
  return (
    <div
      role="row"
      className={[styles.tableRow, styles.opTableRow].filter(Boolean).join(' ')}
      style={gridStyle}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
    >
      <span>{order.number}</span>
      <span>
        <StatusBadge
          status={orderStatusToBadge(order.status)}
          variant="pill"
          size="sm"
          theme={theme}
        />
      </span>
      <span>{formatPriority(order.priority)}</span>
      <span>{formatShift(order.shift)}</span>
      <span>{formatPlannedDate(order.plannedStartAt)}</span>
      <span className={styles.tableCellActions}>
        <RecetaUtilityButton
          theme={theme}
          size="sm"
          variant="pdf"
          label="PDF"
          disabled={isDownloadingPdf}
          aria-label={`Descargar PDF de OP ${order.number}`}
          onClick={onDownloadPdf}
        />
      </span>
    </div>
  );
}
