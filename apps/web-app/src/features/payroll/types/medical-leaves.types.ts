export type LeaveOrigin = 'COMUN' | 'LABORAL';

export type LeaveStatus = 'REGISTRADA' | 'RADICADA_EPS' | 'RECOBRADA' | 'RECHAZADA';

export interface MedicalLeaveRecord {
  id: string;
  employeeId: string;
  origin: LeaveOrigin;
  startDate: string;
  endDate: string;
  totalDays: number;
  employerPaidDays: number;
  epsArlPaidDays: number;
  epsArlAmount: number | null;
  employerAmount: number;
  supportStorageObjectId: string | null;
  status: LeaveStatus;
  radicatedAt: string | null;
  recoveredAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalLeaveDetail extends MedicalLeaveRecord {
  annualAccumulatedDays: number;
  exceeds180DayThreshold: boolean;
}

export interface MedicalLeaveSummary extends MedicalLeaveRecord {
  employeeName: string;
  locationId: string | null;
  locationName: string | null;
}

export interface ListMedicalLeavesFilters {
  employeeId?: string;
  locationId?: string;
  status?: LeaveStatus;
  origin?: LeaveOrigin;
  month?: string;
  cursor?: string;
  take?: number;
}

export interface CreateMedicalLeaveInput {
  employeeId: string;
  origin: LeaveOrigin;
  startDate: string;
  endDate: string;
}

export interface UpdateMedicalLeaveStatusInput {
  status: LeaveStatus;
  rejectionReason?: string;
}
