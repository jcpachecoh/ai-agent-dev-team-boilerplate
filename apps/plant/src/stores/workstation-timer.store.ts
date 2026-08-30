import { create } from 'zustand';

export type WorkstationTimerStatus = 'idle' | 'running' | 'paused';

export interface WorkstationTimerSlice {
  status: WorkstationTimerStatus;
  elapsedMs: number;
  intervalId: ReturnType<typeof setInterval> | null;
}

type WorkstationTimersState = {
  timers: Record<number, WorkstationTimerSlice>;
  ensureTimer: (cellIndex: number, initialElapsedMs?: number) => void;
  startTimer: (cellIndex: number) => void;
  pauseTimer: (cellIndex: number) => void;
  resumeTimer: (cellIndex: number) => void;
  resetTimer: (cellIndex: number) => void;
  clearTimer: (cellIndex: number) => void;
  tick: (cellIndex: number) => void;
  getElapsedMs: (cellIndex: number) => number;
  isRunning: (cellIndex: number) => boolean;
};

const TICK_MS = 1000;

function emptySlice(): WorkstationTimerSlice {
  return { status: 'idle', elapsedMs: 0, intervalId: null };
}

function clearIntervalFor(slice: WorkstationTimerSlice): WorkstationTimerSlice {
  if (slice.intervalId) clearInterval(slice.intervalId);
  return { ...slice, intervalId: null };
}

export const useWorkstationTimerStore = create<WorkstationTimersState>((set, get) => ({
  timers: {},

  ensureTimer: (cellIndex, initialElapsedMs = 0) => {
    const existing = get().timers[cellIndex];
    if (existing) return;
    set((state) => ({
      timers: {
        ...state.timers,
        [cellIndex]: {
          status: 'idle',
          elapsedMs: initialElapsedMs,
          intervalId: null,
        },
      },
    }));
  },

  startTimer: (cellIndex) => {
    set((state) => {
      const current = state.timers[cellIndex] ?? emptySlice();
      const cleared = clearIntervalFor(current);
      const intervalId = setInterval(() => get().tick(cellIndex), TICK_MS);
      return {
        timers: {
          ...state.timers,
          [cellIndex]: {
            ...cleared,
            status: 'running',
            intervalId,
          },
        },
      };
    });
  },

  pauseTimer: (cellIndex) => {
    set((state) => {
      const current = state.timers[cellIndex];
      if (!current) return state;
      const cleared = clearIntervalFor(current);
      return {
        timers: {
          ...state.timers,
          [cellIndex]: { ...cleared, status: 'paused' },
        },
      };
    });
  },

  resumeTimer: (cellIndex) => {
    const current = get().timers[cellIndex];
    if (!current || current.status !== 'paused' || current.intervalId) return;
    get().startTimer(cellIndex);
  },

  resetTimer: (cellIndex) => {
    set((state) => {
      const current = state.timers[cellIndex];
      if (!current) return state;
      const cleared = clearIntervalFor(current);
      return {
        timers: {
          ...state.timers,
          [cellIndex]: { status: 'idle', elapsedMs: 0, intervalId: null },
        },
      };
    });
  },

  clearTimer: (cellIndex) => {
    set((state) => {
      const current = state.timers[cellIndex];
      if (!current) return state;
      clearIntervalFor(current);
      const { [cellIndex]: _removed, ...rest } = state.timers;
      return { timers: rest };
    });
  },

  tick: (cellIndex) => {
    set((state) => {
      const current = state.timers[cellIndex];
      if (!current || current.status !== 'running') return state;
      return {
        timers: {
          ...state.timers,
          [cellIndex]: {
            ...current,
            elapsedMs: current.elapsedMs + TICK_MS,
          },
        },
      };
    });
  },

  getElapsedMs: (cellIndex) => get().timers[cellIndex]?.elapsedMs ?? 0,

  isRunning: (cellIndex) => get().timers[cellIndex]?.status === 'running',
}));
