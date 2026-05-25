import { Injectable } from '@nestjs/common';
import type { UserTestLab } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { IAuthRepository } from '../interfaces/auth.interfaces';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserTestLab | null> {
    return this.prisma.userTestLab.findUnique({ where: { email } });
  }

  findById(id: string): Promise<UserTestLab | null> {
    return this.prisma.userTestLab.findUnique({ where: { id } });
  }

  createUser(data: { email: string; name: string; passwordHash: string }): Promise<UserTestLab> {
    return this.prisma.userTestLab.create({ data });
  }

  async saveRefreshToken(userId: string, hashedToken: string | null): Promise<void> {
    await this.prisma.userTestLab.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.userTestLab.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
