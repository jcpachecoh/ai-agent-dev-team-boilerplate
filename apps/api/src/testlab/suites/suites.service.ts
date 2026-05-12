import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSuiteDto } from './dto/create-suite.dto';
import type { TestSuite } from '@prisma/client';

@Injectable()
export class SuitesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string): Promise<TestSuite[]> {
    return this.prisma.testSuite.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, id: string): Promise<TestSuite> {
    const suite = await this.prisma.testSuite.findFirst({ where: { id, projectId } });
    if (!suite) throw new NotFoundException(`Suite ${id} not found`);
    return suite;
  }

  async create(projectId: string, dto: CreateSuiteDto): Promise<TestSuite> {
    return this.prisma.testSuite.create({ data: { ...dto, projectId } });
  }
}
