import { Injectable, NotFoundException } from '@nestjs/common';
import { OperationalUser } from '@prisma/client';
import { UserRepository } from '../repository/user.repository';
import type { IUserService, UpdateProfileInput } from '../interfaces/user.interfaces';

@Injectable()
export class UserService implements IUserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getOperationalProfile(
    globalUserId: string,
    tenantId: string,
  ): Promise<OperationalUser | null> {
    const profile = await this.userRepository.findByUserId(globalUserId);
    if (!profile || profile.tenantId !== tenantId) {
      return null;
    }
    return profile;
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<OperationalUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return this.userRepository.updateProfile(id, data);
  }
}
