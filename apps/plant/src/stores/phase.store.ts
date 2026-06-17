import { create } from 'zustand';

import type { PhaseOperator } from '@restopsiq/ui';

export type PhasePriority = 'urgent' | 'normal';
export type PhaseWorkflowStatus = 'assigned' | 'in_progress';

export interface PhaseInstruction {
  id: string;
  text: string;
}

export interface ActivePhaseSnapshot {
  opId: string;
  productName: string;
  phaseTitle: string;
  stationAreaLabel: string;
  phaseIndex: number;
  phaseTotal: number;
  targetQuantityAmount: number;
  priority: PhasePriority;
  standardDurationMs: number;
  targetQuantity: string;
  workflowStatus: PhaseWorkflowStatus;
  activeOperatorName: string;
  instructions: PhaseInstruction[];
  safetyNote: string;
  referenceImageUrl?: string;
  operators: PhaseOperator[];
}

interface PhaseState extends ActivePhaseSnapshot {
  setWorkflowStatus: (status: PhaseWorkflowStatus) => void;
  applyPhaseStatusFromSocket: (status: string) => void;
  resetAfterPhaseComplete: () => void;
  hydrateDemoPhase: () => void;
}

const DEMO_PHASE: ActivePhaseSnapshot = {
  opId: 'OP-000012',
  productName: 'Pollo asado porcionado',
  phaseTitle: 'Fase 2 — Corte y porcionado',
  stationAreaLabel: 'Corte y deshuese',
  phaseIndex: 2,
  phaseTotal: 4,
  targetQuantityAmount: 50,
  priority: 'urgent',
  standardDurationMs: 15 * 60 * 1000,
  targetQuantity: '50 kg',
  workflowStatus: 'in_progress',
  activeOperatorName: 'Carlos Mendoza',
  instructions: [
    {
      id: '1',
      text: 'Verificar temperatura interna del pollo ≥ 74°C antes de porcionar',
    },
    { id: '2', text: 'Porcionar en cortes de 150 g ± 10 g por unidad' },
    { id: '3', text: 'Registrar el peso de cada unidad procesada en planilla' },
    { id: '4', text: 'Separar mermas en bandeja de control de calidad' },
    { id: '4', text: 'Separar mermas en bandeja de control de calidad' },
  ],
  safetyNote:
    'No superar los 30 min de exposición a temperatura ambiente. Rechazar producto si T° interna < 74°C.',
  operators: [
    {
      id: '1',
      name: 'Carlos Mendoza',
      initials: 'CM',
      accent: 'blue',
      timer: '47:22',
      active: true,
    },
    { id: '2', name: 'Pedro Torres', initials: 'PT', accent: 'gold', timer: '33:05' },
    { id: '3', name: 'Jorge García', initials: 'JG', accent: 'purple', timer: '18:54' },
  ],
};

export const usePhaseStore = create<PhaseState>((set) => ({
  ...DEMO_PHASE,

  setWorkflowStatus: (workflowStatus) => set({ workflowStatus }),

  applyPhaseStatusFromSocket: (status) => {
    const normalized = status.toLowerCase();
    if (normalized === 'in_progress' || normalized === 'active' || normalized === 'running') {
      set({ workflowStatus: 'in_progress' });
      return;
    }
    if (normalized === 'assigned' || normalized === 'pending') {
      set({ workflowStatus: 'assigned' });
    }
  },

  resetAfterPhaseComplete: () =>
    set({
      workflowStatus: 'assigned',
    }),

  hydrateDemoPhase: () => set({ ...DEMO_PHASE }),
}));
