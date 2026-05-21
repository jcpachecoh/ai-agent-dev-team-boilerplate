import { useEffect, useState } from 'react';
import { bootstrapPlantApp, type BootstrapResult } from '@/bootstrap';
import { useSessionStore } from '@/stores/session.store';
import { useConnectivityStore } from '@/stores/connectivity.store';
import { useTimerStore, formatElapsed } from '@/stores/timer.store';
import { usePlantSocket } from '@/hooks/usePlantSocket';
import { useWakeLock } from '@/hooks/useWakeLock';

/**
 * Minimal dev shell until operator/supervisor screens (tasks 03, 10–12).
 */
export function App() {
  const [boot, setBoot] = useState<BootstrapResult | null>(null);
  const stationId = useSessionStore((s) => s.stationId);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const syncQueueCount = useConnectivityStore((s) => s.syncQueueCount);
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const timerStatus = useTimerStore((s) => s.status);

  useWakeLock();
  usePlantSocket();

  useEffect(() => {
    void bootstrapPlantApp().then(setBoot);
  }, []);

  if (!boot) {
    return (
      <div className="screen-operator app-shell">
        <p className="app-shell__meta">Iniciando Plant KDS…</p>
      </div>
    );
  }

  return (
    <div className="screen-operator app-shell">
      <h1 className="app-shell__title">RestOpsIQ Plant KDS</h1>
      <p className="app-shell__meta">
        Estación: {stationId ?? '—'} {boot.needsSetup ? '(requiere configuración)' : ''}
      </p>
      <p className="app-shell__meta">
        Red: {isOnline ? 'en línea' : 'sin conexión'} · Cola: {syncQueueCount}
      </p>
      <p className="app-shell__meta">
        Cronómetro ({timerStatus}): {formatElapsed(elapsedMs)}
      </p>
    </div>
  );
}
