import { useEffect, useRef } from 'react';
import {
  connectPlantSocket,
  disconnectPlantSocket,
  onPlantEvent,
  type AlarmTriggeredPayload,
  type PhaseStatusChangedPayload,
  type PlantSocketEvent,
} from '@/services/plant-socket.service';
import { useSessionStore } from '@/stores/session.store';
import { useConnectivityStore } from '@/stores/connectivity.store';

export interface PlantSocketHandlers {
  onPhaseStatusChanged?: (payload: PhaseStatusChangedPayload) => void;
  onAlarmTriggered?: (payload: AlarmTriggeredPayload) => void;
  onIncidentCreated?: (payload: unknown) => void;
  onOperatorConnected?: (payload: unknown) => void;
}

export function usePlantSocket(handlers: PlantSocketHandlers = {}): {
  connected: boolean;
} {
  const stationId = useSessionStore((s) => s.stationId);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const setOnline = useConnectivityStore((s) => s.setOnline);

  useEffect(() => {
    if (!stationId) return;

    const socket = connectPlantSocket({ stationId });

    const cleanups: Array<() => void> = [];

    const bind = <T>(event: PlantSocketEvent, fn?: (p: T) => void) => {
      if (!fn) return;
      cleanups.push(
        onPlantEvent(event, (payload) => {
          fn(payload as T);
        }),
      );
    };

    bind<PhaseStatusChangedPayload>('phase:status_changed', (p) =>
      handlersRef.current.onPhaseStatusChanged?.(p),
    );
    bind<AlarmTriggeredPayload>('alarm:triggered', (p) =>
      handlersRef.current.onAlarmTriggered?.(p),
    );
    bind('incident:created', (p) => handlersRef.current.onIncidentCreated?.(p));
    bind('operator:connected', (p) => handlersRef.current.onOperatorConnected?.(p));

    const onConnect = () => setOnline(true);
    const onDisconnect = () => setOnline(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      cleanups.forEach((c) => c());
      disconnectPlantSocket();
    };
  }, [stationId, setOnline]);

  return { connected: Boolean(stationId) };
}
