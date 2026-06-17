import type { OperationalUser } from '@prisma/client';

export interface UpdateProfileInput {
  sedeId?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<OperationalUser | null>;
  findByUserId(userId: string): Promise<OperationalUser | null>;
  updateProfile(id: string, data: UpdateProfileInput): Promise<OperationalUser>;
}

export interface IUserService {
  getOperationalProfile(globalUserId: string, tenantId: string): Promise<OperationalUser | null>;
  updateProfile(id: string, data: UpdateProfileInput): Promise<OperationalUser>;
}
