import { Injectable } from '@nestjs/common';
import type { TestSuite } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ISuitesRepository, CreateSuiteData } from '../interfaces/suites.interfaces';

@Injectable()
export class SuitesRepository implements ISuitesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectId: string): Promise<TestSuite[]> {
    return this.prisma.testSuite.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(projectId: string, id: string): Promise<TestSuite | null> {
    return this.prisma.testSuite.findFirst({ where: { id, projectId } });
  }

  create(data: CreateSuiteData): Promise<TestSuite> {
    return this.prisma.testSuite.create({ data });
  }
}
