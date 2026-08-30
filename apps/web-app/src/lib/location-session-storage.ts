import type { LocationScope } from '@/features/auth/constants/location-session.constants';

const ACTIVE_LOCATION_KEY = 'restopsiq.activeLocationId';
const LOCATION_SCOPE_KEY = 'restopsiq.locationScope';

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

export function readPersistedLocationScope(): LocationScope | null {
  try {
    const value = localStorage.getItem(LOCATION_SCOPE_KEY);
    return value === 'general' || value === 'location' ? value : null;
  } catch {
    return null;
  }
}

export function persistLocationScope(scope: LocationScope): void {
  try {
    localStorage.setItem(LOCATION_SCOPE_KEY, scope);
  } catch {
    // ignore storage errors
  }
}
