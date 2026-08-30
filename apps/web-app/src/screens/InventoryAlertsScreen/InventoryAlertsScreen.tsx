import {
  InventarioMetricCard,
  InventarioPageHeader,
  InventarioSearch,
  InventarioTableHeader,
  toast,
} from '@restopsiq/ui';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  fetchInventoryAlertSummary,
  fetchInventoryAlerts,
  fetchResolvedInventoryAlerts,
  resolveInventoryAlert,
} from '@/api/inventory';
import {
  InventarioAlertCard,
  InventarioAlertRow,
  InventarioResolvedAlertCard,
  InventarioResolvedAlertRow,
} from '@/components/inventario/inventario-responsive';
import { ResolveAlertModal } from '@/components/inventory/ResolveAlertModal';
import { ResolvedAlertDetailModal } from '@/components/inventory/ResolvedAlertDetailModal';
import { ResponsiveTable } from '@/components/responsive-table';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import {
  INVENTARIO_ALERT_RESPONSIVE_COLUMNS,
  INVENTARIO_RESOLVED_ALERT_RESPONSIVE_COLUMNS,
} from '@/features/inventario/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';
import type {
  InventoryAlert,
  InventoryResolvedAlert,
  ResolvedAlertSortField,
  SortDirection,
} from '@/types/inventory';

import shared from '../inventory/shared.module.scss';
import styles from './InventoryAlertsScreen.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

type AlertTab = 'active' | 'resolved';

interface PendingResolve {
  id: string;
  product: string;
}

const RESOLVED_PAGE_SIZE = 100;

