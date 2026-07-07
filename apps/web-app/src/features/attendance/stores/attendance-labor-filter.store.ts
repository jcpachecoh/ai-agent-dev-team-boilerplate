import { useSyncExternalStore } from 'react';

import type { LaborClassificationFilterValue } from '../utils/labor-classification';

let laborFilter: LaborClassificationFilterValue = 'all';
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getLaborClassificationFilter(): LaborClassificationFilterValue {
  return laborFilter;
}

export function setLaborClassificationFilter(value: LaborClassificationFilterValue): void {
  if (laborFilter === value) return;
  laborFilter = value;
  emit();
}

export function resetAttendanceModuleFilters(): void {
  if (laborFilter === 'all') return;
  laborFilter = 'all';
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLaborClassificationFilter() {
  const value = useSyncExternalStore(
    subscribe,
    getLaborClassificationFilter,
    () => 'all' as LaborClassificationFilterValue,
  );

  return {
    value,
    setValue: setLaborClassificationFilter,
  };
}
