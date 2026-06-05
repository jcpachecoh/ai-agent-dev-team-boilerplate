import { plantApiConfig } from './config';
import { setMesAccessToken } from './mes-token';

export class MesAuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'MesAuthError';
  }
}

interface MesLoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export async function loginMesOperational(): Promise<string> {
  const base = plantApiConfig.baseUrl.replace(/\/$/, '');
  const url = base ? `${base}/api/mes/auth/login` : '/api/mes/auth/login';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': plantApiConfig.tenantId,
    },
    body: JSON.stringify({
      cedula: plantApiConfig.mesCedula,
      pin: plantApiConfig.mesPin,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new MesAuthError(
      body || 'No se pudo autenticar con el MES. Verifique VITE_MES_CEDULA y VITE_MES_PIN.',
      response.status,
    );
  }

  const data = (await response.json()) as MesLoginResponse;
  setMesAccessToken(data.accessToken);
  return data.accessToken;
}