function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function InventoryAlertsScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const [tab, setTab] = useState<AlertTab>('active');

  // Active alerts state
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, resolvedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingResolve, setPendingResolve] = useState<PendingResolve | null>(null);
  const [resolving, setResolving] = useState(false);

  // Resolved alerts state
  const [resolvedAlerts, setResolvedAlerts] = useState<InventoryResolvedAlert[]>([]);
  const [resolvedLoading, setResolvedLoading] = useState(false);
  const [resolvedError, setResolvedError] = useState(false);
  const [resolvedHasNext, setResolvedHasNext] = useState(false);
  const [resolvedCursor, setResolvedCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search / sort / filter for resolved tab
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery);
  const [sortField, setSortField] = useState<ResolvedAlertSortField>('resolvedAt');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [filterHasNote, setFilterHasNote] = useState<boolean | null>(null);

  // Detail modal
  const [detailAlert, setDetailAlert] = useState<InventoryResolvedAlert | null>(null);

  // Track initial load of resolved tab to avoid double-fetching
  const resolvedLoadedRef = useRef(false);

  const loadActive = useCallback(async () => {
    const list = await fetchInventoryAlerts();
    setAlerts(list);
    setSummary(fetchInventoryAlertSummary());
  }, []);

  const loadResolved = useCallback(
    async (reset = true) => {
      if (reset) {
        setResolvedLoading(true);
        setResolvedError(false);
      } else {
        setLoadingMore(true);
      }

      try {
        const cursor = reset ? undefined : (resolvedCursor ?? undefined);
        const page = await fetchResolvedInventoryAlerts(cursor, RESOLVED_PAGE_SIZE);

        if (reset) {
          setResolvedAlerts(page.edges);
        } else {
          setResolvedAlerts((prev) => [...prev, ...page.edges]);
        }
        setResolvedHasNext(page.pageInfo.hasNextPage);
        setResolvedCursor(page.pageInfo.endCursor);
        resolvedLoadedRef.current = true;
      } catch {
        if (reset) setResolvedError(true);
        toast.error('Error al cargar alertas resueltas');
      } finally {
        setResolvedLoading(false);
        setLoadingMore(false);
      }
    },
    [resolvedCursor],
  );

  const load = useCallback(async () => {
    try {
      setError(false);
      await loadActive();
    } catch {
      setError(true);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  }, [loadActive]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleTabChange = (next: AlertTab) => {
    setTab(next);
    if (next === 'resolved' && !resolvedLoadedRef.current) {
      void loadResolved(true);
    }
  };

  const handleResolveClick = (id: string, product: string) => {
    setPendingResolve({ id, product });
  };

  const handleResolveConfirm = async (note: string | undefined) => {
    if (!pendingResolve) return;
    setResolving(true);
    try {
      await resolveInventoryAlert(pendingResolve.id, note);
      toast.success('Alerta resuelta');
      setPendingResolve(null);
      // Invalidate resolved cache so it reloads on next tab switch
      resolvedLoadedRef.current = false;
      setResolvedAlerts([]);
      await loadActive();
    } catch {
      toast.error('Error al resolver la alerta');
    } finally {
      setResolving(false);
    }
  };

  const handleOrder = (product: string) => {
    toast.info(`Orden de compra para ${product} (módulo Proveedores — próximamente)`);
  };

  const handleSortClick = (field: ResolvedAlertSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'resolvedAt' ? 'desc' : 'asc');
    }
  };

  const filteredAndSortedResolved = useMemo(() => {
    let list = resolvedAlerts;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.product.toLowerCase().includes(q) ||
          a.supplier.toLowerCase().includes(q) ||
          (a.note ?? '').toLowerCase().includes(q),
      );
    }

    if (filterHasNote === true) {
      list = list.filter((a) => !!a.note);
    } else if (filterHasNote === false) {
      list = list.filter((a) => !a.note);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'resolvedAt') {
        cmp = a.resolvedAt.localeCompare(b.resolvedAt);
      } else if (sortField === 'product') {
        cmp = a.product.localeCompare(b.product, 'es');
      } else if (sortField === 'supplier') {
        cmp = a.supplier.localeCompare(b.supplier, 'es');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [resolvedAlerts, debouncedSearch, sortField, sortDir, filterHasNote]);

  const SortIcon = ({ field }: { field: ResolvedAlertSortField }) => {
    if (sortField !== field) return <ArrowUpDown className={styles.sortIconInactive} aria-hidden />;
    return sortDir === 'asc' ? (
      <ArrowUp className={styles.sortIconActive} aria-hidden />
    ) : (
      <ArrowDown className={styles.sortIconActive} aria-hidden />
    );
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
      <ResolveAlertModal
        theme={theme}
        open={pendingResolve !== null}
        productName={pendingResolve?.product ?? ''}
        saving={resolving}
        onClose={() => setPendingResolve(null)}
        onConfirm={(note) => void handleResolveConfirm(note)}
      />

      <ResolvedAlertDetailModal
        alert={detailAlert}
        theme={theme}
        onClose={() => setDetailAlert(null)}
      />

      <section className={shared.pageHeader}>
        <InventarioPageHeader
          title="Alertas de stock bajo"
          subtitle={
            tab === 'active'
              ? `${alerts.length} alertas pendientes de resolución`
              : resolvedLoading
                ? 'Cargando...'
                : `${filteredAndSortedResolved.length} alertas resueltas${debouncedSearch || filterHasNote !== null ? ' (filtradas)' : ''}`
          }
          theme={theme}
          size="md"
          className={shared.pageHeaderHost}
        />
      </section>

      <section
        className={shared.metricsSection}
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        <InventarioMetricCard
          label="Crítico"
          value={String(summary.critical)}
          accent="danger"
          icon={<ShieldAlert aria-hidden />}
          theme={theme}
          size="xl"
        />
        <InventarioMetricCard
          label="Advertencia"
          value={String(summary.warning)}
          accent="warning"
          icon={<AlertTriangle aria-hidden />}
          theme={theme}
          size="xl"
        />
        <InventarioMetricCard
          label="Resueltas Hoy"
          value={String(summary.resolvedToday)}
          accent="success"
          icon={<CheckCircle aria-hidden />}
          theme={theme}
          size="xl"
        />
      </section>

      <section className={shared.toolbarSection}>
        <div className={shared.statusFilters}>
          <button
            type="button"
            className={[
              shared.statusFilterBtn,
              tab === 'active' ? shared.statusFilterBtnActive : '',
            ].join(' ')}
            onClick={() => handleTabChange('active')}
          >
            Alertas activas
          </button>
          <button
            type="button"
            className={[
              shared.statusFilterBtn,
              tab === 'resolved' ? shared.statusFilterBtnActive : '',
            ].join(' ')}
            onClick={() => handleTabChange('resolved')}
          >
            Alertas resueltas
          </button>
        </div>
      </section>

      {tab === 'active' &&
        (alerts.length === 0 ? (
          <section className={shared.stateSection}>
            <InventoryScreenState variant="empty" message="No hay alertas pendientes." />
          </section>
        ) : (
          <section className={shared.tableWrap}>
            <ResponsiveTable<InventoryAlert>
              columns={INVENTARIO_ALERT_RESPONSIVE_COLUMNS}
              rows={alerts}
              keyExtractor={(alert) => alert.id}
              className={shared.responsiveTable}
              renderTableHeader={({ visibleColumns }) => (
                <div className={shared.tableHead}>
                  <InventarioTableHeader
                    variant="alert"
                    theme={theme}
                    size="xl"
                    columns={headerColumnsFromResponsive(visibleColumns, {
                      currentStock: 'center',
                      minStock: 'center',
                      actions: 'center',
                    })}
                  />
                </div>
              )}
              renderTableRow={(alert, { visibleColumns, columnsTemplate }) => (
                <InventarioAlertRow
                  alert={alert}
                  theme={theme}
                  visibleColumns={visibleColumns}
                  columnsTemplate={columnsTemplate}
                  onOrder={() => handleOrder(alert.product)}
                  onResolve={() => handleResolveClick(alert.id, alert.product)}
                />
              )}
              renderCard={(alert) => (
                <InventarioAlertCard
                  alert={alert}
                  theme={theme}
                  onOrder={() => handleOrder(alert.product)}
                  onResolve={() => handleResolveClick(alert.id, alert.product)}
                />
              )}
            />
          </section>
        ))}

      {tab === 'resolved' && (
        <>
          {/* Toolbar: búsqueda + filtros + sort */}
          <section className={[shared.toolbarSection, styles.resolvedToolbar].join(' ')}>
            <div className={styles.resolvedToolbarRow}>
              <InventarioSearch
                value={searchQuery}
                placeholder="Buscar por insumo, proveedor o razón..."
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                theme={theme}
                size="md"
                className={styles.resolvedSearch}
              />
              <div className={styles.resolvedFilters}>
                <button
                  type="button"
                  className={[
                    styles.filterChip,
                    filterHasNote === true ? styles.filterChipActive : '',
                  ].join(' ')}
                  onClick={() => setFilterHasNote((v) => (v === true ? null : true))}
                >
                  Con razón
                </button>
                <button
                  type="button"
                  className={[
                    styles.filterChip,
                    filterHasNote === false ? styles.filterChipActive : '',
                  ].join(' ')}
                  onClick={() => setFilterHasNote((v) => (v === false ? null : false))}
                >
                  Sin razón
                </button>
              </div>
              <div className={styles.resolvedSort}>
                <span className={styles.sortLabel}>Ordenar:</span>
                <button
                  type="button"
                  className={[
                    styles.sortBtn,
                    sortField === 'resolvedAt' ? styles.sortBtnActive : '',
                  ].join(' ')}
                  onClick={() => handleSortClick('resolvedAt')}
                >
                  Fecha <SortIcon field="resolvedAt" />
                </button>
                <button
                  type="button"
                  className={[
                    styles.sortBtn,
                    sortField === 'product' ? styles.sortBtnActive : '',
                  ].join(' ')}
                  onClick={() => handleSortClick('product')}
                >
                  Insumo <SortIcon field="product" />
                </button>
                <button
                  type="button"
                  className={[
                    styles.sortBtn,
                    sortField === 'supplier' ? styles.sortBtnActive : '',
                  ].join(' ')}
                  onClick={() => handleSortClick('supplier')}
                >
                  Proveedor <SortIcon field="supplier" />
                </button>
              </div>
            </div>
          </section>

          {resolvedLoading ? (
            <section className={shared.stateSection}>
              <InventoryScreenState variant="loading" />
            </section>
          ) : resolvedError ? (
            <section className={shared.stateSection}>
              <InventoryScreenState
                variant="error"
                message="No se pudo cargar el historial de alertas resueltas."
                onRetry={() => void loadResolved(true)}
              />
            </section>
          ) : filteredAndSortedResolved.length === 0 ? (
            <section className={shared.stateSection}>
              <InventoryScreenState
                variant="empty"
                message={
                  debouncedSearch || filterHasNote !== null
                    ? 'No hay alertas que coincidan con los filtros aplicados.'
                    : 'No hay alertas resueltas todavía.'
                }
              />
            </section>
          ) : (
            <>
              <section className={shared.tableWrap}>
                <ResponsiveTable<InventoryResolvedAlert>
                  columns={INVENTARIO_RESOLVED_ALERT_RESPONSIVE_COLUMNS}
                  rows={filteredAndSortedResolved}
                  keyExtractor={(alert) => alert.id}
                  className={shared.responsiveTable}
                  renderTableHeader={({ visibleColumns }) => (
                    <div className={shared.tableHead}>
                      <InventarioTableHeader
                        variant="alert"
                        theme={theme}
                        size="xl"
                        columns={headerColumnsFromResponsive(visibleColumns, {
                          currentStock: 'center',
                          minStock: 'center',
                        })}
                      />
                    </div>
                  )}
                  renderTableRow={(alert, { visibleColumns, columnsTemplate }) => (
                    <InventarioResolvedAlertRow
                      alert={alert}
                      theme={theme}
                      visibleColumns={visibleColumns}
                      columnsTemplate={columnsTemplate}
                      onClick={() => setDetailAlert(alert)}
                    />
                  )}
                  renderCard={(alert) => (
                    <InventarioResolvedAlertCard
                      alert={alert}
                      theme={theme}
                      onClick={() => setDetailAlert(alert)}
                    />
                  )}
                />
              </section>

              {resolvedHasNext && (
                <section className={shared.tableFooter}>
                  <button
                    type="button"
                    className={styles.loadMoreBtn}
                    onClick={() => void loadResolved(false)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar más alertas'}
                  </button>
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default InventoryAlertsScreen;
