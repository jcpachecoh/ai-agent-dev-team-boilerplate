import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { PlantDashboardHeader, PlantLayoutModeFab } from '@restopsiq/ui';

import { usePlantSocket } from '@/hooks/usePlantSocket';
import { orderRecipeQueryKey } from '@/hooks/useOrderRecipe';
import { useAvailableProductionOrders } from '@/hooks/useAvailableProductionOrders';
import { toFieldOpsTheme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import type { PhaseStatusChangedPayload } from '@/services/plant-socket.service';
import { computeStatusCounts, useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useConnectivityStore } from '@/stores/connectivity.store';
import { useSessionStore } from '@/stores/session.store';
import { isNativePlatform } from '@/utils/platform';

import styles from './ActivePhaseScreen.module.scss';
import { BluetoothDiagnosticModal } from './components/BluetoothDiagnosticModal';
import { IncidentReportModalHost } from './components/IncidentReportModalHost';
import { OrderAssignModalHost } from './components/OrderAssignModalHost';
import { RecipeDetailHost } from './components/RecipeDetailHost';
import { WorkstationCellView } from './components/WorkstationCell';
import { WorkstationGrid } from './components/WorkstationGrid';

export interface ActivePhaseScreenProps {
  onCompletePhase?: () => void;
  onReportIssue?: (cellIndex: number) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
  onChangeLocation?: () => void;
  activeLocationName?: string;
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function formatClockSeconds(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function mapSocketStatus(status: string): 'in_progress' | 'paused' | 'pending' | 'incident' | null {
  if (status === 'in_progress' || status === 'running') return 'in_progress';
  if (status === 'paused') return 'paused';
  if (status === 'pending' || status === 'assigned') return 'pending';
  if (status === 'incident' || status === 'novedad') return 'incident';
  return null;
}

export function ActivePhaseScreen({
  onCompletePhase: _onCompletePhase,
  onReportIssue: externalOnReportIssue,
  onLogout,
  isLoggingOut = false,
  onChangeLocation,
  activeLocationName,
}: ActivePhaseScreenProps): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const fieldOpsTheme = toFieldOpsTheme(theme);
  const operatorName = useSessionStore((s) => s.operator?.operatorName);
  const operatorRole = useSessionStore((s) => s.operator?.role ?? 'OPERATOR');
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const layoutMode = useDashboardLayoutStore((s) => s.layoutMode);
  const cells = useDashboardLayoutStore((s) => s.cells);
  const setLayoutMode = useDashboardLayoutStore((s) => s.setLayoutMode);
  const updateCellStatus = useDashboardLayoutStore((s) => s.updateCellStatus);
  const updateCellStatusByIndex = useDashboardLayoutStore((s) => s.updateCellStatusByIndex);
  const hydrateFromPreferences = useDashboardLayoutStore((s) => s.hydrateFromPreferences);
  const queryClient = useQueryClient();

  const [clock, setClock] = useState(() => new Date());
  const [assignModalCell, setAssignModalCell] = useState<number | null>(null);
  const [recipeDetailCell, setRecipeDetailCell] = useState<number | null>(null);
  const [incidentModalCell, setIncidentModalCell] = useState<number | null>(null);
  const [bleDiagnosticOpen, setBleDiagnosticOpen] = useState(false);
  const [noveltiesRefreshKey, setNoveltiesRefreshKey] = useState(0);

  useAvailableProductionOrders(true);

  const statusCounts = useMemo(() => computeStatusCounts(cells), [cells]);

  const handlePhaseStatusChanged = useCallback(
    (payload: PhaseStatusChangedPayload) => {
      const mapped = mapSocketStatus(payload.status);
      if (!mapped || !payload.orderId) return;
      updateCellStatus(payload.orderId, mapped);
      void queryClient.refetchQueries({ queryKey: orderRecipeQueryKey(payload.orderId) });
    },
    [queryClient, updateCellStatus],
  );

  useEffect(() => {
    void hydrateFromPreferences();
  }, [hydrateFromPreferences]);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const openAssignModal = useCallback((cellIndex: number) => {
    setAssignModalCell(cellIndex);
  }, []);

  const closeAssignModal = useCallback(() => {
    setAssignModalCell(null);
  }, []);

  const openRecipeDetail = useCallback((cellIndex: number) => {
    setRecipeDetailCell(cellIndex);
  }, []);

  const closeRecipeDetail = useCallback(() => {
    setRecipeDetailCell(null);
  }, []);

  const openIncidentModal = useCallback(
    (cellIndex: number) => {
      setIncidentModalCell(cellIndex);
      externalOnReportIssue?.(cellIndex);
    },
    [externalOnReportIssue],
  );

  const closeIncidentModal = useCallback(() => {
    setIncidentModalCell(null);
  }, []);

  const handleIncidentSubmitted = useCallback(() => {
    setNoveltiesRefreshKey((value) => value + 1);
    if (incidentModalCell === null) return;
    const cell = cells.find((item) => item.cellIndex === incidentModalCell);
    if (cell?.orderId) {
      updateCellStatus(cell.orderId, 'incident');
      return;
    }
    updateCellStatusByIndex(incidentModalCell, 'incident');
  }, [cells, incidentModalCell, updateCellStatus, updateCellStatusByIndex]);

  const handleIncidentCreated = useCallback(
    (payload: unknown) => {
      const orderId =
        payload && typeof payload === 'object' && 'orderId' in payload
          ? String((payload as { orderId?: string | null }).orderId ?? '')
          : '';
      if (!orderId) return;

      const isVisible = cells.some((cell) => cell.orderId === orderId);
      if (!isVisible) return;

      updateCellStatus(orderId, 'incident');
      setNoveltiesRefreshKey((value) => value + 1);
    },
    [cells, updateCellStatus],
  );

  usePlantSocket({
    onPhaseStatusChanged: handlePhaseStatusChanged,
    onIncidentCreated: handleIncidentCreated,
  });

  if (recipeDetailCell !== null) {
    return (
      <div className={styles.recipeScreen} data-testid="recipe-detail-screen">
        <RecipeDetailHost
          cellIndex={recipeDetailCell}
          operatorName={operatorName ?? 'Operador'}
          theme={fieldOpsTheme}
          onBack={closeRecipeDetail}
          onReportIssue={openIncidentModal}
        />
        <IncidentReportModalHost
          open={incidentModalCell !== null}
          cellIndex={incidentModalCell}
          onClose={closeIncidentModal}
          onSubmitted={handleIncidentSubmitted}
        />
      </div>
    );
  }

  return (
    <div className={styles.screen} data-testid="active-phase-screen">
      <PlantDashboardHeader
        theme={fieldOpsTheme}
        statusCounts={statusCounts}
        operatorName={operatorName ?? 'Operador'}
        operatorRole={operatorRole}
        locationName={activeLocationName}
        onChangeLocation={onChangeLocation}
        clockTime={formatClockTime(clock)}
        clockSeconds={formatClockSeconds(clock)}
        isOnline={isOnline}
        onToggleTheme={toggleTheme}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      {isNativePlatform() ? (
        <div className={styles.nativeTools}>
          <button
            type="button"
            className={styles.nativeToolButton}
            onClick={() => setBleDiagnosticOpen(true)}
            data-testid="ble-diagnostic-button"
          >
            Bluetooth
          </button>
        </div>
      ) : null}

      <WorkstationGrid layoutMode={layoutMode}>
        {cells.map((cell) => (
          <WorkstationCellView
            key={cell.cellIndex}
            cell={cell}
            layoutMode={layoutMode}
            theme={fieldOpsTheme}
            noveltiesRefreshKey={noveltiesRefreshKey}
            onAssign={openAssignModal}
            onChangeOrder={openAssignModal}
            onViewRecipe={openRecipeDetail}
            onReportIssue={openIncidentModal}
          />
        ))}
      </WorkstationGrid>

      <PlantLayoutModeFab
        theme={fieldOpsTheme}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />

      <OrderAssignModalHost
        open={assignModalCell !== null}
        cellIndex={assignModalCell}
        theme={fieldOpsTheme}
        onClose={closeAssignModal}
      />

      <IncidentReportModalHost
        open={incidentModalCell !== null}
        cellIndex={incidentModalCell}
        theme={fieldOpsTheme}
        onClose={closeIncidentModal}
        onSubmitted={handleIncidentSubmitted}
      />

      <BluetoothDiagnosticModal
        open={bleDiagnosticOpen}
        onClose={() => setBleDiagnosticOpen(false)}
      />
    </div>
  );
}

export default ActivePhaseScreen;
