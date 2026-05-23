import { http } from './http';

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

export interface ConfirmGenerationPayload {
  suiteId: string;
  milestone?: GeneratedMilestone;
  requirements: GeneratedRequirement[];
  testCases: GeneratedTestCase[];
}

export interface ConfirmGenerationResult {
  milestoneId?: string;
  requirementIds: string[];
  testCaseIds: string[];
}

export const generationService = {
  generate: (projectId: string, issueId: string): Promise<GenerationPreview> =>
    http.request<GenerationPreview>(`/projects/${projectId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ issueId }),
    }),

  confirm: (
    projectId: string,
    payload: ConfirmGenerationPayload,
  ): Promise<ConfirmGenerationResult> =>
    http.request<ConfirmGenerationResult>(`/projects/${projectId}/generate/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
