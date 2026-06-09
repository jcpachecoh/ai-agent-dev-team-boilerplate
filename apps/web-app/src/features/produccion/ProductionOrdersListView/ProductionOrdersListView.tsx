import {
  InventarioPageToolbar,
  InventarioPrimaryButton,
  RecetaActionButton,
  RecetaFilterSelect,
  RecetaMetricCard,
  RecetaSearch,
  RecetaTableHeader,
  RecetaUtilityButton,
  StatusBadge,
  toast,
  type RecetaTableColumn,
} from '@restopsiq/ui';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { CreateProductionOrderModal } from '../components/CreateProductionOrderModal';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useUiTheme } from '@/hooks/useUiTheme';

import { PlantApiError } from '@/api/plant/client';
import {
  OP_TABLE_COLUMNS,
  ORDER_STATUS_FILTER_OPTIONS,
  PRIORITY_FILTER_OPTIONS,
  RECETA_TABLE_SIZE,
  SHIFT_FILTER_OPTIONS,
} from '../constants';
import {
  usePlanProductionOrder,
  useProductionOrders,
  useProductionRecipes,
} from '../hooks/useProductionOrders';
import { useProductionCommittees } from '../hooks/useProductionCommittees';
import { useDownloadProductionOrderPdf } from '../hooks/useDownloadProductionOrderPdf';
import {
  formatPlannedDate,
  formatPriority,
  formatShift,
  orderStatusToBadge,
} from '../mappers/display';
import type {
  ListProductionOrdersFilters,
  ProductionOrderListItem,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
} from '../types';
import styles from '../produccion.module.scss';

