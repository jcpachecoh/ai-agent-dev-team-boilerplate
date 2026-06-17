import { idbGet, idbSet } from '@/utils/storage';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { useConnectivityStore } from '@/stores/connectivity.store';

export type OfflineQueueType = 'incident.create' | 'phase.complete';

export interface OfflineQueueItem {
  id: string;
  type: OfflineQueueType;
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  idempotencyKey: string;
  imageBase64?: string;
}

const QUEUE_KEY = STORAGE_KEYS.offlineQueue;
const MAX_RETRIES = 5;

async function loadQueue(): Promise<OfflineQueueItem[]> {
  return (await idbGet<OfflineQueueItem[]>(QUEUE_KEY)) ?? [];
}

async function saveQueue(items: OfflineQueueItem[]): Promise<void> {
  await idbSet(QUEUE_KEY, items);
  useConnectivityStore.getState().setSyncQueueCount(items.length);
}

export async function getQueueLength(): Promise<number> {
  const items = await loadQueue();
  return items.length;
}

export async function enqueue(
  item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'retryCount'>,
): Promise<OfflineQueueItem> {
  const queue = await loadQueue();
  const duplicate = queue.find((q) => q.idempotencyKey === item.idempotencyKey);
  if (duplicate) return duplicate;

  const entry: OfflineQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retryCount: 0,
  };
  queue.push(entry);
  await saveQueue(queue);
  return entry;
}

export async function listQueue(): Promise<OfflineQueueItem[]> {
  return loadQueue();
}

async function submitItem(item: OfflineQueueItem): Promise<boolean> {
  const base = import.meta.env.VITE_PLANT_API_URL?.replace(/\/$/, '') ?? '';
  const path =
    item.type === 'incident.create' ? '/api/plant/incidents' : '/api/plant/phases/complete';
  const url = base ? `${base}${path}` : path;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': item.idempotencyKey,
    },
    body: JSON.stringify(item.payload),
  });
  return res.ok;
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  const { isOnline, ping } = useConnectivityStore.getState();
  if (!isOnline) return { synced: 0, failed: 0 };

  const reachable = await ping();
  if (!reachable) return { synced: 0, failed: 0 };

  let queue = await loadQueue();
  let synced = 0;
  let failed = 0;
  const remaining: OfflineQueueItem[] = [];

  for (const item of queue) {
    try {
      const ok = await submitItem(item);
      if (ok) {
        synced += 1;
      } else {
        failed += 1;
        const next = { ...item, retryCount: item.retryCount + 1 };
        if (next.retryCount < MAX_RETRIES) remaining.push(next);
      }
    } catch {
      failed += 1;
      const next = { ...item, retryCount: item.retryCount + 1 };
      if (next.retryCount < MAX_RETRIES) remaining.push(next);
    }
  }

  queue = remaining;
  await saveQueue(queue);
  return { synced, failed };
}

/** Compress incident photo before queue — max width 1280, JPEG quality 0.7 */
export async function compressImageBase64(dataUrl: string, maxWidth = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

let flushListenerBound = false;

export function bindQueueFlushOnReconnect(): void {
  if (flushListenerBound) return;
  flushListenerBound = true;

  window.addEventListener('online', () => {
    void flushQueue();
  });

  const unsub = useConnectivityStore.subscribe((state, prev) => {
    if (state.isOnline && !prev.isOnline) {
      void flushQueue();
    }
  });
  void unsub;
}
