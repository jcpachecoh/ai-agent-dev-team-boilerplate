import { OperationalUser } from '@prisma/client';

export interface UpdateProfileInput {
  sedeId?: string;
}

export interface IUserRepository {
  findById(id: string): Promise<OperationalUser | null>;
  updateProfile(id: string, data: UpdateProfileInput): Promise<OperationalUser>;
}

export interface IUserService {
  getMe(id: string): Promise<OperationalUser | null>;
  updateProfile(id: string, data: UpdateProfileInput): Promise<OperationalUser>;
}
