import { create } from 'zustand';

import { STORAGE_KEYS } from '@/constants/storage-keys';

export interface AssignedLocation {
  id: string;
  name: string;
  code: string | null;
  city?: string | null;
  address?: string | null;
}

export interface OperatorSession {
  operatorId: string;
  operatorName: string;
  accessToken: string;
  refreshToken?: string;
  role: 'OWNER' | 'SUPERVISOR' | 'MANAGER' | 'OPERATOR';
  tenantId: string;
  locationId?: string | null;
  assignedLocations: AssignedLocation[];
  requiresLocationSelection: boolean;
}

interface SessionState {
  stationId: string | null;
  operator: OperatorSession | null;
  isAuthenticated: boolean;
  sessionStartedAt: number | null;
  setStationId: (stationId: string) => void;
  clearStationId: () => void;
  login: (operator: OperatorSession) => void;
  setAssignedLocations: (locations: AssignedLocation[]) => void;
  setActiveLocation: (
    locationId: string,
    tokens?: { accessToken: string; refreshToken?: string },
  ) => void;
  getActiveLocation: () => AssignedLocation | null;
  canOperate: () => boolean;
  logout: () => void;
}

function readPersistedLocationId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.activeLocationId);
}

function persistActiveLocationId(locationId: string | null): void {
  if (typeof window === 'undefined') return;
  if (locationId) {
    localStorage.setItem(STORAGE_KEYS.activeLocationId, locationId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeLocationId);
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  stationId: null,
  operator: null,
  isAuthenticated: false,
  sessionStartedAt: null,

  setStationId: (stationId) => set({ stationId }),

  clearStationId: () => set({ stationId: null }),

  login: (operator) => {
    const persistedLocationId = readPersistedLocationId();
    const resolvedLocationId =
      operator.locationId ??
      (operator.assignedLocations.length === 1
        ? (operator.assignedLocations[0]?.id ?? null)
        : null) ??
      (persistedLocationId &&
      operator.assignedLocations.some((location) => location.id === persistedLocationId)
        ? persistedLocationId
        : null);

    if (resolvedLocationId) {
      persistActiveLocationId(resolvedLocationId);
    }

    set({
      operator: {
        ...operator,
        locationId: resolvedLocationId,
        requiresLocationSelection: operator.requiresLocationSelection && !resolvedLocationId,
      },
      isAuthenticated: true,
      sessionStartedAt: Date.now(),
    });
  },

  setAssignedLocations: (locations) =>
    set((state) =>
      state.operator
        ? {
            operator: {
              ...state.operator,
              assignedLocations: locations,
            },
          }
        : state,
    ),

  setActiveLocation: (locationId, tokens) =>
    set((state) => {
      if (!state.operator) return state;
      persistActiveLocationId(locationId);
      return {
        operator: {
          ...state.operator,
          locationId,
          requiresLocationSelection: false,
          accessToken: tokens?.accessToken ?? state.operator.accessToken,
          refreshToken: tokens?.refreshToken ?? state.operator.refreshToken,
        },
      };
    }),

  getActiveLocation: () => {
    const { operator } = get();
    if (!operator?.locationId) return null;
    return (
      operator.assignedLocations.find((location) => location.id === operator.locationId) ?? null
    );
  },

  canOperate: () => {
    const { operator } = get();
    if (!operator) return false;
    if (operator.assignedLocations.length === 0) return false;
    return Boolean(operator.locationId);
  },

  logout: () => {
    persistActiveLocationId(null);
    set({
      operator: null,
      isAuthenticated: false,
      sessionStartedAt: null,
    });
  },
}));
