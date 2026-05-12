import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(suiteId: string) {
    return this.prisma.testCase.findMany({
      where: { suiteId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(suiteId: string, id: string) {
    const tc = await this.prisma.testCase.findFirst({ where: { id, suiteId } });
    if (!tc) throw new NotFoundException('Test case not found');
    return tc;
  }

  async create(suiteId: string, dto: CreateCaseDto) {
    const systemUser = await this.prisma.user.upsert({
      where: { email: 'system@testlab.local' },
      update: {},
      create: { email: 'system@testlab.local', name: 'System' },
    });

    return this.prisma.testCase.create({
      data: {
        title: dto.title,
        priority: dto.priority ?? 'MEDIUM',
        type: dto.type ?? 'FUNCTIONAL',
        preconditions: dto.preconditions,
        expectedResult: dto.expectedResult,
        suiteId,
        createdById: systemUser.id,
      },
    });
  }

  async updateStatus(suiteId: string, id: string, dto: UpdateCaseStatusDto) {
    await this.findOne(suiteId, id);
    return this.prisma.testCase.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
