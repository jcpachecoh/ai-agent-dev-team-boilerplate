import { Injectable, NotFoundException } from '@nestjs/common';
import { OperationalUser } from '@prisma/client';
import { UserRepository } from '../repository/user.repository';
import type { IUserService, UpdateProfileInput } from '../interfaces/user.interfaces';

@Injectable()
export class UserService implements IUserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getMe(id: string): Promise<OperationalUser | null> {
    return this.userRepository.findById(id);
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<OperationalUser> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    return this.userRepository.updateProfile(id, data);
  }
}
