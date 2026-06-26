import {
  InventarioFilterToolbar,
  InventarioPageToolbar,
  InventarioPagination,
  InventarioTableHeader,
  toast,
  type InventarioSelectOption,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { checkSkuExists } from '@/api/inventory';
import {
  InventarioProductCard,
  InventarioProductRow,
} from '@/components/inventario/inventario-responsive';
import { ResponsiveTable } from '@/components/responsive-table';
import { ProductFormModal } from '@/components/inventory/ProductFormModal';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { INVENTARIO_PRODUCT_RESPONSIVE_COLUMNS } from '@/features/inventario/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';
import { useSupplyCategories } from '@/features/inventario/hooks/useSupplyCategories';
import {
  useCreateSupplyItem,
  useToggleSupplyItemStatus,
  useUpdateSupplyItem,
} from '@/features/inventario/hooks/useSupplyItemMutations';
import { getErrorMessage } from '@/lib/graphql-client';
import { useSupplyItems } from '@/features/inventario/hooks/useSupplyItems';
import type { InventoryProduct, InventoryProductFormValues } from '@/types/inventory';
import { INVENTORY_PAGE_SIZE } from '@/types/inventory';
import { filterProducts, formatCurrency, stockToneForProduct } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
] as const;

export function InventoryProductsScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const itemsQuery = useSupplyItems('all');
  const categoriesQuery = useSupplyCategories();
  const createMutation = useCreateSupplyItem();
  const updateMutation = useUpdateSupplyItem();
  const toggleStatusMutation = useToggleSupplyItemStatus();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [supplierId, setSupplierId] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<InventoryProduct | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const products = itemsQuery.data ?? [];

  const categoryOptions: InventarioSelectOption[] = useMemo(() => {
    const cats = categoriesQuery.data ?? [];
    return [
      { value: 'all', label: 'Todas las categorías' },
      ...cats.map((c) => ({ value: c.id, label: c.nombre })),
    ];
  }, [categoriesQuery.data]);

  const supplierOptions: InventarioSelectOption[] = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      if (p.supplierId && p.supplier !== '—') {
        seen.set(p.supplierId, p.supplier);
      }
    }
    return [
      { value: 'all', label: 'Todos los proveedores' },
      ...Array.from(seen.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [products]);

  const filtered = useMemo(
    () => filterProducts(products, { search, categoryId, supplierId, lowStockOnly, status }),
    [products, search, categoryId, supplierId, lowStockOnly, status],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * INVENTORY_PAGE_SIZE, page * INVENTORY_PAGE_SIZE);

  const openCreate = () => {
    setModalMode('create');
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (product: InventoryProduct) => {
    setModalMode('edit');
    setEditing(product);
    setModalOpen(true);
  };

  const handleSave = async (values: InventoryProductFormValues) => {
    try {
      const skuTaken = await checkSkuExists(values.sku, editing?.id);
      if (skuTaken) {
        toast.error('El código interno ya existe. Use un código único.');
        return;
      }
    } catch {
      // SKU check failure is non-blocking; backend enforces uniqueness
    }

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(values);
        toast.success('Insumo creado correctamente');
        setPage(1);
      } else if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values });
        toast.success('Insumo actualizado');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleToggleStatus = (product: InventoryProduct) => {
    setTogglingId(product.id);
    toggleStatusMutation.mutate(
      { id: product.id, isActive: !product.isActive },
      {
        onSuccess: () => {
          toast.success(
            product.isActive
              ? `${product.name} fue descontinuado`
              : `${product.name} fue reactivado`,
          );
          setTogglingId(null);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err));
          setTogglingId(null);
        },
      },
    );
  };

  const saving =
    createMutation.isPending || updateMutation.isPending || toggleStatusMutation.isPending;

  if (itemsQuery.isLoading) {
    return (
      <div className={shared.screen}>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="loading" />
        </section>
      </div>
    );
  }

  if (itemsQuery.isError) {
    return (
      <div className={shared.screen}>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="error" onRetry={() => void itemsQuery.refetch()} />
        </section>
      </div>
    );
  }

  return (
    <div className={shared.screen}>
      <section className={shared.pageHeader}>
        <InventarioPageToolbar
          title="Gestión de insumos"
          subtitle={`${filtered.length} insumos · Página ${page} de ${totalPages}`}
          actionLabel="CREAR INSUMO"
          onAction={openCreate}
          theme={theme}
          size="md"
          className={shared.pageHeaderHost}
        />
      </section>

      <section className={shared.toolbarSection}>
        <InventarioFilterToolbar
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          categoryValue={categoryId}
          onCategoryChange={(v) => {
            setCategoryId(v);
            setPage(1);
          }}
          supplierValue={supplierId}
          onSupplierChange={(v) => {
            setSupplierId(v);
            setPage(1);
          }}
          categoryOptions={categoryOptions}
          supplierOptions={supplierOptions}
          lowStockOnly={lowStockOnly}
          onLowStockChange={(v) => {
            setLowStockOnly(v);
            setPage(1);
          }}
          statusOptions={[...STATUS_FILTER_OPTIONS]}
          statusValue={status}
          onStatusChange={(v) => {
            setStatus(v as 'all' | 'active' | 'inactive');
            setPage(1);
          }}
          theme={theme}
          size="xl"
          className={shared.embedToolbar}
        />
      </section>

      {filtered.length === 0 ? (
        <section className={shared.stateSection}>
          <InventoryScreenState
            variant="empty"
            message="No hay insumos que coincidan con los filtros."
          />
        </section>
      ) : (
        <section className={shared.tableWrap}>
          <ResponsiveTable<InventoryProduct>
            columns={INVENTARIO_PRODUCT_RESPONSIVE_COLUMNS}
            rows={pageItems}
            keyExtractor={(product) => product.id}
            className={shared.responsiveTable}
            renderTableHeader={({ visibleColumns }) => (
              <div className={shared.tableHead}>
                <InventarioTableHeader
                  variant="product"
                  theme={theme}
                  size="xl"
                  columns={headerColumnsFromResponsive(visibleColumns, {
                    stock: 'center',
                    price: 'right',
                    estado: 'center',
                    actions: 'center',
                  })}
                />
              </div>
            )}
            renderTableRow={(product, { visibleColumns, columnsTemplate }) => (
              <InventarioProductRow
                product={product}
                theme={theme}
                visibleColumns={visibleColumns}
                columnsTemplate={columnsTemplate}
                stockTone={stockToneForProduct(product)}
                unitPrice={formatCurrency(product.costPrice)}
                lowStockWarning={product.currentStock < product.minStock}
                onSkuClick={() => navigate(`/inventory/products/${product.id}`)}
                onEdit={() => openEdit(product)}
                onToggleStatus={() => handleToggleStatus(product)}
                toggleLoading={togglingId === product.id}
              />
            )}
            renderCard={(product) => (
              <InventarioProductCard
                product={product}
                theme={theme}
                stockTone={stockToneForProduct(product)}
                unitPrice={formatCurrency(product.costPrice)}
                lowStockWarning={product.currentStock < product.minStock}
                onSkuClick={() => navigate(`/inventory/products/${product.id}`)}
                onEdit={() => openEdit(product)}
                onToggleStatus={() => handleToggleStatus(product)}
                toggleLoading={togglingId === product.id}
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

      <ProductFormModal
        theme={theme}
        open={modalOpen}
        mode={modalMode}
        product={editing}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={(values) => void handleSave(values)}
      />
    </div>
  );
}

export default InventoryProductsScreen;
