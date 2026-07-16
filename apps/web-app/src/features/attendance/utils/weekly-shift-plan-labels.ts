import type { WeeklyShiftPlanStatus } from '../types/weekly-shift-plan.types';

export function weeklyShiftPlanStatusLabel(status: WeeklyShiftPlanStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Borrador';
    case 'PENDING_APPROVAL':
      return 'Pendiente de aprobación';
    case 'APPROVED':
      return 'Aprobada';
    case 'REJECTED':
      return 'Rechazada';
    default:
      return status;
  }
}
