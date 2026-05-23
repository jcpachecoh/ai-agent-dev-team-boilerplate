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

    return this.prisma.$transaction(
      async (tx) => {
        let milestoneId: string | undefined;

        if (preview.milestone) {
          const milestone = await tx.milestone.create({
            data: {
              name: preview.milestone.name,
              description: preview.milestone.description,
              dueDate: preview.milestone.dueDate ? new Date(preview.milestone.dueDate) : undefined,
              projectId,
            },
          });
          milestoneId = milestone.id;
        }

        const requirementIds: string[] = [];
        for (const req of preview.requirements) {
          const requirement = await tx.requirement.create({
            data: {
              title: req.title,
              description: req.description,
              externalId: req.externalId,
              projectId,
            },
          });
          requirementIds.push(requirement.id);
        }

        const testCaseIds: string[] = [];
        for (const tc of preview.testCases) {
          const testCase = await tx.testCase.create({
            data: {
              title: tc.title,
              preconditions: tc.preconditions,
              expectedResult: tc.expectedResult,
              priority: tc.priority as any,
              type: tc.type as any,
              suiteId,
              createdById,
            },
          });
          testCaseIds.push(testCase.id);

          if (milestoneId) {
            await tx.caseMilestone.create({
              data: { milestoneId, caseId: testCase.id },
            });
          }

          for (const requirementId of requirementIds) {
            await tx.requirementCase.create({
              data: { requirementId, caseId: testCase.id },
            });
          }
        }

        return { milestoneId, requirementIds, testCaseIds };
      },
      { maxWait: 10_000, timeout: 30_000 },
    );
  }
}
