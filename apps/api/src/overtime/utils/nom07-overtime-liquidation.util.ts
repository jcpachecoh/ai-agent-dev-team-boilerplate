import {
  OvertimeStatus as OvertimeStatusEnum,
  type AttendanceLog,
  type OvertimeStatus,
} from '@prisma/client';

import {
  computeLiquidableOvertimeIntervals,
  pairOvertimeMarkingIntervals,
  toTimeInterval,
  totalIntervalMinutes,
  type ComputeLiquidableOvertimeResult,
  type TimeInterval,
} from './liquidable-overtime-intervals.util';
import type { ApprovedAdministrativeOvertimeWindow } from '../interfaces/overtime.interfaces';

export type Nom07OvertimeLiquidationInput = {
  logs: Array<
    Pick<AttendanceLog, 'eventType' | 'timestamp' | 'isActive'> & {
      markingScope?: AttendanceLog['markingScope'] | null;
    }
  >;
  automaticStatus: OvertimeStatus | null | undefined;
  approvedAdminWindows: ApprovedAdministrativeOvertimeWindow[];
};

export type Nom07OvertimeLiquidationDecision = {
  /** True when CONN-11 OVERTIME pairs exist for the employee/period. */
  hasMarkedOvertimePairs: boolean;
  automaticApproved: boolean;
  /** Use legacy total−480 summary when auto APROBADA and no OVERTIME pairs (CONN-04a). */
  useLegacyAutomaticSummary: boolean;
  /** Zero all overtime (no auto approval and no admin liquidable minutes). */
  zeroOvertime: boolean;
  computation: ComputeLiquidableOvertimeResult;
  adminWindowCount: number;
};

export function resolveAdminWindows(
  windows: ApprovedAdministrativeOvertimeWindow[],
): TimeInterval[] {
  const intervals: TimeInterval[] = [];
  for (const window of windows) {
    const interval = toTimeInterval(window.proposedStartTime, window.proposedEndTime);
    if (interval) {
      intervals.push(interval);
    }
  }
  return intervals;
}

/**
 * Decide how NOM-07 should liquidate overtime for one employee/period.
 * Does not classify surcharges — reports rebuild OvertimeMinutesEntry from intervals.
 */
export function decideNom07OvertimeLiquidation(
  input: Nom07OvertimeLiquidationInput,
): Nom07OvertimeLiquidationDecision {
  const marked = pairOvertimeMarkingIntervals(input.logs);
  const automaticApproved = input.automaticStatus === OvertimeStatusEnum.APROBADA;
  const adminWindows = resolveAdminWindows(input.approvedAdminWindows);
  const computation = computeLiquidableOvertimeIntervals({
    markedOvertimeIntervals: marked,
    automaticApproved,
    approvedAdminWindows: adminWindows,
  });

  const hasMarkedOvertimePairs = marked.length > 0;
  const useLegacyAutomaticSummary = automaticApproved && !hasMarkedOvertimePairs;
  const zeroOvertime =
    !useLegacyAutomaticSummary && totalIntervalMinutes(computation.liquidable) === 0;

  return {
    hasMarkedOvertimePairs,
    automaticApproved,
    useLegacyAutomaticSummary,
    zeroOvertime,
    computation,
    adminWindowCount: adminWindows.length,
  };
}
