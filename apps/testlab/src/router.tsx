import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/Layout';
import { ProjectsPage } from '@/pages/Projects';
import { SuitesPage } from '@/pages/Suites';
import { TestCasesPage } from '@/pages/TestCases';
import { RunsPage } from '@/pages/Runs';
import { ReportsPage } from '@/pages/Reports';
import { MilestonesPage } from '@/pages/Milestones';
import { RequirementsPage } from '@/pages/Requirements';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId/suites', element: <SuitesPage /> },
      { path: 'projects/:projectId/suites/:suiteId/cases', element: <TestCasesPage /> },
      { path: 'projects/:projectId/runs', element: <RunsPage /> },
      { path: 'projects/:projectId/runs/:runId/report', element: <ReportsPage /> },
      { path: 'projects/:projectId/milestones', element: <MilestonesPage /> },
      { path: 'projects/:projectId/requirements', element: <RequirementsPage /> },
    ],
  },
]);
