import type { LoginInput, LoginResponse } from '../types';

/** Same-origin in dev (Vite proxies /api → API). Override with VITE_API_URL in .env.local. */
const DEFAULT_API_URL = '';
const DEFAULT_TENANT_ID = 'palos-de-lena';

function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (raw === undefined || raw === '') {
    return DEFAULT_API_URL;
  }
  return String(raw).replace(/\/$/, '');
}

function getTenantId(): string {
  return import.meta.env.VITE_TENANT_ID ?? DEFAULT_TENANT_ID;
}

function buildLoginUrl(): string {
  const base = getApiBaseUrl();
  const path = '/api/mes/auth/login';
  return base ? `${base}${path}` : path;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export async function loginWithCedulaPin(input: LoginInput): Promise<LoginResponse> {
  const url = buildLoginUrl();

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': getTenantId(),
      },
      body: JSON.stringify({ cedula: input.cedula, pin: input.pin }),
    });
  } catch {
    throw new AuthApiError(
      'No se pudo conectar con el servidor. Comprueba que la API esté en ejecución (puerto 3001).',
    );
  }

  if (!res.ok) {
    let message = 'No pudimos iniciar sesión. Intente nuevamente.';
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message) && body.message[0]) {
        message = body.message[0];
      }
    } catch {
      if (res.status >= 500) {
        message =
          'No se pudo contactar la API. Abre otra terminal y ejecuta: cd apps/api && pnpm dev (puerto 3001).';
      }
    }

    if (res.status === 401) {
      message = 'Cédula o PIN incorrecto.';
    } else if (res.status === 400) {
      message = 'Revise la cédula y el PIN ingresados.';
    } else if (res.status === 403) {
      message = 'Usuario sin acceso autorizado.';
    } else if (res.status >= 500 && message === 'No pudimos iniciar sesión. Intente nuevamente.') {
      message =
        'No se pudo contactar la API. Abre otra terminal y ejecuta: cd apps/api && pnpm dev (puerto 3001).';
    }

    throw new AuthApiError(message, res.status);
  }

  return (await res.json()) as LoginResponse;
}
