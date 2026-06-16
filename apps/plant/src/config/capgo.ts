import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { isNativePlatform } from '@/utils/platform';

/**
 * Capgo live updates — channel from VITE_CAPGO_CHANNEL (staging | production).
 * Upload bundles via CI; see apps/plant/README.md.
 */
export async function initCapgo(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await CapacitorUpdater.notifyAppReady();
  } catch (err) {
    console.warn('[capgo] notifyAppReady failed', err);
  }
}

export function getCapgoChannel(): string {
  return import.meta.env.VITE_CAPGO_CHANNEL ?? 'staging';
}
