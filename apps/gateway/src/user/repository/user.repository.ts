import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OperationalUser } from '@prisma/client';
import type { IUserRepository, UpdateProfileInput } from '../interfaces/user.interfaces';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OperationalUser | null> {
    return this.prisma.operationalUser.findUnique({ where: { id } });
  }

  async updateProfile(id: string, data: UpdateProfileInput): Promise<OperationalUser> {
    return this.prisma.operationalUser.update({
      where: { id },
      data: { sedeId: data.sedeId },
    });
  }
}
