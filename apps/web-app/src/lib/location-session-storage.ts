const ACTIVE_LOCATION_KEY = 'restopsiq.activeLocationId';

export function readPersistedLocationId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_LOCATION_KEY);
  } catch {
    return null;
  }
}

export function persistActiveLocationId(locationId: string | null): void {
  try {
    if (locationId) {
      localStorage.setItem(ACTIVE_LOCATION_KEY, locationId);
    } else {
      localStorage.removeItem(ACTIVE_LOCATION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearActiveLocationId(): void {
  persistActiveLocationId(null);
}
