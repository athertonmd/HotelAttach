import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DemoProvider } from '../auth/demo-context';
import { Layout } from '../components/Layout';
import { OpportunitiesPage } from '../pages/OpportunitiesPage';
import { DutyOfCarePage } from '../pages/DutyOfCarePage';
import { EngagementPage } from '../pages/EngagementPage';
import { EscalationsPage } from '../pages/EscalationsPage';

function renderWithRouter(initialRoute: string): ReturnType<typeof render> {
  return render(
    <DemoProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/analytics/opportunities" element={<OpportunitiesPage />} />
            <Route path="/analytics/duty-of-care" element={<DutyOfCarePage />} />
            <Route path="/analytics/engagement" element={<EngagementPage />} />
            <Route path="/analytics/escalations" element={<EscalationsPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </DemoProvider>,
  );
}

describe('Analytics Portal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders opportunities page', async () => {
    renderWithRouter('/analytics/opportunities');
    await waitFor(() => {
      expect(screen.getByText('Opportunity Operations')).toBeDefined();
    });
  });

  it('renders duty of care page', async () => {
    renderWithRouter('/analytics/duty-of-care');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Duty of Care' })).toBeDefined();
    });
  });

  it('renders engagement page', async () => {
    renderWithRouter('/analytics/engagement');
    await waitFor(() => {
      expect(screen.getByText('Traveller Engagement')).toBeDefined();
    });
  });

  it('renders escalations page', async () => {
    renderWithRouter('/analytics/escalations');
    await waitFor(() => {
      expect(screen.getByText('Agent Escalations')).toBeDefined();
    });
  });

  it('renders navigation sidebar', () => {
    renderWithRouter('/analytics/opportunities');
    expect(screen.getByText('Opportunities')).toBeDefined();
    expect(screen.getByText('Duty of Care')).toBeDefined();
    expect(screen.getByText('Engagement')).toBeDefined();
    expect(screen.getByText('Escalations')).toBeDefined();
  });
});
