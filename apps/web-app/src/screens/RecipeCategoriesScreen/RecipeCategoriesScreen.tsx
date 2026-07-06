import {
  RecetaActionButton,
  RecetaFilterSelect,
  RecetaMetricCard,
  RecetaSearch,
  LoadingState,
  RecetaTableHeader,
  type RecetaTableColumn,
  toast,
} from '@restopsiq/ui';
import { useMemo, useState, type JSX } from 'react';

import type { PlantRecipeCategory } from '@/api/plant';
import { RecipeCategoryFormModal } from '@/components/recetas/RecipeCategoryFormModal';
import { RecipeCategoryListCard } from '@/components/recetas/RecipeCategoryListCard';
import { RecipeCategoryListRow } from '@/components/recetas/RecipeCategoryListRow';
import { CategoryDeleteConfirmDialog } from '@/components/shared/CategoryDeleteConfirmDialog';
import { CategoryStatusConfirmDialog } from '@/components/shared/CategoryStatusConfirmDialog';
import { ResponsiveTable } from '@/components/responsive-table';
import { RECIPE_CATEGORY_RESPONSIVE_COLUMNS } from '@/features/recetas/recipe-category-columns';
import { recetaTableColumnsForVisible } from '@/features/recetas/recipe-list-columns';
import {
  useCreateRecipeCategory,
  useDeleteRecipeCategory,
  useRecipeCategories,
  useUpdateRecipeCategory,
} from '@/features/recetas/hooks';
import { formatCategoryCode } from '@/features/recetas/mappers/recipes.mapper';
import type { RecipeCategoryFormValues, RecetaStatus } from '@/features/recetas/types';
import { useUiTheme } from '@/hooks/useUiTheme';
import { getErrorMessage } from '@/lib/graphql-client';

import listStyles from '../RecipesManagementScreen/RecipesManagementScreen.module.scss';

const categoryListTableColumns: RecetaTableColumn[] = [
  { key: 'id', label: 'Código', width: '112px' },
  { key: 'nombre', label: 'Nombre', width: 'minmax(160px, 1.2fr)' },
  { key: 'descripcion', label: 'Descripción', width: 'minmax(120px, 1fr)' },
  { key: 'estado', label: 'Estado', width: '108px', align: 'center' },
  { key: 'acciones', label: 'Acciones', width: '88px', align: 'right' },
];

const statusFilterOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
];

function filterCategories(
  items: PlantRecipeCategory[],
  search: string,
  status: 'all' | RecetaStatus,
): PlantRecipeCategory[] {
  const term = search.trim().toLowerCase();
  return items.filter((item) => {
    if (status === 'active' && !item.isActive) return false;
    if (status === 'inactive' && item.isActive) return false;
    if (!term) return true;
    const desc = (item.descripcion ?? '').toLowerCase();
    return item.nombre.toLowerCase().includes(term) || desc.includes(term);
  });
}

