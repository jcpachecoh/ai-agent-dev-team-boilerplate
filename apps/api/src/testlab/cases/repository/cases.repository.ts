import { Injectable } from '@nestjs/common';
import type { TestCase, ResultStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ICasesRepository, CreateCaseData } from '../interfaces/cases.interfaces';

@Injectable()
export class CasesRepository implements ICasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(suiteId: string): Promise<TestCase[]> {
    return this.prisma.testCase.findMany({
      where: { suiteId },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(suiteId: string, id: string): Promise<TestCase | null> {
    return this.prisma.testCase.findFirst({ where: { id, suiteId } });
  }

  create(data: CreateCaseData): Promise<TestCase> {
    return this.prisma.testCase.create({ data });
  }

  updateStatus(id: string, status: ResultStatus): Promise<TestCase> {
    return this.prisma.testCase.update({ where: { id }, data: { status } });
  }

  findOrCreateSystemUser(): Promise<{ id: string }> {
    return this.prisma.user.upsert({
      where: { email: 'system@testlab.local' },
      update: {},
      create: { email: 'system@testlab.local', name: 'System' },
      select: { id: true },
    });
  }
}
