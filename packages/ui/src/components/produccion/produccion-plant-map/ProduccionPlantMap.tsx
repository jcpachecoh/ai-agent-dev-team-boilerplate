import React, { type JSX } from 'react';

import styles from './ProduccionPlantMap.module.scss';
import { ProduccionKpiCell } from '../produccion-kpi-cell/ProduccionKpiCell';
import { ProduccionPlantStationCard } from '../produccion-plant-station-card/ProduccionPlantStationCard';
import { ProduccionPlantStationLiveDetailPanel } from '../produccion-plant-station-live-detail-panel/ProduccionPlantStationLiveDetailPanel';
import type {
  ProduccionKpiItem,
  ProduccionPlantAlarmItem,
  ProduccionPlantNewsItem,
  ProduccionPlantStationData,
  ProduccionPlantStationLiveDetailData,
  ProduccionSize,
  ProduccionTheme,
} from '../shared/produccion-types';

export interface ProduccionPlantMapProps {
  kpis?: ProduccionKpiItem[];
  stations?: ProduccionPlantStationData[];
  alarms?: ProduccionPlantAlarmItem[];
  news?: ProduccionPlantNewsItem[];
  activeStationCount?: number;
  showKpis?: boolean;
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
  onStationSelect?: (stationCode: string) => void;
  selectedStationCode?: string;
  stationDetail?: ProduccionPlantStationLiveDetailData | null;
  stationDetailLoading?: boolean;
  onStationDetailClose?: () => void;
  onPauseStation?: () => void;
  onEscalateStation?: () => void;
  onViewOrder?: () => void;
  stationStatusFilter?: 'all' | 'active' | 'inactive';
  stationProgressFilter?: 'all' | 'normal' | 'warning' | 'critical';
  onStationStatusFilterChange?: (filter: 'all' | 'active' | 'inactive') => void;
  onStationProgressFilterChange?: (filter: 'all' | 'normal' | 'warning' | 'critical') => void;
}

const kpis: ProduccionKpiItem[] = [
  { label: 'Throughput', value: '42', unit: 'u/h', delta: '▲ +3.2% vs ayer', accent: 'teal' },
  { label: 'OEE Línea', value: '84.2', unit: '%', delta: '▲ +1.1% turno', accent: 'teal' },
  { label: 'Alarmas activas', value: '4', accent: 'danger' },
  { label: 'Estaciones activas', value: '6/6', accent: 'gold' },
  { label: 'Completadas hoy', value: '18', unit: 'OP', delta: '▲ +4 vs ayer', accent: 'teal' },
  { label: 'T° Parrilla', value: '287', unit: '°C', delta: '▲ +18°C límite', accent: 'danger' },
];

