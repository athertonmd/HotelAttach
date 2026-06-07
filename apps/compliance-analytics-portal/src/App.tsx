import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DemoProvider, useDemo } from './auth/demo-context';
import { Layout } from './components/Layout';
import { AccessDenied } from './components/AccessDenied';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { DutyOfCarePage } from './pages/DutyOfCarePage';
import { EngagementPage } from './pages/EngagementPage';
import { EscalationsPage } from './pages/EscalationsPage';
import { BehaviourPage } from './pages/BehaviourPage';
import { BehaviourArchetypesPage } from './pages/BehaviourArchetypesPage';
import { BehaviourFatiguePage } from './pages/BehaviourFatiguePage';
import { BehaviourTimelinePage } from './pages/BehaviourTimelinePage';
import { HotelAttachmentPage } from './pages/HotelAttachmentPage';
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
            <Route
              path="/analytics/behaviour"
              element={
                <GuardedRoute path="/analytics/behaviour">
                  <BehaviourPage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/behaviour/archetypes"
              element={
                <GuardedRoute path="/analytics/behaviour">
                  <BehaviourArchetypesPage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/behaviour/fatigue"
              element={
                <GuardedRoute path="/analytics/behaviour">
                  <BehaviourFatiguePage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/behaviour/revenue-risk"
              element={
                <GuardedRoute path="/analytics/behaviour">
                  <BehaviourPage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/behaviour/recommendations"
              element={
                <GuardedRoute path="/analytics/behaviour">
                  <BehaviourPage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/behaviour/timeline"
              element={
                <GuardedRoute path="/analytics/behaviour">
                  <BehaviourTimelinePage />
                </GuardedRoute>
              }
            />
            <Route
              path="/analytics/hotel-attachment"
              element={
                <GuardedRoute path="/analytics/hotel-attachment">
                  <HotelAttachmentPage />
                </GuardedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  );
}
