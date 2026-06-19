import { PlantDashboardHeader, PlantLayoutModeFab } from '@restopsiq/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { usePlantSocket } from '@/hooks/usePlantSocket';
import { useAvailableProductionOrders } from '@/hooks/useAvailableProductionOrders';
import type { PhaseStatusChangedPayload } from '@/services/plant-socket.service';
import { computeStatusCounts, useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useSessionStore } from '@/stores/session.store';

import styles from './ActivePhaseScreen.module.scss';
import { OrderAssignModalHost } from './components/OrderAssignModalHost';
import { RecipeDetailHost } from './components/RecipeDetailHost';
import { WorkstationCellView } from './components/WorkstationCell';
import { WorkstationGrid } from './components/WorkstationGrid';

export interface ActivePhaseScreenProps {
  onCompletePhase?: () => void;
  onReportIssue?: () => void;
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
  onCompletePhase,
  onReportIssue,
  onLogout,
  isLoggingOut = false,
  onChangeLocation,
  activeLocationName,
}: ActivePhaseScreenProps): React.JSX.Element {
  const operatorName = useSessionStore((s) => s.operator?.operatorName);
  const layoutMode = useDashboardLayoutStore((s) => s.layoutMode);
  const cells = useDashboardLayoutStore((s) => s.cells);
  const setLayoutMode = useDashboardLayoutStore((s) => s.setLayoutMode);
  const updateCellStatus = useDashboardLayoutStore((s) => s.updateCellStatus);
  const hydrateFromPreferences = useDashboardLayoutStore((s) => s.hydrateFromPreferences);

  const [clock, setClock] = useState(() => new Date());
  const [assignModalCell, setAssignModalCell] = useState<number | null>(null);
  const [recipeDetailCell, setRecipeDetailCell] = useState<number | null>(null);

  useAvailableProductionOrders(true);

  const statusCounts = useMemo(() => computeStatusCounts(cells), [cells]);

  const handlePhaseStatusChanged = useCallback(
    (payload: PhaseStatusChangedPayload) => {
      const mapped = mapSocketStatus(payload.status);
      if (!mapped || !payload.orderId) return;
      updateCellStatus(payload.orderId, mapped);
    },
    [updateCellStatus],
  );

  usePlantSocket({ onPhaseStatusChanged: handlePhaseStatusChanged });

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

  if (recipeDetailCell !== null) {
    return (
      <div className={styles.recipeScreen} data-testid="recipe-detail-screen">
        <RecipeDetailHost
          cellIndex={recipeDetailCell}
          operatorName={operatorName ?? 'Operador'}
          onBack={closeRecipeDetail}
          onReportIssue={onReportIssue}
        />
      </div>
    );
  }

  return (
    <div className={styles.screen} data-testid="active-phase-screen">
      <PlantDashboardHeader
        statusCounts={statusCounts}
        operatorName={operatorName ?? 'Operador'}
        locationName={activeLocationName}
        onChangeLocation={onChangeLocation}
        clockTime={formatClockTime(clock)}
        clockSeconds={formatClockSeconds(clock)}
        isOnline
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      <WorkstationGrid layoutMode={layoutMode}>
        {cells.map((cell) => (
          <WorkstationCellView
            key={cell.cellIndex}
            cell={cell}
            layoutMode={layoutMode}
            onAssign={openAssignModal}
            onChangeOrder={openAssignModal}
            onViewRecipe={openRecipeDetail}
            onReportIssue={onReportIssue}
          />
        ))}
      </WorkstationGrid>

      <PlantLayoutModeFab layoutMode={layoutMode} onLayoutModeChange={setLayoutMode} />

      <OrderAssignModalHost
        open={assignModalCell !== null}
        cellIndex={assignModalCell}
        onClose={closeAssignModal}
      />
    </div>
  );
}

export default ActivePhaseScreen;
