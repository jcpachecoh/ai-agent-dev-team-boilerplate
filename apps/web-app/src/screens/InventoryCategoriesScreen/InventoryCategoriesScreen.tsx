import {
  InventarioPageToolbar,
  InventarioPagination,
  InventarioSearch,
  InventarioSelect,
  InventarioTableHeader,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';

import {
  InventarioCategoryCard,
  InventarioCategoryRow,
} from '@/components/inventario/inventario-responsive';
import { CategoryDeleteConfirmDialog } from '@/components/shared/CategoryDeleteConfirmDialog';
import { CategoryStatusConfirmDialog } from '@/components/shared/CategoryStatusConfirmDialog';
import { ResponsiveTable } from '@/components/responsive-table';
import { CategoryFormModal } from '@/components/inventory/CategoryFormModal';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { INVENTARIO_CATEGORY_RESPONSIVE_COLUMNS } from '@/features/inventario/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';
import {
  useCreateSupplyCategory,
  useDeleteSupplyCategory,
  useUpdateSupplyCategory,
} from '@/features/inventario/hooks/useSupplyCategoryMutations';
import { useSupplyCategories } from '@/features/inventario/hooks/useSupplyCategories';
import type { SupplyCategoryApi, SupplyCategoryFormValues } from '@/features/inventario/types';
import { getErrorMessage } from '@/lib/graphql-client';
import { INVENTORY_PAGE_SIZE } from '@/types/inventory';
import { getTablePaginationRange, paginateItems } from '@/utils/table-pagination';

import { useUiTheme } from '@/hooks/useUiTheme';

import shared from '../inventory/shared.module.scss';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
] as const;

function filterCategories(
  items: SupplyCategoryApi[],
  search: string,
  status: 'all' | 'active' | 'inactive',
): SupplyCategoryApi[] {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    if (status === 'active' && !item.isActive) return false;
    if (status === 'inactive' && item.isActive) return false;
    if (!q) return true;
    const desc = (item.descripcion ?? '').toLowerCase();
    const prefijo = (item.prefijo ?? '').toLowerCase();
    return item.nombre.toLowerCase().includes(q) || prefijo.includes(q) || desc.includes(q);
  });
}

