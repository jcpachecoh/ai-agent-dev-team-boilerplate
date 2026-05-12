import { http } from './http';

export interface TestRun {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const runsService = {
  list: (projectId: string): Promise<TestRun[]> =>
    http.request<TestRun[]>(`/projects/${projectId}/runs`),
  create: (projectId: string, payload: { name: string; description?: string }): Promise<TestRun> =>
    http.request<TestRun>(`/projects/${projectId}/runs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
