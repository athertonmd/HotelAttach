import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DutyOfCarePage } from '../pages/DutyOfCarePage';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';

function renderPage(client?: MockClient): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/analytics/duty-of-care']}>
      <Routes>
        <Route path="/analytics/duty-of-care" element={<DutyOfCarePage client={client} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DutyOfCarePage', () => {
  it('renders KPI cards with summary data', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('Visibility Rate');
    expect(kpiSection.textContent).toContain('85%');
    expect(kpiSection.textContent).toContain('Unresolved Gaps');
    expect(kpiSection.textContent).toContain('36');
    expect(kpiSection.textContent).toContain('High-Risk Unresolved');
    expect(kpiSection.textContent).toContain('7');
    expect(kpiSection.textContent).toContain('Approaching Departure');
    expect(kpiSection.textContent).toContain('4');
  });

  it('renders unresolved gaps by destination', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('destination-breakdown')).toBeDefined();
    });
    const breakdown = screen.getByTestId('destination-breakdown');
    expect(breakdown.textContent).toContain('London: 8');
    expect(breakdown.textContent).toContain('Paris: 6');
    expect(breakdown.textContent).toContain('New York: 5');
  });

  it('renders high-risk count in KPI', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('7');
  });

  it('renders approaching departure list', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('approaching-departure-section')).toBeDefined();
    });
    expect(screen.getByTestId('data-table')).toBeDefined();
    expect(screen.getByText('London')).toBeDefined();
    expect(screen.getByText('Mumbai')).toBeDefined();
    expect(screen.getByText('2025-02-10')).toBeDefined();
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
        error: { code: 'ERR', message: 'Failed to load duty of care data' },
      }),
      getEngagementSummary: async () => ({
        success: false as const,
        correlationId: '4',
        error: { code: 'ERR', message: 'Failed' },
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
    expect(screen.getByText('Failed to load duty of care data')).toBeDefined();
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
        },
      }),
      getEscalationSummary: async () => ({
        success: true as const,
        correlationId: '5',
        data: { pendingCount: 0, totalCount: 0, byPriority: {}, byReason: {} },
      }),
    };

    renderPage(emptyClient);

    await waitFor(() => {
      expect(screen.getByTestId('approaching-departure-section')).toBeDefined();
    });
    // Empty states shown in both sections when lists are empty
    const emptyStates = screen.getAllByTestId('empty-state');
    expect(emptyStates.length).toBeGreaterThanOrEqual(1);
  });
});
