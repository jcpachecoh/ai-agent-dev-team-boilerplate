export interface AttendanceCardObservation {
  text: string;
  updatedAt: string;
}

export type AttendanceMarkingType = 'ENTRY' | 'EXIT';

export interface AttendanceCardMarkEntry {
  id: string;
  type: AttendanceMarkingType;
  timestamp: string;
}

export interface AttendanceCardDayMarkings {
  marks: AttendanceCardMarkEntry[];
  changeReason: string;
  updatedAt: string;
  updatedBy: string;
}

/** @deprecated Legacy single-mark shape kept for migration */
export interface AttendanceCardManualMarking {
  type: AttendanceMarkingType;
  isoDate: string;
  time: string;
  updatedAt: string;
  updatedBy: string;
}
