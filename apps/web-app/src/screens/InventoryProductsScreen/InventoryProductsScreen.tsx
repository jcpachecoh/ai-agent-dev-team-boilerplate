import {
  InventarioFilterToolbar,
  InventarioPageToolbar,
  InventarioPagination,
  InventarioTableHeader,
  InventarioTableRow,
  toast,
} from '@restopsiq/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  checkSkuExists,
  createInventoryProduct,
  deleteInventoryProduct,
  fetchInventoryProducts,
  updateInventoryProduct,
} from '@/api/inventory';
import { ProductFormModal } from '@/components/inventory/ProductFormModal';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import type { InventoryProduct, InventoryProductFormValues } from '@/types/inventory';
import { INVENTORY_PAGE_SIZE } from '@/types/inventory';
import { filterProducts, formatCurrency, stockToneForProduct } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';

export function InventoryProductsScreen(): React.JSX.Element {
  const navigate = useNavigate();
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [supplierId, setSupplierId] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<InventoryProduct | undefined>();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const list = await fetchInventoryProducts();
      setProducts(list);
    } catch {
      setError(true);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterProducts(products, { search, categoryId, supplierId, lowStockOnly }),
    [products, search, categoryId, supplierId, lowStockOnly],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / INVENTORY_PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * INVENTORY_PAGE_SIZE, page * INVENTORY_PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
      toast.error('El SKU ya existe. Use un código único.');
      return;
    }

    setSaving(true);
    try {
      if (modalMode === 'create') {
        await createInventoryProduct(values);
        toast.success('Producto creado correctamente');
      } else if (editing) {
        await updateInventoryProduct(editing.id, values);
        toast.success('Producto actualizado');
      }
      setModalOpen(false);
      await load();
    } catch {
      toast.error('Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: InventoryProduct) => {
    const confirmed = window.confirm(`¿Eliminar ${product.name}? Se desactivará del catálogo.`);
    if (!confirmed) return;

    try {
      await deleteInventoryProduct(product.id);
      toast.success('Producto eliminado');
      await load();
    } catch {
      toast.error('Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <div className={shared.screen}>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="loading" />
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shared.screen}>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="error" onRetry={() => void load()} />
        </section>
      </div>
    );
  }

  return (
    <div className={shared.screen}>
      <section className={shared.pageHeader}>
        <InventarioPageToolbar
          title="Gestión de Productos"
          subtitle={`Total: ${filtered.length} productos • Página ${page} de ${totalPages}`}
          actionLabel="CREAR PRODUCTO"
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
            message="No hay productos que coincidan con los filtros."
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
                unitPrice={formatCurrency(product.sellingPrice)}
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
