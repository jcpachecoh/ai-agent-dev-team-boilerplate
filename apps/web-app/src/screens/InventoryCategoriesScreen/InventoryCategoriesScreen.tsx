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
import { ResponsiveTable } from '@/components/responsive-table';
import { CategoryFormModal } from '@/components/inventory/CategoryFormModal';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { CategoryStatusConfirmDialog } from '@/components/shared/CategoryStatusConfirmDialog';
import { INVENTARIO_CATEGORY_RESPONSIVE_COLUMNS } from '@/features/inventario/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';
import {
  useCreateSupplyCategory,
  useUpdateSupplyCategory,
} from '@/features/inventario/hooks/useSupplyCategoryMutations';
import { useSupplyCategories } from '@/features/inventario/hooks/useSupplyCategories';
import type { SupplyCategoryApi, SupplyCategoryFormValues } from '@/features/inventario/types';
import { getErrorMessage } from '@/lib/graphql-client';
import { INVENTORY_PAGE_SIZE } from '@/types/inventory';

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

function categoryToFormValues(category: SupplyCategoryApi): SupplyCategoryFormValues {
  return {
    nombre: category.nombre,
    prefijo: category.prefijo ?? '',
    descripcion: category.descripcion ?? '',
    isActive: category.isActive,
  };
}

export function InventoryCategoriesScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const categoriesQuery = useSupplyCategories('all');
  const createMutation = useCreateSupplyCategory();
  const updateMutation = useUpdateSupplyCategory();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<SupplyCategoryApi | undefined>();
  const [statusTarget, setStatusTarget] = useState<
    { category: SupplyCategoryApi; isActive: boolean } | undefined
  >();

  const categories = categoriesQuery.data ?? [];

  const filtered = useMemo(
    () => filterCategories(categories, search, status),
    [categories, search, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * INVENTORY_PAGE_SIZE, page * INVENTORY_PAGE_SIZE);

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

  const requestStatusChange = (category: SupplyCategoryApi, isActive: boolean) => {
    setStatusTarget({ category, isActive });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;

    try {
      await updateMutation.mutateAsync({
        id: statusTarget.category.id,
        values: {
          ...categoryToFormValues(statusTarget.category),
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

  const saving = createMutation.isPending || updateMutation.isPending;

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
                    onDelete={() => requestStatusChange(category, false)}
                    onToggleStatus={() => requestStatusChange(category, !category.isActive)}
                    toggleLoading={updateMutation.isPending}
                  />
                )}
                renderCard={(category) => (
                  <InventarioCategoryCard
                    category={category}
                    theme={theme}
                    onEdit={() => openEdit(category)}
                    onDelete={() => requestStatusChange(category, false)}
                    onToggleStatus={() => requestStatusChange(category, !category.isActive)}
                    toggleLoading={updateMutation.isPending}
                  />
                )}
              />
              <footer className={shared.tableFooter}>
                <InventarioPagination
                  page={page}
                  totalPages={totalPages}
                  summary={`Página ${page} de ${totalPages}`}
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
            open={Boolean(statusTarget)}
            categoryName={statusTarget?.category.nombre}
            isActivating={Boolean(statusTarget?.isActive)}
            submitting={updateMutation.isPending}
            theme={theme}
            onCancel={() => setStatusTarget(undefined)}
            onConfirm={() => void handleConfirmStatusChange()}
          />
        </>
      ) : null}
    </div>
  );
}

export default InventoryCategoriesScreen;
