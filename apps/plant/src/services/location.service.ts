import { plantFetch } from '@/services/plant-api.service';
import type { AssignedLocation } from '@/stores/session.store';

export interface SelectLocationResponse {
  accessToken: string;
  refreshToken?: string;
  operator: {
    id: string;
    role: string;
    tenantId: string;
    locationId: string | null;
  };
  locations: AssignedLocation[];
  requiresLocationSelection: boolean;
}

export async function fetchMyLocations(): Promise<AssignedLocation[]> {
  return plantFetch<AssignedLocation[]>('/api/mes/auth/my-locations');
}

export async function selectActiveLocation(locationId: string): Promise<SelectLocationResponse> {
  return plantFetch<SelectLocationResponse>('/api/mes/auth/select-location', {
    method: 'POST',
    body: JSON.stringify({ locationId }),
  });
}
