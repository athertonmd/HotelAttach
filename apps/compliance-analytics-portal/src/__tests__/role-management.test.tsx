import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider, useDemo } from '../auth/demo-context';
import { Layout } from '../components/Layout';
import { AccessDenied } from '../components/AccessDenied';
import { DemoBanner } from '../components/DemoBanner';
import { RoleSelector } from '../components/RoleSelector';
import { TenantSelector } from '../components/TenantSelector';
import { OpportunitiesPage } from '../pages/OpportunitiesPage';
import { EscalationsPage } from '../pages/EscalationsPage';
import { DEMO_USERS } from '../auth/demo-users';
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

function renderWithProviders(
  initialRoute: string,
  initialUserId = 'user-001',
): ReturnType<typeof render> {
  localStorage.setItem('hci-demo-user-id', initialUserId);
  return render(
    <DemoProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/analytics/opportunities"
              element={
                <GuardedRoute path="/analytics/opportunities">
                  <OpportunitiesPage />
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
      </MemoryRouter>
    </DemoProvider>,
  );
}

describe('Role Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('RoleSelector renders with all demo users', () => {
    render(
      <DemoProvider>
        <RoleSelector />
      </DemoProvider>,
    );
    const select = screen.getByLabelText('Role') as HTMLSelectElement;
    expect(select).toBeDefined();
    expect(select.options).toHaveLength(DEMO_USERS.length);
  });

  it('role selection changes the displayed user', async () => {
    const user = userEvent.setup();
    render(
      <DemoProvider>
        <RoleSelector />
        <DemoBanner />
      </DemoProvider>,
    );
    const select = screen.getByLabelText('Role');
    // Switch to the Corporate User (user-005)
    await user.selectOptions(select, 'user-005');
    expect(screen.getByText('MikeCorpUser@Corp.com')).toBeDefined();
  });

  it('dashboard navigation hides items for restricted roles', () => {
    // Corporate user (user-005) should not see Escalations
    renderWithProviders('/analytics/opportunities', 'user-005');
    expect(screen.getByText('Opportunities')).toBeDefined();
    expect(screen.queryByText('Escalations')).toBeNull();
  });

  it('restricted route shows AccessDenied', () => {
    // Corporate user (user-005) cannot access escalations
    renderWithProviders('/analytics/escalations', 'user-005');
    expect(screen.getByText('Access Denied')).toBeDefined();
  });

  it('DemoBanner renders with "Demo Mode"', () => {
    render(
      <DemoProvider>
        <DemoBanner />
      </DemoProvider>,
    );
    expect(screen.getByText(/Demo Mode/)).toBeDefined();
  });

  it('tenant/corporate selector renders scoped controls', () => {
    // Platform admin should see TMC selector
    localStorage.setItem('hci-demo-user-id', 'user-001');
    render(
      <DemoProvider>
        <TenantSelector />
      </DemoProvider>,
    );
    expect(screen.getByLabelText('TMC Tenant')).toBeDefined();
    expect(screen.getByLabelText('Corporate')).toBeDefined();
  });

  it('corporate user does not see selectors', () => {
    localStorage.setItem('hci-demo-user-id', 'user-005');
    render(
      <DemoProvider>
        <TenantSelector />
      </DemoProvider>,
    );
    expect(screen.queryByLabelText('TMC Tenant')).toBeNull();
    expect(screen.queryByLabelText('Corporate')).toBeNull();
    // Shows fixed labels instead
    expect(screen.getByText('GlobalCorp Inc.')).toBeDefined();
  });

  it('mock data still loads on accessible pages', async () => {
    renderWithProviders('/analytics/opportunities', 'user-001');
    await waitFor(() => {
      expect(screen.getByText('Opportunity Operations')).toBeDefined();
    });
  });
});
