import React, { type JSX } from 'react';

import styles from './ProduccionPlantMap.module.scss';
import { ProduccionKpiCell } from '../produccion-kpi-cell/ProduccionKpiCell';
import { ProduccionOperatorActivityRow } from '../produccion-operator-activity-row/ProduccionOperatorActivityRow';
import { ProduccionOrderQueueRow } from '../produccion-order-queue-row/ProduccionOrderQueueRow';
import { ProduccionPlantStationCard } from '../produccion-plant-station-card/ProduccionPlantStationCard';
import type {
  ProduccionKpiItem,
  ProduccionOperatorActivityItem,
  ProduccionOrderQueueItem,
  ProduccionPlantStationData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionPlantMapProps {
  kpis?: ProduccionKpiItem[];
  stations?: ProduccionPlantStationData[];
  orders?: ProduccionOrderQueueItem[];
  activities?: ProduccionOperatorActivityItem[];
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
const kpis: ProduccionKpiItem[] = [
  { label: 'Throughput', value: '42', unit: 'u/h', delta: '▲ +3.2% vs ayer', accent: 'teal' },
  { label: 'OEE Línea', value: '84.2', unit: '%', delta: '▲ +1.1% turno', accent: 'teal' },
  { label: 'Alarmas activas', value: '4', accent: 'danger' },
  { label: 'Estaciones activas', value: '6/6', accent: 'gold' },
  { label: 'Completadas hoy', value: '18', unit: 'OP', accent: 'gold' },
  { label: 'T° Parrilla', value: '182', unit: '°C', accent: 'warning' },
];
const stations: ProduccionPlantStationData[] = [
  {
    code: 'EST-03',
    name: 'Parrilla Central',
    status: 'active',
    tone: 'cooking',
    meta: '2 OP activas',
    progress: 76,
  },
  {
    code: 'EST-04',
    name: 'Línea Fría',
    status: 'active',
    tone: 'cooling',
    meta: '1 receta',
    progress: 48,
  },
  {
    code: 'EST-05',
    name: 'Frituras',
    status: 'active',
    tone: 'cooking',
    meta: '3 OP activas',
    progress: 84,
  },
  {
    code: 'EST-06',
    name: 'Empaque y Despacho',
    status: 'active',
    tone: 'packing',
    meta: 'Despacho continuo',
    progress: 62,
  },
];
const orders: ProduccionOrderQueueItem[] = [
  'OP-000012',
  'OP-000013',
  'OP-000014',
  'OP-000015',
  'OP-000016',
].map((orderNumber, index) => ({
  orderNumber,
  recipeName: index % 2 ? 'Pollo asado porcionado' : 'Costillas BBQ',
  stationLabel: index % 2 ? 'EST-05 · Frituras' : 'EST-03 · Parrilla Central',
  etaLabel: `${20 + index * 5} min`,
  statusLabel: index > 2 ? 'EN COLA' : 'EN PROCESO',
}));
const activities: ProduccionOperatorActivityItem[] = [
  { operatorName: 'J. García', stationLabel: 'EST-05 — Frituras', actionLabel: 'Completó fase' },
  { operatorName: 'A. López', stationLabel: 'EST-06 — Empaque', actionLabel: 'Inició empaque' },
  {
    operatorName: 'P. Torres',
    stationLabel: 'EST-03 — Parrilla Central',
    actionLabel: 'Registró temperatura',
  },
];
export function ProduccionPlantMap({
  kpis: kpiItems = kpis,
  stations: stationItems = stations,
  orders: orderItems = orders,
  activities: activityItems = activities,
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionPlantMapProps): JSX.Element {
  return (
    <main
      className={[styles.map, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <section className={styles.kpis}>
        {kpiItems.map((kpi) => (
          <ProduccionKpiCell key={kpi.label} {...kpi} theme={theme} size="xl" />
        ))}
      </section>
      <section className={styles.body}>
        <div className={styles.stations}>
          {stationItems.map((station) => (
            <ProduccionPlantStationCard key={station.code} {...station} theme={theme} size="md" />
          ))}
        </div>
        <aside className={styles.side}>
          <section className={styles.panel}>
            <h3>Cola de OP</h3>
            {orderItems.map((order) => (
              <ProduccionOrderQueueRow key={order.orderNumber} {...order} theme={theme} />
            ))}
          </section>
          <section className={styles.panel}>
            <h3>Actividad reciente</h3>
            {activityItems.map((activity) => (
              <ProduccionOperatorActivityRow
                key={`${activity.operatorName}-${activity.actionLabel}`}
                {...activity}
                theme={theme}
              />
            ))}
          </section>
        </aside>
      </section>
    </main>
  );
}
export default ProduccionPlantMap;
