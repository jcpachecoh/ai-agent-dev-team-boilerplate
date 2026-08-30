import { Injectable } from '@nestjs/common';
import type { PasswordResetToken } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateResetTokenData, IAuthEmailRepository } from '../interfaces/auth.interfaces';

@Injectable()
export class AuthEmailRepository implements IAuthEmailRepository {
  constructor(private readonly prisma: PrismaService) {}

  createResetToken(data: CreateResetTokenData): Promise<PasswordResetToken> {
    return this.prisma.passwordResetToken.create({ data });
  }

  findResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  async markResetTokenUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteExpiredResetTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
  }
}
