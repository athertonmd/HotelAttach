import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoProvider, useDemo } from './auth/demo-context';
import { Layout } from './components/Layout';
import { AccessDenied } from './components/AccessDenied';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { DutyOfCarePage } from './pages/DutyOfCarePage';
import { EngagementPage } from './pages/EngagementPage';
import { EscalationsPage } from './pages/EscalationsPage';
import type { ReactNode } from 'react';

function GuardedRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}): React.JSX.Element {
  const { permissions } = useDemo();
  if (!permissions.dashboards.includes(path)) {
    return <AccessDenied />;
  }
  return <>{children}</>;
}

export function App(): React.JSX.Element {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/analytics/opportunities" replace />} />
            <Route
              path="/analytics/opportunities"
              element={
                <GuardedRoute path="/analytics/opportunities">
                  <OpportunitiesPage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/duty-of-care"
              element={
                <GuardedRoute path="/analytics/duty-of-care">
                  <DutyOfCarePage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/engagement"
              element={
                <GuardedRoute path="/analytics/engagement">
                  <EngagementPage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/escalations"
              element={
                <GuardedRoute path="/analytics/escalations">
                  <EscalationsPage />
                </GuardedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  );
}
