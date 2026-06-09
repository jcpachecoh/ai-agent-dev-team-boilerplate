import { InventarioPageHeader, InventarioPanel, toast } from '@restopsiq/ui';
import { Link, useParams } from 'react-router-dom';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useSupplyItem } from '@/features/inventario/hooks/useSupplyItem';
import { useSupplyItemPriceHistory } from '@/features/inventario/hooks/useSupplyItemPriceHistory';
import { useSupplyItemSuppliers } from '@/features/inventario/hooks/useSupplyItemSuppliers';
import { useUiTheme } from '@/hooks/useUiTheme';
import { STOCK_UNIT_OPTIONS } from '@/types/inventory';
import { formatCurrency } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';
import styles from './InventoryProductDetailScreen.module.scss';

function unitLabel(unit: string): string {
  return STOCK_UNIT_OPTIONS.find((u) => u.value === unit)?.label ?? unit;
}

function formatHistoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function InventoryProductDetailScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const { id = '' } = useParams();
  const productQuery = useSupplyItem(id);
  const suppliersQuery = useSupplyItemSuppliers(id);
  const historyQuery = useSupplyItemPriceHistory(id);

  const product = productQuery.data;

  if (productQuery.isLoading) return <InventoryScreenState variant="loading" />;
  if (productQuery.isError) {
    toast.error('Error al cargar el insumo');
    return <InventoryScreenState variant="error" onRetry={() => void productQuery.refetch()} />;
  }
  if (!product) {
    return <InventoryScreenState variant="empty" message="Insumo no encontrado." />;
  }

  const suppliers = suppliersQuery.data ?? [];
  const history = historyQuery.data ?? [];

  return (
    <div className={shared.screen}>
      <section className={shared.backSection}>
        <Link to="/inventory/products">← Volver al listado</Link>
      </section>

      <section className={shared.pageHeader}>
        <InventarioPageHeader
          title={product.name}
          subtitle={`SKU ${product.sku} · ${product.category} · ${product.supplier}`}
          theme={theme}
          size="xl"
          className={shared.pageHeaderHost}
        />
      </section>

      <section className={shared.detailBlock}>
        <InventarioPanel title="Información general" theme={theme} size="xl">
          <dl className={styles.infoGrid}>
            <div>
              <dt>Costo promedio (CPP)</dt>
              <dd>{formatCurrency(product.costPrice)}</dd>
            </div>
            <div>
              <dt>Unidad base</dt>
              <dd>{unitLabel(product.unidadBase ?? 'UNIT')}</dd>
            </div>
            <div>
              <dt>Stock mínimo bodega</dt>
              <dd>{product.minStock}</dd>
            </div>
            <div>
              <dt>Stock máximo bodega</dt>
              <dd>{product.maxStock}</dd>
            </div>
            <div>
              <dt>Stock disponible</dt>
              <dd>{product.currentStock}</dd>
            </div>
            <div>
              <dt>Lote / vencimiento</dt>
              <dd>
                {product.aplicaLote ? 'Lote' : '—'} / {product.aplicaVencimiento ? 'Vence' : '—'}
              </dd>
            </div>
          </dl>
        </InventarioPanel>
      </section>

      <section className={shared.detailBlock}>
        <InventarioPanel title="Proveedores" theme={theme} size="xl">
          <div className={[shared.tableWrap, shared.tableWrapInset].join(' ')}>
            <div className={shared.tableBody}>
              {suppliersQuery.isLoading ? (
                <p className={styles.muted}>Cargando proveedores…</p>
              ) : suppliers.length === 0 ? (
                <p className={styles.muted}>Sin proveedores asociados.</p>
              ) : (
                <div className={[styles.siteTable, styles.supplierGrid].join(' ')}>
                  <div className={styles.siteHeader} role="row">
                    <span>Proveedor</span>
                    <span>NIT</span>
                    <span>Precio</span>
                    <span>Unidad</span>
                    <span>Lead time</span>
                    <span>Principal</span>
                  </div>
                  {suppliers.map((row) => (
                    <div key={row.supplierId} className={styles.siteRow} role="row">
                      <span>{row.razonSocial}</span>
                      <span>{row.nit}</span>
                      <span>{formatCurrency(row.precioUnitario)}</span>
                      <span>{unitLabel(row.unidadCompra)}</span>
                      <span>{row.tiempoEntregaDias} días</span>
                      <span>{row.esProveedorPrincipal ? 'Sí' : '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </InventarioPanel>
      </section>

      <section className={shared.detailBlock}>
        <InventarioPanel title="Historial de costos" theme={theme} size="xl">
          <div className={[shared.tableWrap, shared.tableWrapInset].join(' ')}>
            <div className={shared.tableBody}>
              {historyQuery.isLoading ? (
                <p className={styles.muted}>Cargando historial…</p>
              ) : history.length === 0 ? (
                <p className={styles.muted}>Sin movimientos de costo registrados.</p>
              ) : (
                <div className={[styles.siteTable, styles.historyGrid].join(' ')}>
                  <div className={styles.siteHeader} role="row">
                    <span>Fecha</span>
                    <span>Costo anterior</span>
                    <span>Costo nuevo</span>
                    <span>Motivo</span>
                  </div>
                  {history.map((entry) => (
                    <div key={entry.id} className={styles.siteRow} role="row">
                      <span>{formatHistoryDate(entry.createdAt)}</span>
                      <span>{formatCurrency(entry.costoAnterior)}</span>
                      <span>{formatCurrency(entry.costoNuevo)}</span>
                      <span>{entry.motivo ?? '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </InventarioPanel>
      </section>
    </div>
  );
}

export default InventoryProductDetailScreen;
