import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EngagementPage } from '../pages/EngagementPage';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';

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
    const errorClient: MockClient = {
      getOpportunitySummary: async () => ({
        success: false as const,
        correlationId: '1',
        error: { code: 'ERR', message: 'Failed' },
      }),
      getOpportunityList: async () => ({
        success: false as const,
        correlationId: '2',
        error: { code: 'ERR', message: 'Failed' },
      }),
      getDutyOfCareSummary: async () => ({
        success: false as const,
        correlationId: '3',
        error: { code: 'ERR', message: 'Failed' },
      }),
      getEngagementSummary: async () => ({
        success: false as const,
        correlationId: '4',
        error: { code: 'ERR', message: 'Failed to load engagement data' },
      }),
      getEscalationSummary: async () => ({
        success: false as const,
        correlationId: '5',
        error: { code: 'ERR', message: 'Failed' },
      }),
    };

    renderPage(errorClient);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeDefined();
    });
    expect(screen.getByText('Failed to load engagement data')).toBeDefined();
  });

  it('empty state renders when no data', async () => {
    const emptyClient: MockClient = {
      getOpportunitySummary: async () => ({
        success: true as const,
        correlationId: '1',
        data: {
          activeCount: 0,
          criticalCount: 0,
          awaitingActionCount: 0,
          atRiskCount: 0,
          byPriority: {},
          byType: {},
        },
      }),
      getOpportunityList: async () => ({
        success: true as const,
        correlationId: '2',
        data: { items: [], total: 0 },
      }),
      getDutyOfCareSummary: async () => ({
        success: true as const,
        correlationId: '3',
        data: {
          totalTrips: 0,
          resolvedCount: 0,
          unresolvedCount: 0,
          visibilityRate: 100,
          highRiskUnresolved: 0,
          approachingDeparture: 0,
          byDestination: {},
          approachingDepartureList: [],
        },
      }),
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
      getEscalationSummary: async () => ({
        success: true as const,
        correlationId: '5',
        data: {
          pendingCount: 0,
          totalCount: 0,
          criticalCount: 0,
          assignedCount: 0,
          byPriority: {},
          byReason: {},
          escalations: [],
        },
      }),
    };

    renderPage(emptyClient);

    await waitFor(() => {
      expect(screen.getByTestId('channel-breakdown')).toBeDefined();
    });
    const emptyStates = screen.getAllByTestId('empty-state');
    expect(emptyStates.length).toBeGreaterThanOrEqual(1);
  });
});
