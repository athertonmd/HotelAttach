import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EscalationsPage } from '../pages/EscalationsPage';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';

function renderPage(client?: MockClient): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/analytics/escalations']}>
      <Routes>
        <Route path="/analytics/escalations" element={<EscalationsPage client={client} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EscalationsPage', () => {
  it('renders KPI cards with summary data', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('Pending');
    expect(kpiSection.textContent).toContain('14');
    expect(kpiSection.textContent).toContain('Total Escalations');
    expect(kpiSection.textContent).toContain('52');
    expect(kpiSection.textContent).toContain('Critical');
    expect(kpiSection.textContent).toContain('3');
    expect(kpiSection.textContent).toContain('Assigned');
    expect(kpiSection.textContent).toContain('9');
  });

  it('renders pending count in KPI', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('14');
  });

  it('renders priority breakdown', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('priority-breakdown')).toBeDefined();
    });
    const breakdown = screen.getByTestId('priority-breakdown');
    expect(breakdown.textContent).toContain('critical: 3');
    expect(breakdown.textContent).toContain('high: 5');
    expect(breakdown.textContent).toContain('medium: 4');
    expect(breakdown.textContent).toContain('low: 2');
  });

  it('renders reason breakdown', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('reason-breakdown')).toBeDefined();
    });
    const breakdown = screen.getByTestId('reason-breakdown');
    expect(breakdown.textContent).toContain('no response: 5');
    expect(breakdown.textContent).toContain('departure imminent: 4');
    expect(breakdown.textContent).toContain('policy escalation: 3');
    expect(breakdown.textContent).toContain('manual review: 2');
  });

  it('renders escalation table', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('escalation-table-section')).toBeDefined();
    });
    expect(screen.getByTestId('data-table')).toBeDefined();
    const tableSection = screen.getByTestId('escalation-table-section');
    expect(tableSection.textContent).toContain('agent-001');
    expect(tableSection.textContent).toContain('no_response');
    expect(tableSection.textContent).toContain('departure_imminent');
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
        error: { code: 'ERR', message: 'Failed' },
      }),
      getEscalationSummary: async () => ({
        success: false as const,
        correlationId: '5',
        error: { code: 'ERR', message: 'Failed to load escalation data' },
      }),
    };

    renderPage(errorClient);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeDefined();
    });
    expect(screen.getByText('Failed to load escalation data')).toBeDefined();
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
      expect(screen.getByTestId('escalation-table-section')).toBeDefined();
    });
    const emptyStates = screen.getAllByTestId('empty-state');
    expect(emptyStates.length).toBeGreaterThanOrEqual(1);
  });
});
