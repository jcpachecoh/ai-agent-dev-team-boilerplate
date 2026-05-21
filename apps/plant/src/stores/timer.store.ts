import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerSnapshot {
  status: TimerStatus;
  elapsedMs: number;
  startedAt: number | null;
  lastTickAt: number | null;
}

interface TimerState extends TimerSnapshot {
  intervalId: ReturnType<typeof setInterval> | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
  hydrate: () => void;
  persist: () => void;
}

const TICK_MS = 1000;
const STORAGE_KEY = STORAGE_KEYS.timer;

function loadSnapshot(): TimerSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { status: 'idle', elapsedMs: 0, startedAt: null, lastTickAt: null };
    }
    const parsed = JSON.parse(raw) as TimerSnapshot;
    return {
      status: parsed.status === 'running' ? 'paused' : parsed.status,
      elapsedMs: parsed.elapsedMs ?? 0,
      startedAt: parsed.startedAt ?? null,
      lastTickAt: parsed.lastTickAt ?? null,
    };
  } catch {
    return { status: 'idle', elapsedMs: 0, startedAt: null, lastTickAt: null };
  }
}

function saveSnapshot(snapshot: TimerSnapshot): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export const useTimerStore = create<TimerState>((set, get) => ({
  ...loadSnapshot(),
  intervalId: null,

  start: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    const now = Date.now();
    const id = setInterval(() => get().tick(), TICK_MS);
    set({
      status: 'running',
      startedAt: now,
      lastTickAt: now,
      intervalId: id,
    });
    get().persist();
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ status: 'paused', intervalId: null });
    get().persist();
  },

  resume: () => {
    const { status, intervalId } = get();
    if (status !== 'paused' || intervalId) return;
    const now = Date.now();
    const id = setInterval(() => get().tick(), TICK_MS);
    set({ status: 'running', lastTickAt: now, intervalId: id });
    get().persist();
  },

  reset: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({
      status: 'idle',
      elapsedMs: 0,
      startedAt: null,
      lastTickAt: null,
      intervalId: null,
    });
    get().persist();
  },

  tick: () => {
    const { status, elapsedMs, lastTickAt } = get();
    if (status !== 'running') return;
    const now = Date.now();
    const delta = lastTickAt ? now - lastTickAt : TICK_MS;
    set({ elapsedMs: elapsedMs + delta, lastTickAt: now });
    get().persist();
  },

  hydrate: () => {
    const snapshot = loadSnapshot();
    set({ ...snapshot, intervalId: null });
  },

  persist: () => {
    const { status, elapsedMs, startedAt, lastTickAt } = get();
    saveSnapshot({ status, elapsedMs, startedAt, lastTickAt });
  },
}));

export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
