import {
  InventarioMetricCard,
  InventarioPageHeader,
  InventarioTableHeader,
  toast,
} from '@restopsiq/ui';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
import { ResponsiveTable } from '@/components/responsive-table';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import {
  INVENTARIO_ALERT_RESPONSIVE_COLUMNS,
  INVENTARIO_RESOLVED_ALERT_RESPONSIVE_COLUMNS,
} from '@/features/inventario/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';
import type { InventoryAlert, InventoryResolvedAlert } from '@/types/inventory';

import shared from '../inventory/shared.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

type AlertTab = 'active' | 'resolved';

interface PendingResolve {
  id: string;
  product: string;
}

export function InventoryAlertsScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const [tab, setTab] = useState<AlertTab>('active');
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<InventoryResolvedAlert[]>([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, resolvedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingResolve, setPendingResolve] = useState<PendingResolve | null>(null);
  const [resolving, setResolving] = useState(false);

  const loadActive = useCallback(async () => {
    const list = await fetchInventoryAlerts();
    setAlerts(list);
    setSummary(fetchInventoryAlertSummary());
  }, []);

  const loadResolved = useCallback(async () => {
    const list = await fetchResolvedInventoryAlerts();
    setResolvedAlerts(list);
  }, []);

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

  const handleTabChange = async (next: AlertTab) => {
    setTab(next);
    if (next === 'resolved' && resolvedAlerts.length === 0) {
      try {
        await loadResolved();
      } catch {
        toast.error('Error al cargar alertas resueltas');
      }
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

      <section className={shared.pageHeader}>
        <InventarioPageHeader
          title="Alertas de stock bajo"
          subtitle={
            tab === 'active'
              ? `${alerts.length} alertas pendientes de resolución`
              : `${resolvedAlerts.length} alertas resueltas`
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
            onClick={() => void handleTabChange('active')}
          >
            Alertas activas
          </button>
          <button
            type="button"
            className={[
              shared.statusFilterBtn,
              tab === 'resolved' ? shared.statusFilterBtnActive : '',
            ].join(' ')}
            onClick={() => void handleTabChange('resolved')}
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

      {tab === 'resolved' &&
        (resolvedAlerts.length === 0 ? (
          <section className={shared.stateSection}>
            <InventoryScreenState variant="empty" message="No hay alertas resueltas." />
          </section>
        ) : (
          <section className={shared.tableWrap}>
            <ResponsiveTable<InventoryResolvedAlert>
              columns={INVENTARIO_RESOLVED_ALERT_RESPONSIVE_COLUMNS}
              rows={resolvedAlerts}
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
                />
              )}
              renderCard={(alert) => <InventarioResolvedAlertCard alert={alert} theme={theme} />}
            />
          </section>
        ))}
    </div>
  );
}

export default InventoryAlertsScreen;
