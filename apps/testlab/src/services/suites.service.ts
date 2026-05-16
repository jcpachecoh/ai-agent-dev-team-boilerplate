import { http } from './http';

export interface TestSuite {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export const suitesService = {
  list: (projectId: string): Promise<TestSuite[]> =>
    http.request<TestSuite[]>(`/projects/${projectId}/suites`),
  create: (
    projectId: string,
    payload: { name: string; description?: string },
  ): Promise<TestSuite> =>
    http.request<TestSuite>(`/projects/${projectId}/suites`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
