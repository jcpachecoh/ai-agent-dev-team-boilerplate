import { type JSX } from 'react';

import type { PlantUiTheme } from '@/constants/theme';

import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';

import { IncidentReportModal } from './IncidentReportModal';

export interface IncidentReportModalHostProps {
  open: boolean;
  cellIndex: number | null;
  theme?: PlantUiTheme;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function IncidentReportModalHost({
  open,
  cellIndex,
  theme = 'dark',
  onClose,
  onSubmitted,
}: IncidentReportModalHostProps): JSX.Element | null {
  const cell =
    useDashboardLayoutStore((s) =>
      cellIndex === null ? null : s.cells.find((item) => item.cellIndex === cellIndex),
    ) ?? null;

  if (cellIndex === null || !cell) {
    return null;
  }

  const workStationId = cell.snapshot?.workStationId ?? cell.snapshot?.stationId;
  if (!workStationId) {
    return null;
  }

  return (
    <IncidentReportModal
      open={open}
      theme={theme}
      workStationId={workStationId}
      orderId={cell.orderId ?? undefined}
      executionId={undefined}
      orderLabel={cell.snapshot?.orderNumber ?? cell.snapshot?.productName}
      onClose={onClose}
      onSubmitted={onSubmitted}
    />
  );
}

export default IncidentReportModalHost;
