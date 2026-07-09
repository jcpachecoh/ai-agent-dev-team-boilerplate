export type VacationType = 'DISFRUTE' | 'COMPENSACION';

export type VacationStatus = 'SOLICITADA' | 'APROBADA_NIVEL_1' | 'APROBADA' | 'RECHAZADA';

export interface VacationBalance {
  id: string;
  employeeId: string;
  accruedDays: number;
  takenDays: number;
  compensatedDays: number;
  availableDays: number;
  lastAccrualDate: string;
}

export interface VacationRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  type: VacationType;
  status: VacationStatus;
  level1ApprovedBy: string | null;
  level1ActedAt: string | null;
  level2ApprovedBy: string | null;
  level2ActedAt: string | null;
  rejectionReason: string | null;
  letterStorageObjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VacationRequestSummary extends VacationRequest {
  employeeName: string;
  locationId: string | null;
  locationName: string | null;
}

export interface VacationRequestsFilters {
  employeeId?: string;
  locationId?: string;
  status?: VacationStatus;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  take?: number;
}

export interface CreateVacationRequestInput {
  employeeId: string;
  startDate: string;
  endDate: string;
  type: VacationType;
}

export const VACATION_STATUS_LABELS: Record<VacationStatus, string> = {
  SOLICITADA: 'Solicitada',
  APROBADA_NIVEL_1: 'Aprobada nivel 1',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};

export const VACATION_TYPE_LABELS: Record<VacationType, string> = {
  DISFRUTE: 'Disfrute',
  COMPENSACION: 'Compensación en dinero',
};
