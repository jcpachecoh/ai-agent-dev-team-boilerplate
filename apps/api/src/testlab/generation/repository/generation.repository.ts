import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  IGenerationRepository,
  ConfirmGenerationData,
  ConfirmGenerationResult,
} from '../interfaces/generation.interfaces';

@Injectable()
export class GenerationRepository implements IGenerationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async confirmGeneration(data: ConfirmGenerationData): Promise<ConfirmGenerationResult> {
    const { projectId, suiteId, createdById, preview } = data;

    return this.prisma.$transaction(async (tx) => {
      let milestoneId: string | undefined;

      if (preview.milestone) {
        const milestone = await tx.milestone.create({
          data: {
            projectId,
            name: preview.milestone.name,
            description: preview.milestone.description,
            dueDate: preview.milestone.dueDate ? new Date(preview.milestone.dueDate) : null,
          },
        });
        milestoneId = milestone.id;
      }

      const requirementIds: string[] = [];
      for (const req of preview.requirements) {
        const requirement = await tx.requirement.create({
          data: {
            projectId,
            title: req.title,
            description: req.description,
            externalId: req.externalId,
          },
        });
        requirementIds.push(requirement.id);
      }

      const testCaseIds: string[] = [];
      for (const tc of preview.testCases) {
        const testCase = await tx.testCase.create({
          data: {
            suiteId,
            title: tc.title,
            preconditions: tc.preconditions,
            steps: tc.steps,
            expectedResult: tc.expectedResult,
            priority: tc.priority,
            type: tc.type,
            createdById,
          },
        });
        testCaseIds.push(testCase.id);
      }

      return { milestoneId, requirementIds, testCaseIds };
    });
  }
}
