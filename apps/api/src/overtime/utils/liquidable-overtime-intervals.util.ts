import { AttendanceEventType, AttendanceMarkingScope } from '@prisma/client';

/**
 * Semi-open interval [start, end) in epoch ms.
 * OS-606 / CONN-04b Task-08 — intersección de marcación OVERTIME con ventanas aprobadas.
 */
export type TimeInterval = {
  startMs: number;
  endMs: number;
};

export type LiquidableOvertimeOrigin = 'AUTOMATIC' | 'ADMINISTRATIVE' | 'BOTH';

export type LiquidableOvertimeSegment = TimeInterval & {
  /** Internal attribution after union (for tests / future reporting). */
  origin: LiquidableOvertimeOrigin;
};

export type ComputeLiquidableOvertimeResult = {
  /** Merged unique liquidable intervals (no double-count). */
  liquidable: TimeInterval[];
  liquidableMinutes: number;
  /** Attribution segments before final merge (may overlap between buckets). */
  fromAutomaticOnly: TimeInterval[];
  fromAdministrativeOnly: TimeInterval[];
  fromBoth: TimeInterval[];
};

type MarkingLogSlice = {
  eventType: AttendanceEventType;
  markingScope?: AttendanceMarkingScope | null;
  timestamp: Date;
  isActive?: boolean | null;
};

function isValidInterval(interval: TimeInterval): boolean {
  return (
    Number.isFinite(interval.startMs) &&
    Number.isFinite(interval.endMs) &&
    interval.endMs > interval.startMs
  );
}

export function intervalMinutes(interval: TimeInterval): number {
  if (!isValidInterval(interval)) {
    return 0;
  }
  return Math.floor((interval.endMs - interval.startMs) / 60_000);
}

export function totalIntervalMinutes(intervals: TimeInterval[]): number {
  return intervals.reduce(
    (sum: number, interval: TimeInterval): number => sum + intervalMinutes(interval),
    0,
  );
}

export function intersectIntervals(a: TimeInterval, b: TimeInterval): TimeInterval | null {
  const startMs = Math.max(a.startMs, b.startMs);
  const endMs = Math.min(a.endMs, b.endMs);
  if (endMs <= startMs) {
    return null;
  }
  return { startMs, endMs };
}

/** Merge overlapping or contiguous [start, end) intervals. */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const valid = intervals
    .filter(isValidInterval)
    .sort((a: TimeInterval, b: TimeInterval): number => a.startMs - b.startMs);
  if (valid.length === 0) {
    return [];
  }

  const first = valid[0];
  if (!first) {
    return [];
  }
  const merged: TimeInterval[] = [{ ...first }];
  for (let i = 1; i < valid.length; i += 1) {
    const current = valid[i];
    const last = merged[merged.length - 1];
    if (!current || !last) {
      continue;
    }
    if (current.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, current.endMs);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

/** marked ∩ (union of windows), then merge. */
export function intersectMarkedWithWindows(
  marked: TimeInterval[],
  windows: TimeInterval[],
): TimeInterval[] {
  if (marked.length === 0 || windows.length === 0) {
    return [];
  }
  const mergedWindows = mergeIntervals(windows);
  const intersections: TimeInterval[] = [];
  for (const mark of marked) {
    for (const window of mergedWindows) {
      const hit = intersectIntervals(mark, window);
      if (hit) {
        intersections.push(hit);
      }
    }
  }
  return mergeIntervals(intersections);
}

/** Timeline set difference: a minus b. */
export function subtractIntervals(a: TimeInterval[], b: TimeInterval[]): TimeInterval[] {
  if (a.length === 0) {
    return [];
  }
  if (b.length === 0) {
    return mergeIntervals(a);
  }

  const blockers = mergeIntervals(b);
  const result: TimeInterval[] = [];

  for (const source of mergeIntervals(a)) {
    let cursor = source.startMs;
    for (const block of blockers) {
      if (block.endMs <= cursor) {
        continue;
      }
      if (block.startMs >= source.endMs) {
        break;
      }
      if (block.startMs > cursor) {
        result.push({ startMs: cursor, endMs: Math.min(block.startMs, source.endMs) });
      }
      cursor = Math.max(cursor, block.endMs);
      if (cursor >= source.endMs) {
        break;
      }
    }
    if (cursor < source.endMs) {
      result.push({ startMs: cursor, endMs: source.endMs });
    }
  }

  return mergeIntervals(result);
}

/**
 * Pair active AttendanceLog rows with markingScope=OVERTIME into [entry, exit) intervals.
 * Reuses CONN-11 pairing semantics (index-aligned ENTRY/EXIT after sort).
 */
export function pairOvertimeMarkingIntervals(logs: MarkingLogSlice[]): TimeInterval[] {
  const scoped = logs
    .filter(
      (log: MarkingLogSlice): boolean =>
        log.isActive !== false &&
        (log.markingScope ?? AttendanceMarkingScope.ORDINARY) === AttendanceMarkingScope.OVERTIME,
    )
    .sort(
      (a: MarkingLogSlice, b: MarkingLogSlice): number =>
        a.timestamp.getTime() - b.timestamp.getTime(),
    );

  const entries = scoped.filter(
    (log: MarkingLogSlice): boolean => log.eventType === AttendanceEventType.ENTRY,
  );
  const exits = scoped.filter(
    (log: MarkingLogSlice): boolean => log.eventType === AttendanceEventType.EXIT,
  );

  const pairs: TimeInterval[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const exit = exits[index];
    if (!entry || !exit) {
      continue;
    }
    const interval = {
      startMs: entry.timestamp.getTime(),
      endMs: exit.timestamp.getTime(),
    };
    if (isValidInterval(interval)) {
      pairs.push(interval);
    }
  }
  return pairs;
}

export function toTimeInterval(start: Date, end: Date): TimeInterval | null {
  const interval = { startMs: start.getTime(), endMs: end.getTime() };
  return isValidInterval(interval) ? interval : null;
}

/**
 * Liquidable overtime intervals:
 * - automaticApproved → all marked OVERTIME intervals are authorized
 * - admin windows → authorize marked ∩ window only
 * - union of authorized sets; overlapping minutes counted once
 */
export function computeLiquidableOvertimeIntervals(params: {
  markedOvertimeIntervals: TimeInterval[];
  automaticApproved: boolean;
  approvedAdminWindows: TimeInterval[];
}): ComputeLiquidableOvertimeResult {
  const marked = mergeIntervals(params.markedOvertimeIntervals);
  const adminAuth = intersectMarkedWithWindows(marked, params.approvedAdminWindows);
  const autoAuth = params.automaticApproved ? marked : [];

  const fromBoth = intersectMarkedWithWindows(autoAuth, adminAuth);
  const fromAutomaticOnly = subtractIntervals(autoAuth, adminAuth);
  const fromAdministrativeOnly = subtractIntervals(adminAuth, autoAuth);
  const liquidable = mergeIntervals([...autoAuth, ...adminAuth]);

  return {
    liquidable,
    liquidableMinutes: totalIntervalMinutes(liquidable),
    fromAutomaticOnly,
    fromAdministrativeOnly,
    fromBoth,
  };
}
