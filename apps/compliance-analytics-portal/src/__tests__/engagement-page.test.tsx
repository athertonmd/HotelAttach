import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EngagementPage } from '../pages/EngagementPage';
import { createMockClient, type MockClient } from '../api/mock-client';
import { createTestMockClient } from './test-mock-client';

function renderPage(client?: MockClient): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/analytics/engagement']}>
      <Routes>
        <Route path="/analytics/engagement" element={<EngagementPage client={client} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EngagementPage', () => {
  it('renders KPI cards with summary data', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('Communications Sent');
    expect(kpiSection.textContent).toContain('247');
    expect(kpiSection.textContent).toContain('Response Rate');
    expect(kpiSection.textContent).toContain('57%');
    expect(kpiSection.textContent).toContain('Conversion Rate');
    expect(kpiSection.textContent).toContain('23%');
    expect(kpiSection.textContent).toContain('Escalations');
    expect(kpiSection.textContent).toContain('20');
  });

  it('renders response rate in KPI', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('57%');
    expect(kpiSection.textContent).toContain('142 responses');
  });

  it('renders channel breakdown', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('channel-breakdown')).toBeDefined();
    });
    const breakdown = screen.getByTestId('channel-breakdown');
    expect(breakdown.textContent).toContain('email');
    expect(breakdown.textContent).toContain('148');
    expect(breakdown.textContent).toContain('sms');
    expect(breakdown.textContent).toContain('52');
  });

  it('renders response type breakdown', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('response-type-breakdown')).toBeDefined();
    });
    const breakdown = screen.getByTestId('response-type-breakdown');
    expect(breakdown.textContent).toContain('accepted');
    expect(breakdown.textContent).toContain('58');
    expect(breakdown.textContent).toContain('declined');
    expect(breakdown.textContent).toContain('34');
  });

  it('loading state renders', () => {
    renderPage(createMockClient({ delay: 10000 }));
    expect(screen.getByTestId('loading-state')).toBeDefined();
  });

  it('error state renders', async () => {
    const errorClient = createTestMockClient({
      getEngagementSummary: async () => ({
        success: false as const,
        correlationId: '4',
        error: { code: 'ERR', message: 'Failed to load engagement data' },
      }),
    });

    renderPage(errorClient);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeDefined();
    });
    expect(screen.getByText('Failed to load engagement data')).toBeDefined();
  });

  it('empty state renders when no data', async () => {
    const emptyClient = createTestMockClient({
      getEngagementSummary: async () => ({
        success: true as const,
        correlationId: '4',
        data: {
          communicationsSent: 0,
          responsesReceived: 0,
          bookingsCreated: 0,
          responseRate: 0,
          conversionRate: 0,
          escalationCount: 0,
          byChannel: {},
          byType: {},
          responsesByType: {},
        },
      }),
    });

    renderPage(emptyClient);

    await waitFor(() => {
      expect(screen.getByTestId('channel-breakdown')).toBeDefined();
    });
    const emptyStates = screen.getAllByTestId('empty-state');
    expect(emptyStates.length).toBeGreaterThanOrEqual(1);
  });
});
