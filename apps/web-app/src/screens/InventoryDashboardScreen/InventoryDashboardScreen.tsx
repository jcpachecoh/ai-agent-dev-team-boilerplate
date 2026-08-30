import {
  InventarioBarChart,
  InventarioBarRow,
  InventarioMetricCard,
  InventarioPageHeader,
  InventarioPanel,
  toast,
} from '@restopsiq/ui';
import { AlertTriangle, ArrowLeftRight, Box, DollarSign } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { fetchInventoryDashboard } from '@/api/inventory';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import type { InventoryDashboardData } from '@/types/inventory';
import { formatCurrency } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

const REFRESH_MS = 30_000;

export function InventoryDashboardScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const [data, setData] = useState<InventoryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const result = await fetchInventoryDashboard();
      setData(result);
    } catch {
      setError(true);
      toast.error('Error al cargar el dashboard de inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  if (loading && !data) {
    return (
      <div className={shared.screen}>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="loading" />
        </section>
      </div>
    );
  }

  if (error || !data) {
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
          title="Dashboard de inventario"
          subtitle="Resumen operacional en tiempo real · Actualización automática cada 30 s"
          theme={theme}
          size="md"
          className={shared.pageHeaderHost}
        />
      </section>

      <section className={[shared.metricsSection, shared.metricsFour].join(' ')}>
        <InventarioMetricCard
          label="Total Items"
          value={data.totalItems.toLocaleString('es-CO')}
          accent="success"
          icon={<Box aria-hidden />}
          theme={theme}
          size="xl"
        />
        <InventarioMetricCard
          label="Valor Total"
          value={formatCurrency(data.totalValue)}
          accent="info"
          icon={<DollarSign aria-hidden />}
          theme={theme}
          size="xl"
        />
        <InventarioMetricCard
          label="Stock Bajo"
          value={`${data.lowStockCount} items`}
          accent="warning"
          icon={<AlertTriangle aria-hidden />}
          theme={theme}
          size="xl"
        />
        <InventarioMetricCard
          label="Movimientos Hoy"
          value={String(data.movementsToday)}
          accent="purple"
          icon={<ArrowLeftRight aria-hidden />}
          theme={theme}
          size="xl"
        />
      </section>

      <section className={shared.panelsSection}>
        <div className={shared.panelCell}>
          <InventarioPanel title="Top 10 Productos por Stock" theme={theme} size="xl">
            <div className={shared.barList}>
              {data.topProducts.map((item) => (
                <InventarioBarRow
                  key={item.label}
                  {...item}
                  theme={theme}
                  size="xl"
                  density="compact"
                />
              ))}
            </div>
          </InventarioPanel>
        </div>
        <div className={shared.panelCell}>
          <InventarioPanel title="Stock por Sede (%)" theme={theme} size="xl">
            <div className={shared.barList}>
              {data.stockBySite.map((item) => (
                <InventarioBarRow
                  key={item.label}
                  {...item}
                  theme={theme}
                  size="xl"
                  density="comfortable"
                />
              ))}
            </div>
          </InventarioPanel>
        </div>
      </section>

      <section className={shared.chartSection}>
        <InventarioPanel title="Histórico Últimos 30 Días (% Ocupación)" theme={theme} size="xl">
          <InventarioBarChart items={data.historyOccupancy} theme={theme} size="xl" />
        </InventarioPanel>
      </section>
    </div>
  );
}

export default InventoryDashboardScreen;