const stations: ProduccionPlantStationData[] = [
  {
    code: 'EST-01',
    name: 'Mise en place',
    subtitle: 'Preparación de insumos',
    orderNumber: 'OP-000012',
    productName: 'Pollo asado porcionado',
    priority: 'normal',
    quantityLabel: '50 kg',
    phaseLabel: 'Fase 1/3',
    progress: 69,
    efficiencyStatus: 'normal',
    timerLabel: '10:22',
    operators: [{ initials: 'CM', tone: 'gold' }],
    operatorCountLabel: '1 op.',
    status: 'active',
  },
  {
    code: 'EST-02',
    name: 'Corte y Deshuese',
    subtitle: 'Fileteado y porcionado',
    orderNumber: 'OP-000013',
    productName: 'Costillas BBQ',
    priority: 'alta',
    quantityLabel: '30 kg',
    phaseLabel: 'Fase 2/4',
    progress: 99,
    efficiencyStatus: 'warning',
    timerLabel: '14:49',
    severity: 'medio',
    operators: [
      { initials: 'PT', tone: 'teal' },
      { initials: 'JG', tone: 'info' },
    ],
    operatorCountLabel: '2 op.',
    status: 'active',
  },
  {
    code: 'EST-03',
    name: 'Parrilla Central',
    subtitle: 'Sellado a fuego alto',
    orderNumber: 'OP-000012',
    productName: 'Pollo asado porcionado',
    priority: 'urgente',
    quantityLabel: '50 kg',
    phaseLabel: 'Fase 3/4',
    progress: 120,
    efficiencyStatus: 'critical',
    timerLabel: '17:59',
    severity: 'critico',
    operators: [{ initials: 'AL', tone: 'warning' }],
    operatorCountLabel: '1 op.',
    status: 'active',
  },
  {
    code: 'EST-04',
    name: 'Línea Fría',
    subtitle: 'Enfriamiento rápido',
    orderNumber: 'OP-000014',
    productName: 'Ensalada César',
    priority: 'normal',
    quantityLabel: '40 u',
    phaseLabel: 'Fase 2/3',
    progress: 55,
    efficiencyStatus: 'normal',
    timerLabel: '08:14',
    operators: [{ initials: 'MR', tone: 'teal' }],
    operatorCountLabel: '1 op.',
    status: 'active',
  },
  {
    code: 'EST-05',
    name: 'Frituras',
    subtitle: 'Freído en aceite',
    orderNumber: 'OP-000015',
    productName: 'Papas fritas premium',
    priority: 'alta',
    quantityLabel: '25 kg',
    phaseLabel: 'Fase 1/2',
    progress: 92,
    efficiencyStatus: 'warning',
    timerLabel: '12:07',
    severity: 'alto',
    operators: [{ initials: 'JG', tone: 'info' }],
    operatorCountLabel: '1 op.',
    status: 'active',
  },
  {
    code: 'EST-06',
    name: 'Empaque y Despacho',
    subtitle: 'Sellado y etiquetado',
    orderNumber: 'OP-000016',
    productName: 'Salsas house variedad',
    priority: 'alta',
    quantityLabel: '60 u',
    phaseLabel: 'Fase 3/3',
    progress: 67,
    efficiencyStatus: 'normal',
    timerLabel: '10:02',
    operators: [{ initials: 'FP', tone: 'gold' }],
    operatorCountLabel: '1 op.',
    status: 'active',
  },
];

const alarms: ProduccionPlantAlarmItem[] = [
  {
    code: 'ALM-C001',
    severity: 'critico',
    title: 'Temperatura parrilla excedida',
    stationLabel: 'EST-03 · Parrilla Central',
    timeLabel: 'hace 2 min',
  },
  {
    code: 'ALM-W002',
    severity: 'alto',
    title: 'Tiempo de fase excedido',
    stationLabel: 'EST-05 · Frituras',
    timeLabel: 'hace 5 min',
  },
  {
    code: 'ALM-W003',
    severity: 'medio',
    title: 'Operario sin asignar',
    stationLabel: 'EST-04 · Línea Fría',
    timeLabel: 'hace 12 min',
  },
];

const news: ProduccionPlantNewsItem[] = [
  {
    title: 'Pausa operario',
    detail: 'Pedro Torres · EST-02',
    timeLabel: '14:32',
    statusLabel: 'PENDIENTE',
    statusTone: 'warning',
  },
  {
    title: 'Insumo insuficiente',
    detail: 'María Ruiz · EST-01',
    timeLabel: '14:18',
    statusLabel: 'PENDIENTE',
    statusTone: 'warning',
  },
  {
    title: 'Fase completada',
    detail: 'J. García · EST-05',
    timeLabel: '13:55',
    statusLabel: 'RESUELTO',
    statusTone: 'success',
  },
];

const SEVERITY_LABELS = {
  critico: 'CRÍTICO',
  alto: 'ALTO',
  medio: 'MEDIO',
} as const;

