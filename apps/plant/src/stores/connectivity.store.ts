import { create } from 'zustand';

const PING_INTERVAL_MS = 10_000;
const MAX_BACKOFF_MS = 60_000;

let pingTimer: ReturnType<typeof setInterval> | null = null;
let backoffMs = PING_INTERVAL_MS;

function getHealthUrl(): string {
  const base = import.meta.env.VITE_PLANT_API_URL ?? '';
  if (!base) return '/api';
  return `${base.replace(/\/$/, '')}/api`;
}

interface ConnectivityState {
  isOnline: boolean;
  lastPingAt: number | null;
  latencyMs: number | null;
  syncQueueCount: number;
  setSyncQueueCount: (count: number) => void;
  setOnline: (online: boolean) => void;
  ping: () => Promise<boolean>;
  startPingLoop: () => void;
  stopPingLoop: () => void;
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastPingAt: null,
  latencyMs: null,
  syncQueueCount: 0,

  setSyncQueueCount: (count) => set({ syncQueueCount: count }),

  setOnline: (online) => set({ isOnline: online }),

  ping: async () => {
    if (!navigator.onLine) {
      set({ isOnline: false });
      return false;
    }
    const started = Date.now();
    try {
      const res = await fetch(getHealthUrl(), {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const ok = res.ok;
      if (ok) {
        backoffMs = PING_INTERVAL_MS;
        set({
          isOnline: true,
          lastPingAt: Date.now(),
          latencyMs: Date.now() - started,
        });
      } else {
        set({ isOnline: false });
      }
      return ok;
    } catch {
      set({ isOnline: false });
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      return false;
    }
  },

  startPingLoop: () => {
    if (pingTimer) return;
    const run = async () => {
      await get().ping();
    };
    void run();
    pingTimer = setInterval(() => void run(), PING_INTERVAL_MS);

    const onOnline = () => {
      backoffMs = PING_INTERVAL_MS;
      set({ isOnline: true });
      void get().ping();
    };
    const onOffline = () => set({ isOnline: false });
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  },

  stopPingLoop: () => {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  },
}));

export function getPingBackoffMs(): number {
  return backoffMs;
}
