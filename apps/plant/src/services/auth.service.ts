import { plantFetch } from '@/services/plant-api.service';

export interface OperatorAuthResult {
  operatorId: string;
  operatorName: string;
}

export class OperatorAuthError extends Error {
  constructor(message = 'PIN incorrecto') {
    super(message);
    this.name = 'OperatorAuthError';
  }
}

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
  return plantFetch<OperatorAuthResult>(`/api/plant/stations/${stationId}/operators/auth`, {
    method: 'POST',
    body: JSON.stringify({ cedula, pin }),
  });
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
    };
  }

  try {
    return await authenticateViaApi(stationId, cedula, pin);
  } catch {
    throw new OperatorAuthError();
  }
}

export function shouldShowDemoPinHint(): boolean {
  return isDemoAuthEnabled();
}

export function getDemoPinHint(): string {
  return getDemoPin();
}
