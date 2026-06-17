import type { RestaurantScheduleState } from '../mappers/display';

const STORAGE_PREFIX = 'restopsiq:tenant-schedule:';

function storageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}${tenantId}`;
}

export function readTenantSchedule(tenantId: string): RestaurantScheduleState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey(tenantId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as RestaurantScheduleState;
  } catch {
    return null;
  }
}

export function writeTenantSchedule(
  tenantId: string,
  schedule: RestaurantScheduleState,
): RestaurantScheduleState {
  window.localStorage.setItem(storageKey(tenantId), JSON.stringify(schedule));
  return schedule;
}
