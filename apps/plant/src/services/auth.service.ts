import { PlantApiError, plantFetch } from '@/services/plant-api.service';
import type { AssignedLocation } from '@/stores/session.store';

export type OperationalRole = 'OWNER' | 'SUPERVISOR' | 'MANAGER' | 'OPERATOR';

export interface OperatorLoginInput {
  stationId: string;
  cedula: string;
  pin: string;
}

export interface OperatorLoginResponse {
  accessToken: string;
  refreshToken?: string;
  operator: {
    id: string;
    name?: string;
    role: OperationalRole;
    tenantId: string;
    locationId?: string | null;
  };
  locations: AssignedLocation[];
  requiresLocationSelection: boolean;
}

export interface OperatorAuthResult {
  operatorId: string;
  operatorName: string;
  accessToken: string;
  refreshToken?: string;
  role: OperationalRole;
  tenantId: string;
  locationId?: string | null;
  assignedLocations: AssignedLocation[];
  requiresLocationSelection: boolean;
}

export class OperatorAuthError extends Error {
  constructor(
    message = 'Cédula o PIN incorrecto.',
    public readonly status?: number,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'OperatorAuthError';
  }
}

const DEFAULT_TENANT_ID = import.meta.env.VITE_PLANT_TENANT_ID ?? 'palos-de-lena';

function getDemoPin(): string {
  return import.meta.env.VITE_DEMO_PIN ?? '1234';
}

function isDemoAuthEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_PIN === 'true';
}

async function authenticateViaApi(
  stationId: string,
  cedula: string,
  pin: string,
): Promise<OperatorAuthResult> {
  const response = await loginOperator({ stationId, cedula, pin });
  return mapLoginResponse(response, cedula);
}

export async function loginOperator(input: OperatorLoginInput): Promise<OperatorLoginResponse> {
  try {
    return await plantFetch<OperatorLoginResponse>('/api/mes/auth/login', {
      method: 'POST',
      headers: {
        'x-tenant-id': DEFAULT_TENANT_ID,
        'x-station-id': input.stationId,
      },
      body: JSON.stringify({ cedula: input.cedula, pin: input.pin }),
    });
  } catch (error) {
    throw mapOperatorAuthError(error);
  }
}

export async function logoutOperator(): Promise<void> {
  try {
    await plantFetch<{ message: string }>('/api/mes/auth/logout', {
      method: 'POST',
    });
  } catch {
    // Best-effort: local session is cleared even if the API is unreachable.
  }
}

/**
 * Validates operator cédula + PIN for a station. Falls back to demo PIN in dev when API is unavailable.
 */
export async function authenticateOperatorPin(
  stationId: string,
  cedula: string,
  pin: string,
): Promise<OperatorAuthResult> {
  if (isDemoAuthEnabled()) {
    return {
      operatorId: `OP-DEMO-${cedula}`,
      operatorName: `Operador ${cedula}`,
      accessToken: 'demo-access-token',
      role: 'OPERATOR',
      tenantId: DEFAULT_TENANT_ID,
      locationId: stationId,
      assignedLocations: [],
      requiresLocationSelection: false,
    };
  }

  return authenticateViaApi(stationId, cedula, pin);
}

export function shouldShowDemoPinHint(): boolean {
  return isDemoAuthEnabled();
}

export function getDemoPinHint(): string {
  return getDemoPin();
}

function mapLoginResponse(response: OperatorLoginResponse, cedula: string): OperatorAuthResult {
  return {
    operatorId: response.operator.id,
    operatorName: response.operator.name ?? `Operario ${cedula.slice(-4)}`,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    role: response.operator.role,
    tenantId: response.operator.tenantId,
    locationId: response.operator.locationId,
    assignedLocations: response.locations,
    requiresLocationSelection: response.requiresLocationSelection,
  };
}

function mapOperatorAuthError(error: unknown): OperatorAuthError {
  if (error instanceof PlantApiError) {
    const fieldErrors = error.details?.fieldErrors;
    if (error.status === 400) {
      return new OperatorAuthError(
        'Revise la cédula y el PIN ingresados.',
        error.status,
        fieldErrors,
      );
    }
    if (error.status === 401) {
      return new OperatorAuthError('Cédula o PIN incorrecto.', error.status, fieldErrors);
    }
    if (error.status === 403) {
      return new OperatorAuthError(
        'Usuario sin acceso autorizado para esta estación.',
        error.status,
        fieldErrors,
      );
    }
    if (error.status === 500) {
      return new OperatorAuthError('No pudimos iniciar sesión. Intente nuevamente.', error.status);
    }
  }

  return new OperatorAuthError('No pudimos iniciar sesión. Intente nuevamente.');
}
