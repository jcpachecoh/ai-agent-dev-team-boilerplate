import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProjectsPage } from '@/pages/Projects';
import { SuitesPage } from '@/pages/Suites';
import { TestCasesPage } from '@/pages/TestCases';
import { RunsPage } from '@/pages/Runs';
import { ReportsPage } from '@/pages/Reports';
import { MilestonesPage } from '@/pages/Milestones';
import { RequirementsPage } from '@/pages/Requirements';
import { LoginPage } from '@/pages/Login';
import { SignupPage } from '@/pages/Signup';
import { ProfilePage } from '@/pages/Profile';

export const router = createBrowserRouter([
  { path: 'login', element: <LoginPage /> },
  { path: 'signup', element: <SignupPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:projectId/suites', element: <SuitesPage /> },
      { path: 'projects/:projectId/suites/:suiteId/cases', element: <TestCasesPage /> },
      { path: 'projects/:projectId/runs', element: <RunsPage /> },
      { path: 'projects/:projectId/runs/:runId/report', element: <ReportsPage /> },
      { path: 'projects/:projectId/milestones', element: <MilestonesPage /> },
      { path: 'projects/:projectId/requirements', element: <RequirementsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);
