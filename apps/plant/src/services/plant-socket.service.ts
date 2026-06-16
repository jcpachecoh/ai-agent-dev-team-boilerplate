import { io, type Socket } from 'socket.io-client';

export type PlantSocketEvent =
  | 'phase:status_changed'
  | 'alarm:triggered'
  | 'incident:created'
  | 'operator:connected';

export interface PhaseStatusChangedPayload {
  orderId: string;
  phaseId: string;
  stationId: string;
  status: string;
}

export interface AlarmTriggeredPayload {
  stationId: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

type EventHandler = (payload: unknown) => void;

let socket: Socket | null = null;
const handlers = new Map<PlantSocketEvent, Set<EventHandler>>();

function getWsUrl(): string {
  return import.meta.env.VITE_PLANT_WS_URL ?? window.location.origin;
}

export function getPlantSocket(): Socket | null {
  return socket;
}

export function connectPlantSocket(options: {
  stationId: string;
  tenantId?: string;
  token?: string;
}): Socket {
  if (socket?.connected) return socket;

  socket = io(getWsUrl(), {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    auth: {
      stationId: options.stationId,
      tenantId: options.tenantId,
      token: options.token,
    },
    query: { stationId: options.stationId },
  });

  socket.on('connect', () => {
    handlers.forEach((set, event) => {
      set.forEach((handler) => {
        socket?.on(event, handler);
      });
    });
  });

  return socket;
}

export function disconnectPlantSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function onPlantEvent(event: PlantSocketEvent, handler: EventHandler): () => void {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(handler);
  socket?.on(event, handler);
  return () => {
    handlers.get(event)?.delete(handler);
    socket?.off(event, handler);
  };
}

export function emitPlantEvent(event: string, payload: unknown): void {
  socket?.emit(event, payload);
}

/** Test helper */
export function resetPlantSocketForTests(): void {
  disconnectPlantSocket();
  handlers.clear();
}
