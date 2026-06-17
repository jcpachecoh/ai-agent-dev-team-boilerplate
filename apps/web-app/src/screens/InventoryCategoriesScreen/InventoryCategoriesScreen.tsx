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
import { INVENTARIO_CATEGORY_RESPONSIVE_COLUMNS } from '@/features/inventario/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';
import {
  useCreateSupplyCategory,
  useDeactivateSupplyCategory,
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
    return (
      item.nombre.toLowerCase().includes(q) ||
      item.prefijo.toLowerCase().includes(q) ||
      desc.includes(q)
    );
  });
}

export function InventoryCategoriesScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const categoriesQuery = useSupplyCategories('all');
  const createMutation = useCreateSupplyCategory();
  const updateMutation = useUpdateSupplyCategory();
  const deactivateMutation = useDeactivateSupplyCategory();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<SupplyCategoryApi | undefined>();

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

  const handleDeactivate = async (category: SupplyCategoryApi) => {
    const confirmed = window.confirm(`¿Desactivar la categoría "${category.nombre}"?`);
    if (!confirmed) return;

    try {
      await deactivateMutation.mutateAsync(category.id);
      toast.success('Categoría desactivada');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const saving =
    createMutation.isPending || updateMutation.isPending || deactivateMutation.isPending;

  const pageToolbar = (
    <InventarioPageToolbar
      title="Categorías de insumos"
      subtitle={
        categoriesQuery.isLoading
          ? 'Cargando categorías…'
          : `Total: ${filtered.length} categorías • Página ${page} de ${totalPages}`
      }
      actionLabel="CREAR CATEGORÍA"
      onAction={openCreate}
      theme={theme}
      size="xl"
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
                    onDelete={() => void handleDeactivate(category)}
                  />
                )}
                renderCard={(category) => (
                  <InventarioCategoryCard
                    category={category}
                    theme={theme}
                    onEdit={() => openEdit(category)}
                    onDelete={() => void handleDeactivate(category)}
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
        </>
      ) : null}
    </div>
  );
}

export default InventoryCategoriesScreen;
