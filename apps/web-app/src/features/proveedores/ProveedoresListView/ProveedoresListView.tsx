import {
  ProveedorActionButton,
  ProveedorMetricCard,
  ProveedorPageHeader,
  ProveedorSuppliersTable,
  RecetaFilterSelect,
  RecetaSearch,
  type ProveedorTableRowProps,
} from '@restopsiq/ui';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getErrorMessage, isGraphqlConfigured } from '@/lib/graphql-client';

import {
  CATEGORY_FILTER_OPTIONS,
  matchesPaymentFilter,
  matchesStatusFilter,
  PAYMENT_FILTER_OPTIONS,
  PROVEEDOR_TABLE_SIZE,
  PROVEEDOR_UI_THEME,
  STATUS_FILTER_OPTIONS,
} from '../constants';
import { useSupplierListMetrics } from '../hooks/useSuppliers';
import {
  formatCompactCop,
  formatCondicionPago,
  formatCop,
  formatReliability,
} from '../mappers/display';
import type { CondicionPagoFilter, SupplierStatusFilter } from '../types';
import styles from '../proveedores.module.scss';

export default function ProveedoresListView(): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<CondicionPagoFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const {
    data: suppliers = [],
    metrics,
    isPending,
    isError,
    error,
  } = useSupplierListMetrics(search, statusFilter, paymentFilter);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      if (!matchesStatusFilter(statusFilter, supplier.status)) return false;
      if (!matchesPaymentFilter(paymentFilter, supplier.condicionPago)) return false;
      if (categoryFilter !== 'all' && supplier.categoryLabel !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter, paymentFilter, statusFilter, suppliers]);

  const tableRows: ProveedorTableRowProps[] = useMemo(
    () =>
      filteredSuppliers.map((supplier) => ({
        supplierId: supplier.id,
        supplierCode: supplier.displayCode,
        name: supplier.razonSocial,
        category: supplier.categoryLabel,
        status: supplier.status,
        paymentTerms: formatCondicionPago(supplier.condicionPago),
        leadTime: supplier.leadTimeLabel,
        reliability: formatReliability(supplier.calificacion),
        productCount: supplier.productCount ?? 0,
        balance: formatCop(supplier.balanceCxp),
        lastPurchaseOrder: supplier.lastPurchaseOrderDate ?? '—',
        theme: PROVEEDOR_UI_THEME,
        size: PROVEEDOR_TABLE_SIZE,
      })),
    [filteredSuppliers],
  );

  return (
    <div className={styles.content}>
      {!isGraphqlConfigured() && (
        <p className={styles.configBanner}>
          Inicia sesión para cargar proveedores. Las consultas GraphQL usan el JWT guardado tras el
          login global (GraphQL). En dev: <code>pnpm --filter @restopsiq/api start:dev</code> y{' '}
          <code>VITE_GRAPHQL_URL=/graphql</code> (proxy Vite → API :3001).
        </p>
      )}

      <section className={styles.pageHeaderSection}>
        <ProveedorPageHeader theme={PROVEEDOR_UI_THEME} size={PROVEEDOR_TABLE_SIZE} />
      </section>

      <section className={styles.metricsRow} aria-label="Indicadores de proveedores">
        <ProveedorMetricCard
          className={styles.metricCard}
          label="PROVEEDORES ACTIVOS"
          value={metrics.activeCount}
          valueColor="enterprise"
          theme={PROVEEDOR_UI_THEME}
          size={PROVEEDOR_TABLE_SIZE}
          loading={isPending}
        />
        <ProveedorMetricCard
          className={styles.metricCard}
          label="PENDIENTES APROBACIÓN"
          value={metrics.pendingCount}
          valueColor="warning"
          theme={PROVEEDOR_UI_THEME}
          size={PROVEEDOR_TABLE_SIZE}
          loading={isPending}
        />
        <ProveedorMetricCard
          className={styles.metricCard}
          label="SALDO CXP"
          value={formatCompactCop(metrics.totalBalanceCxp)}
          valueColor="warning"
          theme={PROVEEDOR_UI_THEME}
          size={PROVEEDOR_TABLE_SIZE}
          loading={isPending}
        />
        <ProveedorMetricCard
          className={styles.metricCard}
          label="TOTAL PRODUCTOS"
          value={metrics.totalProducts}
          theme={PROVEEDOR_UI_THEME}
          size={PROVEEDOR_TABLE_SIZE}
          loading={isPending}
        />
      </section>

      <section className={styles.toolbarRow} aria-label="Filtros y acciones">
        <RecetaSearch
          theme={PROVEEDOR_UI_THEME}
          size="md"
          value={search}
          onChange={setSearch}
          placeholder="Buscar proveedor..."
          ariaLabel="Buscar proveedor"
          className={styles.searchGrow}
        />
        <RecetaFilterSelect
          theme={PROVEEDOR_UI_THEME}
          size="md"
          className={styles.filterSelect}
          options={CATEGORY_FILTER_OPTIONS}
          value={categoryFilter}
          onChange={setCategoryFilter}
          aria-label="Filtrar por categoría"
        />
        <RecetaFilterSelect
          theme={PROVEEDOR_UI_THEME}
          size="md"
          className={styles.filterSelect}
          options={STATUS_FILTER_OPTIONS}
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as SupplierStatusFilter)}
          aria-label="Filtrar por estado"
        />
        <RecetaFilterSelect
          theme={PROVEEDOR_UI_THEME}
          size="md"
          className={styles.filterSelect}
          options={PAYMENT_FILTER_OPTIONS}
          value={paymentFilter}
          onChange={(value) => setPaymentFilter(value as CondicionPagoFilter)}
          aria-label="Filtrar por condición de pago"
        />
        <div className={styles.actionsStack}>
          <ProveedorActionButton
            variant="primary"
            theme={PROVEEDOR_UI_THEME}
            size="md"
            onClick={() => navigate('/proveedores/nuevo')}
          />
          <ProveedorActionButton
            variant="export"
            theme={PROVEEDOR_UI_THEME}
            size="md"
            className={styles.exportAction}
            onClick={() => window.alert('Exportar — próximamente')}
          />
        </div>
      </section>

      <section className={styles.tableSection} aria-label="Lista de proveedores">
        {isGraphqlConfigured() && isError ? (
          <p className={`${styles.stateMessage} ${styles.stateMessageError}`} role="alert">
            {getErrorMessage(error)}
          </p>
        ) : (
          <ProveedorSuppliersTable
            rows={tableRows}
            theme={PROVEEDOR_UI_THEME}
            size={PROVEEDOR_TABLE_SIZE}
            onRowClick={(supplierId) => navigate(`/proveedores/${supplierId}`)}
            emptyState={isPending ? 'Cargando proveedores…' : 'No hay proveedores'}
          />
        )}
      </section>
    </div>
  );
}
