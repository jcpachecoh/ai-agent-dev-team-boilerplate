import { ProduccionKpiCell, ProduccionModuleTabs, ProduccionPlantMap } from '@restopsiq/ui';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { useUiTheme } from '@/hooks/useUiTheme';

import { useSupervisorOverview } from '../hooks/useSupervisorOverview';
import { useSupervisorStationLiveDetail } from '../hooks/useSupervisorStationLiveDetail';
import { filterSupervisorMapStations } from '../mappers/display';
import type { SupervisorStationProgressFilter, SupervisorStationStatusFilter } from '../types';
import styles from '../supervisor.module.scss';

export default function SupervisorPlantMapView(): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const [selectedStationCode, setSelectedStationCode] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<SupervisorStationStatusFilter>('all');
  const [progressFilter, setProgressFilter] = useState<SupervisorStationProgressFilter>('all');
  const { data, isLoading, isError, refetch } = useSupervisorOverview();

  const filteredStations = useMemo(
    () =>
      data?.stations
        ? filterSupervisorMapStations(data.stations, statusFilter, progressFilter)
        : [],
    [data?.stations, progressFilter, statusFilter],
  );

  const selectedStation = useMemo(
    () => filteredStations.find((station) => station.code === selectedStationCode),
    [filteredStations, selectedStationCode],
  );

  const { data: liveDetail, isLoading: isLiveDetailLoading } = useSupervisorStationLiveDetail(
    selectedStation?.id,
  );

  const stationDetail = liveDetail
    ? {
        code: liveDetail.code,
        name: liveDetail.name,
        productName: liveDetail.productName,
        timerLabel: liveDetail.timerLabel,
        standardTimeLabel: liveDetail.standardTimeLabel,
        progress: liveDetail.progress,
        efficiencyStatus: liveDetail.efficiencyStatus,
        exceeded: liveDetail.exceeded,
        phases: liveDetail.phases,
        orderNumber: liveDetail.orderNumber,
        orderId: liveDetail.orderId,
        goalLabel: liveDetail.goalLabel,
        operators: liveDetail.operators,
      }
    : null;

  return (
    <div className={[styles.screen, styles.screenMap].join(' ')}>
      <div className={styles.stickyTop}>
        <header className={styles.pageHeader}>
          <h1>Mapa de planta</h1>
          <p>Monitoreo en tiempo real de estaciones, alarmas y novedades operativas</p>
        </header>

        {data?.kpis?.length ? (
          <section className={[styles.kpiSection, styles.kpiSectionSticky].join(' ')}>
            {data.kpis.map((kpi) => (
              <ProduccionKpiCell key={kpi.label} {...kpi} theme={theme} size="xl" />
            ))}
          </section>
        ) : null}
      </div>

      <div className={styles.scrollBody}>
        {data?.kpis?.length ? (
          <section className={[styles.kpiSection, styles.kpiSectionScroll].join(' ')}>
            {data.kpis.map((kpi) => (
              <ProduccionKpiCell key={kpi.label} {...kpi} theme={theme} size="xl" />
            ))}
          </section>
        ) : null}

        {isLoading ? (
          <InventoryScreenState variant="loading" />
        ) : isError || !data ? (
          <InventoryScreenState variant="error" onRetry={() => void refetch()} />
        ) : (
          <ProduccionPlantMap
            theme={theme}
            size="xl"
            showKpis={false}
            kpis={data.kpis}
            stations={filteredStations}
            alarms={data.alarms}
            news={data.news}
            activeStationCount={data.activeStationCount}
            selectedStationCode={selectedStationCode}
            onStationSelect={(code) =>
              setSelectedStationCode((current) => (current === code ? undefined : code))
            }
            stationDetail={selectedStation ? stationDetail : null}
            stationDetailLoading={Boolean(selectedStation) && isLiveDetailLoading}
            onStationDetailClose={() => setSelectedStationCode(undefined)}
            onViewOrder={
              liveDetail?.orderId
                ? () => navigate(`/produccion/ordenes/${liveDetail.orderId}`)
                : undefined
            }
            stationStatusFilter={statusFilter}
            stationProgressFilter={progressFilter}
            onStationStatusFilterChange={setStatusFilter}
            onStationProgressFilterChange={setProgressFilter}
          />
        )}
      </div>
    </div>
  );
}
