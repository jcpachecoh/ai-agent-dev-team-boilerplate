import {
  InventarioMetricCard,
  InventarioPageHeader,
  InventarioTableHeader,
  InventarioTableRow,
  toast,
} from '@restopsiq/ui';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  fetchInventoryAlertSummary,
  fetchInventoryAlerts,
  resolveInventoryAlert,
} from '@/api/inventory';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import type { InventoryAlert } from '@/types/inventory';

import shared from '../inventory/shared.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

export function InventoryAlertsScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, resolvedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const list = await fetchInventoryAlerts();
      setAlerts(list);
      setSummary(fetchInventoryAlertSummary());
    } catch {
      setError(true);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResolve = async (id: string) => {
    try {
      await resolveInventoryAlert(id);
      toast.success('Alerta resuelta');
      await load();
    } catch {
      toast.error('Error al resolver la alerta');
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
      <section className={shared.pageHeader}>
        <InventarioPageHeader
          title="Alertas de Stock Bajo"
          subtitle={`${alerts.length} alertas pendientes de resolución`}
          theme={theme}
          size="xl"
          className={shared.pageHeaderHost}
        />
      </section>

      <section className={[shared.metricsSection, shared.metricsThree].join(' ')}>
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

      {alerts.length === 0 ? (
        <section className={shared.stateSection}>
          <InventoryScreenState variant="empty" message="No hay alertas pendientes." />
        </section>
      ) : (
        <section className={shared.tableWrap}>
          <div className={shared.tableHead}>
            <InventarioTableHeader variant="alert" theme={theme} size="xl" />
          </div>
          <div className={shared.tableBody}>
            {alerts.map((alert) => (
              <InventarioTableRow
                key={alert.id}
                variant="alert"
                theme={theme}
                size="xl"
                className={shared.tableRowHost}
                severity={alert.severity}
                product={alert.product}
                currentStock={alert.currentStock}
                minStock={alert.threshold}
                supplier={alert.supplier}
                onOrder={() => handleOrder(alert.product)}
                onResolve={() => void handleResolve(alert.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default InventoryAlertsScreen;
