import type { OperationalUser, OperationalRole } from '@prisma/client';

export interface MesLocationSummary {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  address?: string | null;
}

export interface CreateOperationalUserData {
  tenantId: string;
  cedulaHash: string;
  pinHash: string;
  role: OperationalRole;
  sedeId: string | null;
}

export interface MesCreateUserInput {
  cedula: string;
  pin: string;
  role: OperationalRole;
  locationId?: string;
}

export interface MesCreatedUserResponse {
  id: string;
  cedula: string;
  role: OperationalRole;
  tenantId: string;
  locationId: string | null;
}

export interface IMesAuthRepository {
  findByCedulaHash(tenantId: string, cedulaHash: string): Promise<OperationalUser | null>;
  findById(id: string): Promise<OperationalUser | null>;
  findLocationIdByUserId(tenantId: string, userId: string): Promise<string | null>;
  findActiveLocationsByUserId(tenantId: string, userId: string): Promise<MesLocationSummary[]>;
  findLocationById(tenantId: string, locationId: string): Promise<MesLocationSummary | null>;
  updateCedulaHash(id: string, cedulaHash: string): Promise<OperationalUser>;
  createUser(data: CreateOperationalUserData): Promise<OperationalUser>;
  incrementLoginAttempts(id: string): Promise<void>;
  lockUser(id: string, until: Date): Promise<void>;
  resetLoginAttempts(id: string): Promise<void>;
  saveRefreshToken(id: string, hashedToken: string | null): Promise<void>;
}

export interface MesLoginInput {
  cedula: string;
  pin: string;
}

export interface MesAuthTokens {
  accessToken: string;
  refreshToken: string;
  operator: MesMeResponse;
  locations: MesLocationSummary[];
  requiresLocationSelection: boolean;
}

export interface MesMeResponse {
  id: string;
  role: OperationalRole;
  tenantId: string;
  locationId: string | null;
}

export interface IMesAuthService {
  login(
    dto: MesLoginInput,
    ipAddress: string,
    tenantId: string,
    userAgent?: string,
  ): Promise<MesAuthTokens>;
  logout(userId: string, jti?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  me(userId: string, activeLocationId?: string | null): Promise<MesMeResponse>;
  myLocations(userId: string): Promise<MesLocationSummary[]>;
  selectLocation(userId: string, locationId: string): Promise<MesAuthTokens>;
  getRole(requesterUserId: string, targetUserId: string): Promise<{ role: OperationalRole }>;
  createUser(requesterUserId: string, dto: MesCreateUserInput): Promise<MesCreatedUserResponse>;
}

export interface MesJwtPayload {
  sub: string;
  cedulaHash: string;
  role: OperationalRole;
  locationId: string | null;
  tenantId: string;
  jti?: string;
}
