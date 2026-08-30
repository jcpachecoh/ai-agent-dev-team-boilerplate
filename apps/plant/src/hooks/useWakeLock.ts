import { useEffect } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { isNativePlatform } from '@/utils/platform';
import { useSessionStore } from '@/stores/session.store';

/**
 * Keeps screen on during active operator session (native tablets only).
 */
export function useWakeLock(): void {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isNativePlatform()) return;

    const sync = async () => {
      try {
        if (isAuthenticated) {
          await KeepAwake.keepAwake();
        } else {
          await KeepAwake.allowSleep();
        }
      } catch (err) {
        console.warn('[wake-lock]', err);
      }
    };

    void sync();

    return () => {
      void KeepAwake.allowSleep();
    };
  }, [isAuthenticated]);
}
