import { request } from './http';

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
};
