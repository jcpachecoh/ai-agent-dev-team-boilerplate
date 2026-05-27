import { create } from 'zustand';

export interface OperatorSession {
  operatorId: string;
  operatorName: string;
  accessToken: string;
  refreshToken?: string;
  role: 'OWNER' | 'SUPERVISOR' | 'MANAGER' | 'OPERATOR';
  tenantId: string;
  sedeId?: string | null;
}

interface SessionState {
  stationId: string | null;
  operator: OperatorSession | null;
  isAuthenticated: boolean;
  sessionStartedAt: number | null;
  setStationId: (stationId: string) => void;
  clearStationId: () => void;
  login: (operator: OperatorSession) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  stationId: null,
  operator: null,
  isAuthenticated: false,
  sessionStartedAt: null,

  setStationId: (stationId) => set({ stationId }),

  clearStationId: () => set({ stationId: null }),

  login: (operator) =>
    set({
      operator,
      isAuthenticated: true,
      sessionStartedAt: Date.now(),
    }),

  logout: () =>
    set({
      operator: null,
      isAuthenticated: false,
      sessionStartedAt: null,
    }),
}));