const TABLE_COLUMNS: RecetaTableColumn[] = [
  { key: 'number', label: 'Número OP', width: 'minmax(7rem, 0.9fr)' },
  { key: 'recipe', label: 'Receta', width: 'minmax(10rem, 1.4fr)' },
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

export default function ProductionOrdersListView(): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [committeeFilter, setCommitteeFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const filters = useMemo((): ListProductionOrdersFilters => {
    const result: ListProductionOrdersFilters = {};
    if (statusFilter !== 'all') result.status = statusFilter as ProductionOrderStatus;
    if (shiftFilter !== 'all') result.shift = shiftFilter as ProductionShift;
    if (priorityFilter !== 'all') result.priority = priorityFilter as ProductionPriority;
    if (committeeFilter !== 'all') result.committeeId = committeeFilter;
    return result;
  }, [committeeFilter, priorityFilter, shiftFilter, statusFilter]);

  const ordersQuery = useProductionOrders(filters);
  const committeesQuery = useProductionCommittees({});
  const recipesQuery = useProductionRecipes();
  const planMutation = usePlanProductionOrder();
  const downloadPdfMutation = useDownloadProductionOrderPdf();

  const recipeNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const recipe of recipesQuery.data ?? []) {
      map.set(recipe.id, recipe.name);
    }
    return map;
  }, [recipesQuery.data]);

  const orders = ordersQuery.data ?? [];

  const committeeFilterOptions = useMemo(() => {
    const committees = committeesQuery.data ?? [];
    return [
      { value: 'all', label: 'Todos los comités' },
      ...committees.map((committee) => ({
        value: committee.id,
        label: committee.number,
      })),
    ];
  }, [committeesQuery.data]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return orders;

    return orders.filter((order) => {
      const recipeName = recipeNameById.get(order.recipeId) ?? '';
      const haystack = [
        order.number,
        recipeName,
        order.committeeNumber ?? '',
        formatPriority(order.priority),
        formatShift(order.shift),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [orders, recipeNameById, search]);

  useEffect(() => {
    const state = location.state as { highlightOrderId?: string; openCreate?: boolean } | null;
    if (state?.highlightOrderId) {
      navigate(`/produccion/ordenes/${state.highlightOrderId}`);
    }
    if (state?.openCreate) {
      setCreateModalOpen(true);
    }
    if (location.pathname.endsWith('/nueva')) {
      setCreateModalOpen(true);
      navigate('/produccion/ordenes', { replace: true, state: state ?? {} });
    }
  }, [location.pathname, location.state, navigate]);

  const metrics = useMemo(() => {
    const active = filteredOrders.filter(
      (o) => o.status === 'IN_PROCESS' || o.status === 'PLANNED' || o.status === 'PAUSED',
    ).length;
    const draft = filteredOrders.filter((o) => o.status === 'DRAFT').length;
    const completed = filteredOrders.filter((o) => o.status === 'COMPLETED').length;
    return { total: filteredOrders.length, active, draft, completed };
  }, [filteredOrders]);

  const handlePlan = async (order: ProductionOrderListItem, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await planMutation.mutateAsync(order.id);
      toast.success(`OP ${order.number} planificada. La fase 1 quedó lista para planta.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

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

  const gridStyle = { '--receta-columns': OP_TABLE_COLUMNS } as CSSProperties;

  return (
    <div className={styles.content}>
      <InventarioPageToolbar
        theme={theme}
        size="md"
        title="Órdenes de producción"
        subtitle={`${metrics.total} órdenes · ${metrics.active} activas en planta`}
        action={
          <InventarioPrimaryButton
            theme={theme}
            size="md"
            variant="orange"
            label="NUEVA OP"
            icon={<Plus aria-hidden />}
            onClick={() => setCreateModalOpen(true)}
          />
        }
      />

      <div className={styles.filtersRow}>
        <RecetaSearch
          theme={theme}
          size={RECETA_TABLE_SIZE}
          value={search}
          onChange={setSearch}
          placeholder="Buscar OP, receta o comité…"
          ariaLabel="Buscar órdenes de producción"
          className={styles.searchGrow}
        />
        <div className={styles.filterField}>
          <RecetaFilterSelect
            theme={theme}
            size={RECETA_TABLE_SIZE}
            aria-label="Filtrar por estado"
            value={statusFilter}
            options={[...ORDER_STATUS_FILTER_OPTIONS]}
            onChange={setStatusFilter}
          />
        </div>
        <div className={styles.filterField}>
          <RecetaFilterSelect
            theme={theme}
            size={RECETA_TABLE_SIZE}
            aria-label="Filtrar por turno"
            value={shiftFilter}
            options={[...SHIFT_FILTER_OPTIONS]}
            onChange={setShiftFilter}
          />
        </div>
        <div className={styles.filterField}>
          <RecetaFilterSelect
            theme={theme}
            size={RECETA_TABLE_SIZE}
            aria-label="Filtrar por prioridad"
            value={priorityFilter}
            options={[...PRIORITY_FILTER_OPTIONS]}
            onChange={setPriorityFilter}
          />
        </div>
        <div className={styles.filterField}>
          <RecetaFilterSelect
            theme={theme}
            size={RECETA_TABLE_SIZE}
            aria-label="Filtrar por comité"
            value={committeeFilter}
            options={committeeFilterOptions}
            onChange={setCommitteeFilter}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
          gap: '0.75rem',
        }}
      >
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="Total OPs"
          value={String(metrics.total)}
        />
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="Activas"
          value={String(metrics.active)}
        />
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="Borradores"
          value={String(metrics.draft)}
        />
        <RecetaMetricCard
          theme={theme}
          size="md"
          variant="type-4"
          title="Completadas"
          value={String(metrics.completed)}
        />
      </div>

      {ordersQuery.isPending && (
        <InventoryScreenState variant="loading" message="Cargando órdenes…" />
      )}

      {ordersQuery.isError && (
        <div className={styles.errorBox} role="alert">
          {getErrorMessage(ordersQuery.error)}
          <p className={styles.hint}>
            Asegúrese de que la API esté en marcha y de haber iniciado sesión con un usuario con
            permisos de producción.
          </p>
        </div>
      )}

      {!ordersQuery.isPending && !ordersQuery.isError && filteredOrders.length === 0 && (
        <InventoryScreenState
          variant="empty"
          message={
            orders.length === 0
              ? 'No hay órdenes de producción. Cree la primera OP para generar las ejecuciones por fase.'
              : 'No hay órdenes que coincidan con los filtros o la búsqueda.'
          }
        />
      )}

      {filteredOrders.length > 0 && (
        <div className={styles.tableWrap}>
          <RecetaTableHeader theme={theme} size={RECETA_TABLE_SIZE} columns={TABLE_COLUMNS} />
          <div className={styles.tableBody} role="rowgroup">
            {filteredOrders.map((order) => {
              const recipeName = recipeNameById.get(order.recipeId) ?? order.recipeId.slice(0, 8);
              return (
                <OrderTableRow
                  key={order.id}
                  theme={theme}
                  order={order}
                  recipeName={recipeName}
                  gridStyle={gridStyle}
                  onSelect={() => navigate(`/produccion/ordenes/${order.id}`)}
                  onPlan={(e) => void handlePlan(order, e)}
                  onDownloadPdf={(e) => void handleDownloadPdf(order, e)}
                  isPlanning={planMutation.isPending && planMutation.variables === order.id}
                  isDownloadingPdf={downloadingPdfId === order.id}
                />
              );
            })}
          </div>
        </div>
      )}

      <CreateProductionOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(orderId) => navigate(`/produccion/ordenes/${orderId}`)}
      />
    </div>
  );
}

interface OrderTableRowProps {
  theme: 'light' | 'dark';
  order: ProductionOrderListItem;
  recipeName: string;
  gridStyle: CSSProperties;
  onSelect: () => void;
  onPlan: (event: React.MouseEvent) => void;
  onDownloadPdf: (event: React.MouseEvent) => void;
  isPlanning: boolean;
  isDownloadingPdf: boolean;
}

function OrderTableRow({
  theme,
  order,
  recipeName,
  gridStyle,
  onSelect,
  onPlan,
  onDownloadPdf,
  isPlanning,
  isDownloadingPdf,
}: OrderTableRowProps): React.JSX.Element {
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
      <span>{recipeName}</span>
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
      <span className={styles.rowActions}>
        <RecetaUtilityButton
          theme={theme}
          size="sm"
          variant="pdf"
          disabled={isDownloadingPdf}
          onClick={onDownloadPdf}
        />
        {order.status === 'DRAFT' && (
          <RecetaActionButton
            theme={theme}
            size="sm"
            accent="orange"
            variant="soft"
            label="Planificar"
            loading={isPlanning}
            onClick={onPlan}
          />
        )}
      </span>
    </div>
  );
}
