import type {
  PlantAvailableOrder,
  PlantLayoutMode,
  PlantStatusCounts,
  PlantWorkstationSnapshot,
  PlantWorkstationStatus,
} from '@restopsiq/ui';
import { layoutModeCellCount } from '@restopsiq/ui';
import { create } from 'zustand';

const LAYOUT_STORAGE_KEY = 'plant.dashboard.layoutMode';

export interface WorkstationCell {
  cellIndex: number;
  stationId?: string;
  orderId?: string;
  status: PlantWorkstationStatus;
  snapshot?: PlantWorkstationSnapshot;
}

export const DEMO_AVAILABLE_ORDERS: PlantAvailableOrder[] = [
  {
    orderId: 'OP-000012',
    productName: 'Pollo asado porcionado',
    recipeName: 'Receta Base Pollo',
    phaseName: 'Corte y porcionado',
    phaseIndex: 2,
    phaseTotal: 4,
    stationId: 'EST-02',
    priority: 'urgent',
    operatorName: 'Carlos Mendoza',
    status: 'in_progress',
    standardDurationMs: 15 * 60 * 1000,
    ingredients: [
      { id: '1', name: 'Aceite vegetal', quantity: '10 L' },
      { id: '2', name: 'Sal', quantity: '1 kg' },
      { id: '3', name: 'Freidora industrial', quantity: '1 und' },
    ],
  },
  {
    orderId: 'OP-000013',
    productName: 'Costillas BBQ premium',
    recipeName: 'Receta Costilla Premium',
    phaseName: 'Marinado',
    phaseIndex: 1,
    phaseTotal: 3,
    stationId: 'EST-03',
    status: 'pending',
    standardDurationMs: 20 * 60 * 1000,
    ingredients: [
      { id: '1', name: 'Costilla premium', quantity: '12 kg' },
      { id: '2', name: 'Salsa BBQ', quantity: '3 L' },
    ],
  },
  {
    orderId: 'OP-000014',
    productName: 'Chicharrón prensado',
    recipeName: 'Receta Chicharrón Casa',
    phaseName: 'Cocción inicial',
    phaseIndex: 2,
    phaseTotal: 3,
    stationId: 'EST-04',
    operatorName: 'Pedro Torres',
    status: 'paused',
    standardDurationMs: 15 * 60 * 1000,
    ingredients: [
      { id: '1', name: 'Aceite vegetal', quantity: '10 L' },
      { id: '2', name: 'Sal', quantity: '1 kg' },
      { id: '3', name: 'Freidora industrial', quantity: '1 und' },
    ],
  },
  {
    orderId: 'OP-000015',
    productName: 'Morcilla artesanal',
    recipeName: 'Receta Morcilla Tradicional',
    phaseName: 'Embutido',
    phaseIndex: 1,
    phaseTotal: 2,
    stationId: 'EST-05',
    priority: 'urgent',
    operatorName: 'Jorge García',
    status: 'incident',
    standardDurationMs: 12 * 60 * 1000,
    ingredients: [
      { id: '1', name: 'Tripa natural', quantity: '5 m' },
      { id: '2', name: 'Mezcla base', quantity: '8 kg' },
    ],
  },
];

function createEmptyCells(): WorkstationCell[] {
  return Array.from({ length: 4 }, (_, cellIndex) => ({
    cellIndex,
    status: 'empty' as const,
  }));
}

function loadLayoutMode(): PlantLayoutMode {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (raw === '1x1' || raw === '1x2' || raw === '2x2') return raw;
  } catch {
    // ignore
  }
  return '2x2';
}

function persistLayoutMode(mode: PlantLayoutMode): void {
  localStorage.setItem(LAYOUT_STORAGE_KEY, mode);
}

function toSnapshot(order: PlantAvailableOrder): PlantWorkstationSnapshot {
  const { status: _status, ...snapshot } = order;
  return snapshot;
}

export function computeStatusCounts(cells: WorkstationCell[]): PlantStatusCounts {
  return cells.reduce<PlantStatusCounts>(
    (acc, cell) => {
      if (cell.status === 'in_progress') acc.inProgress += 1;
      if (cell.status === 'paused') acc.paused += 1;
      if (cell.status === 'incident') acc.incidents += 1;
      if (cell.status === 'pending') acc.pending += 1;
      return acc;
    },
    { inProgress: 0, paused: 0, incidents: 0, pending: 0 },
  );
}

interface DashboardLayoutState {
  layoutMode: PlantLayoutMode;
  cells: WorkstationCell[];
  availableOrders: PlantAvailableOrder[];
  setAvailableOrders: (orders: PlantAvailableOrder[]) => void;
  setLayoutMode: (mode: PlantLayoutMode) => void;
  assignOrderToCell: (cellIndex: number, order: PlantAvailableOrder) => void;
  clearCell: (cellIndex: number) => void;
  updateCellStatus: (orderId: string, status: Exclude<PlantWorkstationStatus, 'empty'>) => void;
  updateCellSnapshot: (orderId: string, patch: Partial<PlantWorkstationSnapshot>) => void;
  hydrateFromPreferences: () => Promise<void>;
  hydrateDemoAssignments: () => void;
  getVisibleCellCount: () => number;
  getStatusCounts: () => PlantStatusCounts;
}

export const useDashboardLayoutStore = create<DashboardLayoutState>((set, get) => ({
  layoutMode: loadLayoutMode(),
  cells: createEmptyCells(),
  availableOrders: [],
  setAvailableOrders: (orders) => set({ availableOrders: orders }),

  setLayoutMode: (mode) => {
    persistLayoutMode(mode);
    set({ layoutMode: mode });
  },

  assignOrderToCell: (cellIndex, order) => {
    set((state) => ({
      cells: state.cells.map((cell) =>
        cell.cellIndex === cellIndex
          ? {
              cellIndex,
              orderId: order.orderId,
              stationId: order.stationId,
              status: order.status,
              snapshot: toSnapshot(order),
            }
          : cell,
      ),
      availableOrders: state.availableOrders.some((item) => item.orderId === order.orderId)
        ? state.availableOrders
        : [...state.availableOrders, order],
    }));
  },

  clearCell: (cellIndex) => {
    set((state) => ({
      cells: state.cells.map((cell) =>
        cell.cellIndex === cellIndex ? { cellIndex, status: 'empty' as const } : cell,
      ),
    }));
  },

  updateCellStatus: (orderId, status) => {
    set((state) => ({
      cells: state.cells.map((cell) => (cell.orderId === orderId ? { ...cell, status } : cell)),
    }));
  },

  updateCellSnapshot: (orderId, patch) => {
    set((state) => ({
      cells: state.cells.map((cell) =>
        cell.orderId === orderId && cell.snapshot
          ? { ...cell, snapshot: { ...cell.snapshot, ...patch } }
          : cell,
      ),
    }));
  },

  hydrateFromPreferences: async () => {
    set({ layoutMode: loadLayoutMode() });
  },

  hydrateDemoAssignments: () => {
    set({
      availableOrders: DEMO_AVAILABLE_ORDERS,
      cells: DEMO_AVAILABLE_ORDERS.map((order, cellIndex) => ({
        cellIndex,
        orderId: order.orderId,
        stationId: order.stationId,
        status: order.status,
        snapshot: toSnapshot(order),
      })),
    });
  },

  getVisibleCellCount: () => layoutModeCellCount(get().layoutMode),

  getStatusCounts: () => computeStatusCounts(get().cells),
}));
