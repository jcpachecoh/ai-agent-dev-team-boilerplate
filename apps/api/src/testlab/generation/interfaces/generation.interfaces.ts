import type { TestCase, Milestone, Requirement } from '@prisma/client';

export interface GeneratedTestCase {
  title: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'FUNCTIONAL' | 'REGRESSION' | 'SMOKE' | 'ACCEPTANCE';
}

export interface GeneratedRequirement {
  title: string;
  description: string;
  externalId: string;
}

export interface GeneratedMilestone {
  name: string;
  description: string;
  dueDate?: string;
}

export interface GenerationPreview {
  milestone?: GeneratedMilestone;
  requirements: GeneratedRequirement[];
  testCases: GeneratedTestCase[];
}

export interface ConfirmGenerationData {
  projectId: string;
  suiteId: string;
  createdById: string;
  preview: GenerationPreview;
}

export interface ConfirmGenerationResult {
  milestoneId?: string;
  requirementIds: string[];
  testCaseIds: string[];
}

export interface IGenerationRepository {
  confirmGeneration(data: ConfirmGenerationData): Promise<ConfirmGenerationResult>;
}

export interface IGenerationService {
  generate(projectId: string, issueKey: string): Promise<GenerationPreview>;
  confirm(
    projectId: string,
    suiteId: string,
    createdById: string,
    preview: GenerationPreview,
  ): Promise<ConfirmGenerationResult>;
}

export interface IssueContext {
  identifier: string;
  title: string;
  description: string;
  priority: number;
  labels: string[];
}