export function RecipeCategoriesScreen(): JSX.Element {
  const theme = useUiTheme();
  const categoriesQuery = useRecipeCategories('all');
  const createMutation = useCreateRecipeCategory();
  const updateMutation = useUpdateRecipeCategory();
  const deleteMutation = useDeleteRecipeCategory();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RecetaStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<PlantRecipeCategory | undefined>();
  const [statusTarget, setStatusTarget] = useState<
    { category: PlantRecipeCategory; isActive: boolean } | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<PlantRecipeCategory | undefined>();

  const categories = categoriesQuery.data ?? [];

  const filtered = useMemo(
    () => filterCategories(categories, search, statusFilter),
    [categories, search, statusFilter],
  );

  const totals = useMemo(() => {
    const total = filtered.length;
    const active = filtered.filter((item) => item.isActive).length;
    return { total, active, inactive: total - active };
  }, [filtered]);

  const loadError = categoriesQuery.error
    ? categoriesQuery.error instanceof Error
      ? categoriesQuery.error.message
      : 'Error al cargar categorías'
    : null;

  const saving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openCreate = () => {
    setModalMode('create');
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (category: PlantRecipeCategory) => {
    setModalMode('edit');
    setEditing(category);
    setModalOpen(true);
  };

  const handleSave = async (values: RecipeCategoryFormValues) => {
    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(values);
        toast.success('Categoría creada correctamente');
      } else if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values });
        toast.success('Categoría actualizada');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const requestStatusChange = (category: PlantRecipeCategory) => {
    setStatusTarget({ category, isActive: !category.isActive });
  };

  const requestDelete = (category: PlantRecipeCategory) => {
    setDeleteTarget(category);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusTarget) return;

    try {
      await updateMutation.mutateAsync({
        id: statusTarget.category.id,
        values: {
          nombre: statusTarget.category.nombre,
          descripcion: statusTarget.category.descripcion ?? '',
          isActive: statusTarget.isActive,
        },
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

  return (
    <div className={listStyles.screen}>
      {loadError ? <p className={listStyles.loadError}>{loadError}</p> : null}
      <main className={listStyles.content}>
        <header className={listStyles.pageHeader}>
          <div className={listStyles.pageHeaderMain}>
            <h1>Categorías de recetas</h1>
            <p>Clasificación de recetas de producción en planta</p>
          </div>
          <RecetaActionButton
            theme={theme}
            size="md"
            label="Nueva Categoría"
            className={listStyles.pageHeaderAction}
            onClick={openCreate}
          />
        </header>

        <section className={[listStyles.metricsRow, listStyles.metricsRowThree].join(' ')}>
          <RecetaMetricCard
            theme={theme}
            variant="type-1"
            title="Total categorías"
            value={totals.total}
            size="xl"
          />
          <RecetaMetricCard
            theme={theme}
            variant="type-2"
            title="Activas"
            value={totals.active}
            size="xl"
          />
          <RecetaMetricCard
            theme={theme}
            variant="type-3"
            title="Inactivas"
            value={totals.inactive}
            size="xl"
          />
        </section>

        <section className={[listStyles.toolbarRow, listStyles.toolbarRowList].join(' ')}>
          <RecetaSearch
            theme={theme}
            size="md"
            value={search}
            onChange={setSearch}
            className={[listStyles.searchGrow, listStyles.searchGrowList].join(' ')}
          />
          <RecetaFilterSelect
            theme={theme}
            size="md"
            className={[listStyles.filterSelect, listStyles.filterSelectList].join(' ')}
            value={statusFilter}
            options={statusFilterOptions}
            onChange={(value) => setStatusFilter(value as 'all' | RecetaStatus)}
          />
        </section>

        <section className={[listStyles.tableWrap, listStyles.tableWrapList].join(' ')}>
          {categoriesQuery.isLoading ? (
            <LoadingState message="Cargando categorías…" layout="compact" />
          ) : filtered.length === 0 ? (
            <p className={listStyles.loadError}>No hay categorías que coincidan con los filtros.</p>
          ) : (
            <ResponsiveTable<PlantRecipeCategory>
              columns={RECIPE_CATEGORY_RESPONSIVE_COLUMNS}
              rows={filtered}
              keyExtractor={(category) => category.id}
              className={listStyles.recipeListTable}
              renderTableHeader={({ visibleColumns }) => (
                <RecetaTableHeader
                  theme={theme}
                  size="md"
                  className={[listStyles.tableHead, listStyles.listTableHead].join(' ')}
                  columns={recetaTableColumnsForVisible(categoryListTableColumns, visibleColumns)}
                />
              )}
              renderTableRow={(category, { visibleColumns, columnsTemplate }) => (
                <div
                  key={category.id}
                  className={[listStyles.rowClickable, listStyles.categoryRowHost].join(' ')}
                  onClick={() => openEdit(category)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openEdit(category);
                    }
                  }}
                >
                  <RecipeCategoryListRow
                    code={formatCategoryCode(category, filtered.indexOf(category))}
                    nombre={category.nombre}
                    descripcion={category.descripcion ?? ''}
                    status={category.isActive ? 'active' : 'inactive'}
                    theme={theme}
                    visibleColumns={visibleColumns}
                    columnsTemplate={columnsTemplate}
                    onEdit={() => openEdit(category)}
                    onDelete={() => requestDelete(category)}
                    onToggleStatus={() => requestStatusChange(category)}
                    toggleLoading={updateMutation.isPending || deleteMutation.isPending}
                  />
                </div>
              )}
              renderCard={(category) => (
                <RecipeCategoryListCard
                  code={formatCategoryCode(category, filtered.indexOf(category))}
                  nombre={category.nombre}
                  descripcion={category.descripcion ?? ''}
                  status={category.isActive ? 'active' : 'inactive'}
                  theme={theme}
                  onEdit={() => openEdit(category)}
                  onDelete={() => requestDelete(category)}
                  onToggleStatus={() => requestStatusChange(category)}
                  onOpen={() => openEdit(category)}
                  toggleLoading={updateMutation.isPending || deleteMutation.isPending}
                />
              )}
            />
          )}
        </section>
      </main>

      <RecipeCategoryFormModal
        open={modalOpen}
        mode={modalMode}
        theme={theme}
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
            Vas a eliminar la categoría <strong>{deleteTarget?.nombre}</strong>. Las recetas
            asociadas quedarán sin categoría.
          </>
        }
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}

export default RecipeCategoriesScreen;