export function InventoryCategoriesScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const categoriesQuery = useSupplyCategories('all');
  const createMutation = useCreateSupplyCategory();
  const updateMutation = useUpdateSupplyCategory();
  const deleteMutation = useDeleteSupplyCategory();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<SupplyCategoryApi | undefined>();
  const [statusTarget, setStatusTarget] = useState<
    { category: SupplyCategoryApi; isActive: boolean } | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<SupplyCategoryApi | undefined>();

  const categories = categoriesQuery.data ?? [];

  const filtered = useMemo(
    () => filterCategories(categories, search, status),
    [categories, search, status],
  );

  const { totalPages, summary, pageLabel } = getTablePaginationRange(
    page,
    INVENTORY_PAGE_SIZE,
    filtered.length,
  );
  const pageItems = paginateItems(filtered, page, INVENTORY_PAGE_SIZE);

  const openCreate = () => {
    setModalMode('create');
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (category: SupplyCategoryApi) => {
    setModalMode('edit');
    setEditing(category);
    setModalOpen(true);
  };

  const handleSave = async (values: SupplyCategoryFormValues) => {
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(values);
        toast.success('Categoría creada correctamente');
      } else if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values, original: editing });
        toast.success('Categoría actualizada');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const requestStatusChange = (category: SupplyCategoryApi) => {
    setStatusTarget({ category, isActive: !category.isActive });
  };

  const requestDelete = (category: SupplyCategoryApi) => {
    setDeleteTarget(category);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;

    try {
      await updateMutation.mutateAsync({
        id: statusTarget.category.id,
        values: {
          nombre: statusTarget.category.nombre,
          prefijo: statusTarget.category.prefijo ?? '',
          descripcion: statusTarget.category.descripcion ?? '',
          isActive: statusTarget.isActive,
        },
        original: statusTarget.category,
      });
      toast.success(statusTarget.isActive ? 'Categoría activada' : 'Categoría desactivada');
      setStatusTarget(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Categoría eliminada');
      setDeleteTarget(undefined);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const pageToolbar = (
    <InventarioPageToolbar
      title="Categorías de insumos"
      subtitle={
        categoriesQuery.isLoading
          ? 'Cargando categorías…'
          : `${filtered.length} categorías · Página ${page} de ${totalPages}`
      }
      actionLabel="CREAR CATEGORÍA"
      onAction={openCreate}
      theme={theme}
      size="md"
      className={shared.pageHeaderHost}
    />
  );

  if (categoriesQuery.isError) {
    return (
      <div className={shared.screen}>
        <section className={shared.pageHeader}>{pageToolbar}</section>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="error" onRetry={() => void categoriesQuery.refetch()} />
        </section>
      </div>
    );
  }

  return (
    <div className={shared.screen}>
      <section className={shared.pageHeader}>{pageToolbar}</section>

      {categoriesQuery.isLoading ? (
        <section className={shared.stateSection}>
          <InventoryScreenState variant="loading" />
        </section>
      ) : null}

      {!categoriesQuery.isLoading ? (
        <>
          <section className={shared.toolbarSection}>
            <div className={[shared.embedToolbar, shared.embedToolbarInline].join(' ')}>
              <InventarioSearch
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Buscar por nombre o descripción…"
                theme={theme}
                size="md"
                className={shared.toolbarSearch}
              />
              <InventarioSelect
                options={[...STATUS_FILTER_OPTIONS]}
                value={status}
                onChange={(v) => {
                  setStatus(v as 'all' | 'active' | 'inactive');
                  setPage(1);
                }}
                theme={theme}
                size="md"
                aria-label="Filtrar por estado"
                className={shared.toolbarSelect}
              />
            </div>
          </section>

          {filtered.length === 0 ? (
            <section className={shared.stateSection}>
              <InventoryScreenState
                variant="empty"
                message="No hay categorías que coincidan con los filtros."
              />
            </section>
          ) : (
            <section className={shared.tableWrap}>
              <ResponsiveTable<SupplyCategoryApi>
                columns={INVENTARIO_CATEGORY_RESPONSIVE_COLUMNS}
                rows={pageItems}
                keyExtractor={(category) => category.id}
                className={shared.responsiveTable}
                renderTableHeader={({ visibleColumns }) => (
                  <div className={shared.tableHead}>
                    <InventarioTableHeader
                      variant="category"
                      theme={theme}
                      size="xl"
                      columns={headerColumnsFromResponsive(visibleColumns, {
                        estado: 'center',
                        actions: 'center',
                      })}
                    />
                  </div>
                )}
                renderTableRow={(category, { visibleColumns, columnsTemplate }) => (
                  <InventarioCategoryRow
                    category={category}
                    theme={theme}
                    visibleColumns={visibleColumns}
                    columnsTemplate={columnsTemplate}
                    onEdit={() => openEdit(category)}
                    onDelete={() => requestDelete(category)}
                    onToggleStatus={() => requestStatusChange(category)}
                    toggleLoading={updateMutation.isPending || deleteMutation.isPending}
                  />
                )}
                renderCard={(category) => (
                  <InventarioCategoryCard
                    category={category}
                    theme={theme}
                    onEdit={() => openEdit(category)}
                    onDelete={() => requestDelete(category)}
                    onToggleStatus={() => requestStatusChange(category)}
                    toggleLoading={updateMutation.isPending || deleteMutation.isPending}
                  />
                )}
              />
              <footer className={shared.tableFooter}>
                <InventarioPagination
                  page={page}
                  totalPages={totalPages}
                  summary={summary}
                  pageLabel={pageLabel}
                  onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  theme={theme}
                  size="md"
                />
              </footer>
            </section>
          )}

          <CategoryFormModal
            theme={theme}
            open={modalOpen}
            mode={modalMode}
            category={editing}
            saving={saving}
            onClose={() => setModalOpen(false)}
            onSave={(values) => void handleSave(values)}
          />

          <CategoryStatusConfirmDialog
            categoryName={statusTarget?.category.nombre}
            isActivating={statusTarget?.isActive ?? false}
            open={Boolean(statusTarget)}
            submitting={updateMutation.isPending}
            theme={theme}
            onCancel={() => setStatusTarget(undefined)}
            onConfirm={() => void handleConfirmStatusChange()}
          />

          <CategoryDeleteConfirmDialog
            categoryName={deleteTarget?.nombre}
            open={Boolean(deleteTarget)}
            submitting={deleteMutation.isPending}
            theme={theme}
            description={
              <>
                Vas a eliminar permanentemente la categoría <strong>{deleteTarget?.nombre}</strong>.
                Si tiene insumos asociados, la eliminación no será posible.
              </>
            }
            onCancel={() => setDeleteTarget(undefined)}
            onConfirm={() => void handleConfirmDelete()}
          />
        </>
      ) : null}
    </div>
  );
}

export default InventoryCategoriesScreen;
