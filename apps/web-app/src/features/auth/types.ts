export interface LoginInput {
  cedula: string;
  pin: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  operator: {
    id: string;
    name?: string;
    role: string;
    tenantId: string;
    sedeId?: string | null;
  };
}