export function ProduccionPlantMap({
  kpis: kpiItems = kpis,
  stations: stationItems = stations,
  alarms: alarmItems = alarms,
  news: newsItems = news,
  activeStationCount = 6,
  showKpis = true,
  theme = 'dark',
  size = 'xl',
  className,
  onStationSelect,
  selectedStationCode,
  stationDetail,
  stationDetailLoading = false,
  onStationDetailClose,
  onPauseStation,
  onEscalateStation,
  onViewOrder,
  stationStatusFilter = 'all',
  stationProgressFilter = 'all',
  onStationStatusFilterChange,
  onStationProgressFilterChange,
}: ProduccionPlantMapProps): JSX.Element {
  const visibleCount = stationItems.length;
  return (
    <main
      className={[styles.map, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <section className={styles.kpis}>
        {showKpis
          ? kpiItems.map((kpi) => (
              <ProduccionKpiCell key={kpi.label} {...kpi} theme={theme} size="xl" />
            ))
          : null}
      </section>
      <section className={styles.body}>
        <div className={styles.mainColumn}>
          <header className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <h2>Estaciones activas</h2>
              <span className={styles.sectionBadge}>
                {visibleCount} visibles · {activeStationCount} activas
              </span>
            </div>
            <div className={styles.filters}>
              <div className={styles.statusFilters}>
                {(
                  [
                    { id: 'all', label: 'Todas' },
                    { id: 'active', label: 'Activas' },
                    { id: 'inactive', label: 'Inactivas' },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={[
                      styles.filterChip,
                      stationStatusFilter === chip.id && styles.filterChipActive,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={stationStatusFilter === chip.id}
                    onClick={() => onStationStatusFilterChange?.(chip.id)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className={styles.progressFilters}>
                {(
                  [
                    { id: 'all', label: 'Todos %', dotClass: undefined },
                    { id: 'normal', label: '<80%', dotClass: styles.legendDotNormal },
                    { id: 'warning', label: '80–100%', dotClass: styles.legendDotWarning },
                    { id: 'critical', label: '>100%', dotClass: styles.legendDotCritical },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={[
                      styles.filterChip,
                      styles.legendDotButton,
                      stationProgressFilter === chip.id && styles.filterChipActive,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-pressed={stationProgressFilter === chip.id}
                    onClick={() => onStationProgressFilterChange?.(chip.id)}
                  >
                    {chip.dotClass ? <i className={chip.dotClass} aria-hidden /> : null}
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </header>
          <div className={styles.stations}>
            {stationItems.length > 0 ? (
              stationItems.map((station) => (
                <ProduccionPlantStationCard
                  key={station.code}
                  {...station}
                  theme={theme}
                  size="md"
                  selected={selectedStationCode === station.code}
                  onClick={onStationSelect ? () => onStationSelect(station.code) : undefined}
                />
              ))
            ) : (
              <p className={styles.emptyStations}>
                No hay estaciones con los filtros seleccionados.
              </p>
            )}
          </div>
        </div>
        <aside className={styles.side}>
          {stationDetail ? (
            <ProduccionPlantStationLiveDetailPanel
              {...stationDetail}
              theme={theme}
              size="md"
              onClose={onStationDetailClose}
              onPause={onPauseStation}
              onEscalate={onEscalateStation}
              onViewOrder={onViewOrder}
            />
          ) : stationDetailLoading ? (
            <section className={styles.panel}>
              <p className={styles.loadingDetail}>Cargando detalle…</p>
            </section>
          ) : (
            <>
              <section className={styles.panel}>
                <h3>Alarmas activas</h3>
                {alarmItems.map((alarm) => (
                  <article
                    key={alarm.code}
                    className={[styles.alarmCard, styles[`alarm--${alarm.severity}`]].join(' ')}
                  >
                    <div className={styles.alarmTop}>
                      <span className={styles.alarmCode}>{alarm.code}</span>
                      <span className={styles.alarmSeverity}>
                        {SEVERITY_LABELS[alarm.severity]}
                      </span>
                    </div>
                    <strong>{alarm.title}</strong>
                    <p>{alarm.stationLabel}</p>
                    <div className={styles.alarmFooter}>
                      <span>{alarm.timeLabel}</span>
                      <button type="button">ACK</button>
                    </div>
                  </article>
                ))}
              </section>
              <section className={styles.panel}>
                <h3>Novedades recientes</h3>
                {newsItems.map((item) => (
                  <article key={`${item.title}-${item.timeLabel}`} className={styles.newsItem}>
                    <div className={styles.newsHeader}>
                      <strong>{item.title}</strong>
                      {item.statusLabel ? (
                        <span
                          className={[
                            styles.newsStatus,
                            item.statusTone ? styles[`newsStatus--${item.statusTone}`] : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {item.statusLabel}
                        </span>
                      ) : null}
                    </div>
                    <p>{item.detail}</p>
                    <span className={styles.newsTime}>{item.timeLabel}</span>
                  </article>
                ))}
              </section>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

export default ProduccionPlantMap;
