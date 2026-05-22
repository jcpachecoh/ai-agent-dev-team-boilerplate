import { Preferences } from '@capacitor/preferences';
import { PREFERENCES_KEYS, STORAGE_KEYS } from '@/constants/storage-keys';
import { isNativePlatform } from '@/utils/platform';

const STATION_ID_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,31}$/i;

export interface StationQrPayload {
  stationId: string;
}

export function normalizeStationId(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidStationId(value: string): boolean {
  return STATION_ID_PATTERN.test(normalizeStationId(value));
}

export function parseStationQrPayload(raw: string): StationQrPayload | null {
  try {
    const data = JSON.parse(raw) as StationQrPayload;
    if (data?.stationId && isValidStationId(data.stationId)) {
      return { stationId: normalizeStationId(data.stationId) };
    }
    return null;
  } catch {
    const trimmed = raw.trim();
    if (isValidStationId(trimmed)) {
      return { stationId: normalizeStationId(trimmed) };
    }
    return null;
  }
}

/** Install-time: ?stationId=EST-02 or #stationId=EST-02 */
export function parseStationIdFromLaunchUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const fromQuery = parsed.searchParams.get('stationId');
    if (fromQuery && isValidStationId(fromQuery)) {
      return normalizeStationId(fromQuery);
    }
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    const fromHash = hashParams.get('stationId');
    if (fromHash && isValidStationId(fromHash)) {
      return normalizeStationId(fromHash);
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function readNative(): Promise<string | null> {
  const { value } = await Preferences.get({ key: PREFERENCES_KEYS.stationId });
  return value;
}

async function writeNative(stationId: string): Promise<void> {
  await Preferences.set({ key: PREFERENCES_KEYS.stationId, value: stationId });
}

async function removeNative(): Promise<void> {
  await Preferences.remove({ key: PREFERENCES_KEYS.stationId });
}

export async function getStationId(): Promise<string | null> {
  if (isNativePlatform()) {
    const native = await readNative();
    if (native) return normalizeStationId(native);
  }
  const web = localStorage.getItem(STORAGE_KEYS.stationId);
  return web ? normalizeStationId(web) : null;
}

export async function setStationId(stationId: string): Promise<void> {
  const normalized = normalizeStationId(stationId);
  if (!isValidStationId(normalized)) {
    throw new Error(`Invalid stationId: ${stationId}`);
  }
  if (isNativePlatform()) {
    await writeNative(normalized);
  }
  localStorage.setItem(STORAGE_KEYS.stationId, normalized);
}

export async function clearStationId(): Promise<void> {
  if (isNativePlatform()) {
    await removeNative();
  }
  localStorage.removeItem(STORAGE_KEYS.stationId);
}

export async function applyLaunchStationId(): Promise<string | null> {
  const fromUrl = parseStationIdFromLaunchUrl(window.location.href);
  if (fromUrl) {
    await setStationId(fromUrl);
    return fromUrl;
  }
  return getStationId();
}

export async function hydrateStationSession(
  setStationIdStore: (id: string) => void,
): Promise<{ stationId: string | null; needsSetup: boolean }> {
  const fromLaunch = await applyLaunchStationId();
  if (fromLaunch) {
    setStationIdStore(fromLaunch);
    return { stationId: fromLaunch, needsSetup: false };
  }
  const existing = await getStationId();
  if (existing) {
    setStationIdStore(existing);
    return { stationId: existing, needsSetup: false };
  }

  const demoStationId = import.meta.env.VITE_DEMO_STATION_ID ?? 'EST-02';
  if (import.meta.env.DEV && isValidStationId(demoStationId)) {
    const normalized = normalizeStationId(demoStationId);
    await setStationId(normalized);
    setStationIdStore(normalized);
    return { stationId: normalized, needsSetup: false };
  }

  return { stationId: null, needsSetup: true };
}
