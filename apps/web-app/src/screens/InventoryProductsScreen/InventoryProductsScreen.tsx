import {
  InventarioFilterToolbar,
  InventarioPageToolbar,
  InventarioPagination,
  InventarioTableHeader,
  InventarioTableRow,
  toast,
  type InventarioSelectOption,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { checkSkuExists } from '@/api/inventory';
import { ProductFormModal } from '@/components/inventory/ProductFormModal';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useSupplyCategories } from '@/features/inventario/hooks/useSupplyCategories';
import {
  useCreateSupplyItem,
  useDeactivateSupplyItem,
  useUpdateSupplyItem,
} from '@/features/inventario/hooks/useSupplyItemMutations';
import { getErrorMessage } from '@/lib/graphql-client';
import { useSupplyItems } from '@/features/inventario/hooks/useSupplyItems';
import type { InventoryProduct, InventoryProductFormValues } from '@/types/inventory';
import { INVENTORY_PAGE_SIZE } from '@/types/inventory';
import { filterProducts, formatCurrency, stockToneForProduct } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';

export function InventoryProductsScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const itemsQuery = useSupplyItems();
  const categoriesQuery = useSupplyCategories();
  const createMutation = useCreateSupplyItem();
  const updateMutation = useUpdateSupplyItem();
  const deactivateMutation = useDeactivateSupplyItem();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [supplierId, setSupplierId] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<InventoryProduct | undefined>();

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
    () => filterProducts(products, { search, categoryId, supplierId, lowStockOnly }),
    [products, search, categoryId, supplierId, lowStockOnly],
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
    const skuTaken = await checkSkuExists(values.sku, editing?.id);
    if (skuTaken) {
      toast.error('El código interno ya existe. Use un código único.');
      return;
    }

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(values);
        toast.success('Insumo creado correctamente');
      } else if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, values });
        toast.success('Insumo actualizado');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (product: InventoryProduct) => {
    const confirmed = window.confirm(`¿Desactivar ${product.name}?`);
    if (!confirmed) return;

    try {
      await deactivateMutation.mutateAsync(product.id);
      toast.success('Insumo desactivado');
    } catch {
      toast.error('Error al desactivar el insumo');
    }
  };

  const saving =
    createMutation.isPending || updateMutation.isPending || deactivateMutation.isPending;

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
          title="Gestión de Insumos"
          subtitle={`Total: ${filtered.length} insumos • Página ${page} de ${totalPages}`}
          actionLabel="CREAR INSUMO"
          onAction={openCreate}
          theme="dark"
          size="xl"
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
          theme="dark"
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
          <div className={shared.tableHead}>
            <InventarioTableHeader variant="product" theme="dark" size="xl" />
          </div>
          <div className={shared.tableBody}>
            {pageItems.map((product) => (
              <InventarioTableRow
                key={product.id}
                variant="product"
                theme="dark"
                size="xl"
                className={shared.tableRowHost}
                sku={product.sku}
                name={product.name}
                category={product.category}
                supplier={product.supplier}
                stockTotal={product.currentStock}
                unitPrice={formatCurrency(product.costPrice)}
                lastMovement={product.lastMovement}
                stockTone={stockToneForProduct(product)}
                lowStockWarning={product.currentStock < product.minStock}
                onSkuClick={() => navigate(`/inventory/products/${product.id}`)}
                onEdit={() => openEdit(product)}
                onDelete={() => void handleDelete(product)}
              />
            ))}
          </div>
          <footer className={shared.tableFooter}>
            <InventarioPagination
              page={page}
              totalPages={totalPages}
              summary={`Página ${page} de ${totalPages}`}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              theme="dark"
              size="md"
            />
          </footer>
        </section>
      )}

      <ProductFormModal
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
