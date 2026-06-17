import {
  InventarioFormField,
  InventarioModal,
  InventarioPageHeader,
  InventarioPanel,
  InventarioPrimaryButton,
  InventarioTableHeader,
  InventarioTableRow,
  toast,
} from '@restopsiq/ui';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  adjustProductStock,
  fetchInventoryProduct,
  fetchProductMovements,
  fetchStockBySite,
} from '@/api/inventory';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import type { InventoryMovement, InventoryProduct, InventoryStockBySite } from '@/types/inventory';
import { formatCurrency, formatMovementQuantity } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';
import styles from './InventoryProductDetailScreen.module.scss';

export function InventoryProductDetailScreen(): React.JSX.Element {
  const { id = '' } = useParams();
  const [product, setProduct] = useState<InventoryProduct | null>(null);
  const [stockBySite, setStockBySite] = useState<InventoryStockBySite[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [p, sites, movs] = await Promise.all([
        fetchInventoryProduct(id),
        fetchStockBySite(id),
        fetchProductMovements(id),
      ]);
      if (!p) {
        setProduct(null);
        return;
      }
      setProduct(p);
      setStockBySite(sites);
      setMovements(movs);
    } catch {
      toast.error('Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdjust = async () => {
    if (!product) return;
    const qty = Number(adjustQty);
    if (Number.isNaN(qty) || !adjustReason.trim()) {
      toast.error('Ingrese cantidad y razón válidas');
      return;
    }
    try {
      await adjustProductStock(product.id, qty, adjustReason.trim());
      toast.success('Stock ajustado');
      setAdjustOpen(false);
      setAdjustQty('');
      setAdjustReason('');
      await load();
    } catch {
      toast.error('Error al ajustar stock');
    }
  };

  if (loading) return <InventoryScreenState variant="loading" />;
  if (!product) {
    return <InventoryScreenState variant="empty" message="Producto no encontrado." />;
  }

  const margin =
    product.sellingPrice > 0
      ? `${Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100)}%`
      : '—';

  return (
    <div className={shared.screen}>
      <section className={shared.backSection}>
        <Link to="/inventory/products">← Volver al listado</Link>
      </section>

      <section className={shared.pageHeader}>
        <InventarioPageHeader
          title={product.name}
          subtitle={`SKU ${product.sku} · ${product.category} · ${product.supplier}`}
          theme="dark"
          size="xl"
          className={shared.pageHeaderHost}
        />
      </section>

      <section className={shared.detailBlock}>
        <InventarioPanel title="Información general" theme="dark" size="xl">
          <dl className={styles.infoGrid}>
            <div>
              <dt>Precio costo</dt>
              <dd>{formatCurrency(product.costPrice)}</dd>
            </div>
            <div>
              <dt>Precio venta</dt>
              <dd>{formatCurrency(product.sellingPrice)}</dd>
            </div>
            <div>
              <dt>Margen</dt>
              <dd>{margin}</dd>
            </div>
            <div>
              <dt>Stock mínimo</dt>
              <dd>{product.minStock}</dd>
            </div>
            <div>
              <dt>Stock máximo</dt>
              <dd>{product.maxStock}</dd>
            </div>
            <div>
              <dt>Stock total</dt>
              <dd>{product.currentStock}</dd>
            </div>
          </dl>
        </InventarioPanel>
      </section>

      <section className={shared.detailBlock}>
        <InventarioPanel title="Stock por Sede" theme="dark" size="xl">
          <div className={[shared.tableWrap, shared.tableWrapInset].join(' ')}>
            <div className={shared.tableBody}>
              <div className={styles.siteTable}>
                <div className={styles.siteHeader} role="row">
                  <span>Sede</span>
                  <span>Stock actual</span>
                  <span>Reservado</span>
                  <span>Disponible</span>
                  <span>Acciones</span>
                </div>
                {stockBySite.map((row) => (
                  <div key={row.site} className={styles.siteRow} role="row">
                    <span>{row.site}</span>
                    <span>{row.current}</span>
                    <span>{row.reserved}</span>
                    <span>{row.available}</span>
                    <span>
                      <InventarioPrimaryButton
                        label="Ajustar"
                        variant="ghost"
                        showIcon={false}
                        onClick={() => setAdjustOpen(true)}
                        theme="dark"
                        size="sm"
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </InventarioPanel>
      </section>

      <section className={shared.detailBlock}>
        <InventarioPanel title="Últimos movimientos" theme="dark" size="xl">
          <div className={[shared.tableWrap, shared.tableWrapInset].join(' ')}>
            <div className={shared.tableHead}>
              <InventarioTableHeader variant="movement" theme="dark" size="xl" />
            </div>
            <div className={shared.tableBody}>
              {movements.map((m) => (
                <InventarioTableRow
                  key={m.id}
                  variant="movement"
                  theme="dark"
                  size="xl"
                  className={shared.tableRowHost}
                  date={m.date}
                  product={m.product}
                  movementType={m.movementType}
                  quantity={formatMovementQuantity(m.quantity)}
                  user={`${m.user} · ${m.site}`}
                  reference={m.reason}
                />
              ))}
            </div>
          </div>
        </InventarioPanel>
      </section>

      <InventarioModal
        open={adjustOpen}
        title="Ajustar Stock"
        subtitle={product.name}
        onClose={() => setAdjustOpen(false)}
        onSave={() => void handleAdjust()}
        theme="dark"
        size="md"
      >
        <div className={styles.adjustForm}>
          <InventarioFormField label="Cantidad (+/-)" theme="dark" size="md">
            <input
              type="number"
              className={styles.input}
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />
          </InventarioFormField>
          <InventarioFormField label="Razón" theme="dark" size="md">
            <input
              className={styles.input}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
          </InventarioFormField>
        </div>
      </InventarioModal>
    </div>
  );
}

export default InventoryProductDetailScreen;
