export interface LoginInput {
  cedula: string;
  pin: string;
}

/** Matches the gateway GraphQL AuthResponse shape. */
export interface LoginUser {
  id: string;
  role: string;
  tenantId: string;
  sedeId?: string | null;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  user: LoginUser;
}
