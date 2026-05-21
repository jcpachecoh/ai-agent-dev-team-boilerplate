import { request } from './http';
import { milestonesService, type Milestone } from './milestones.service';
import { requirementsService, type Requirement } from './requirements.service';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CaseType =
  | 'FUNCTIONAL'
  | 'REGRESSION'
  | 'SMOKE'
  | 'EXPLORATORY'
  | 'AUTOMATED'
  | 'ACCEPTANCE';
export type CaseStatus = 'UNTESTED' | 'PASS' | 'FAIL' | 'BLOCKED' | 'RETEST' | 'SKIPPED';

export interface TestCase {
  id: string;
  title: string;
  priority: CasePriority;
  type: CaseType;
  status: CaseStatus;
  preconditions: string | null;
  expectedResult: string | null;
  suiteId: string;
  createdAt: string;
}

export interface CreateCasePayload {
  title: string;
  priority?: CasePriority;
  type?: CaseType;
  preconditions?: string;
  expectedResult?: string;
}

export const casesService = {
  list: (projectId: string, suiteId: string): Promise<TestCase[]> =>
    request<TestCase[]>(`/projects/${projectId}/suites/${suiteId}/cases`),

  create: (projectId: string, suiteId: string, payload: CreateCasePayload): Promise<TestCase> =>
    request<TestCase>(`/projects/${projectId}/suites/${suiteId}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  updateStatus: (
    projectId: string,
    suiteId: string,
    caseId: string,
    status: CaseStatus,
  ): Promise<TestCase> =>
    request<TestCase>(`/projects/${projectId}/suites/${suiteId}/cases/${caseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),

  /** Option B: fetches all milestones then filters by case membership (client-side). */
  listMilestones: async (
    projectId: string,
    _suiteId: string,
    caseId: string,
  ): Promise<Milestone[]> => {
    const allMilestones = await milestonesService.list(projectId);
    const results = await Promise.all(
      allMilestones.map((m) =>
        milestonesService
          .getCases(projectId, m.id)
          .then((cases) => (cases.some((c) => c.id === caseId) ? m : null)),
      ),
    );
    return results.filter((m): m is Milestone => m !== null);
  },

  linkMilestone: (projectId: string, milestoneId: string, caseId: string): Promise<void> =>
    milestonesService.linkCase(projectId, milestoneId, caseId),

  unlinkMilestone: (projectId: string, milestoneId: string, caseId: string): Promise<void> =>
    milestonesService.unlinkCase(projectId, milestoneId, caseId),

  /** Option B: fetches all requirements then filters by case membership (client-side). */
  listRequirements: async (
    projectId: string,
    _suiteId: string,
    caseId: string,
  ): Promise<Requirement[]> => {
    const allReqs = await requirementsService.list(projectId);
    const results = await Promise.all(
      allReqs.map((r) =>
        requirementsService
          .getCases(projectId, r.id)
          .then((cases) => (cases.some((c) => c.id === caseId) ? r : null)),
      ),
    );
    return results.filter((r): r is Requirement => r !== null);
  },

  linkRequirement: (projectId: string, requirementId: string, caseId: string): Promise<void> =>
    requirementsService.linkCase(projectId, requirementId, caseId),

  unlinkRequirement: (projectId: string, requirementId: string, caseId: string): Promise<void> =>
    requirementsService.unlinkCase(projectId, requirementId, caseId),
};
