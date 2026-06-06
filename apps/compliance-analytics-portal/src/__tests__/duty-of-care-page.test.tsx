import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DutyOfCarePage } from '../pages/DutyOfCarePage';
import { createMockClient, type MockClient } from '../api/mock-client';
import { createTestMockClient } from './test-mock-client';

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
    expect(kpiSection.textContent).toContain('48');
    expect(kpiSection.textContent).toContain('High-Risk Unresolved');
    expect(kpiSection.textContent).toContain('11');
    expect(kpiSection.textContent).toContain('Approaching Departure');
    expect(kpiSection.textContent).toContain('8');
  });

  it('renders unresolved gaps by destination', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('destination-breakdown')).toBeDefined();
    });
    const breakdown = screen.getByTestId('destination-breakdown');
    expect(breakdown.textContent).toContain('London');
    expect(breakdown.textContent).toContain('9');
    expect(breakdown.textContent).toContain('New York');
    expect(breakdown.textContent).toContain('Paris');
  });

  it('renders high-risk count in KPI', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('11');
  });

  it('renders approaching departure list', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('approaching-departure-section')).toBeDefined();
    });
    expect(screen.getByTestId('data-table')).toBeDefined();
    // Table should have rows from generated data
    const table = screen.getByTestId('data-table');
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(8);
  });

  it('loading state renders', () => {
    renderPage(createMockClient({ delay: 10000 }));
    expect(screen.getByTestId('loading-state')).toBeDefined();
  });

  it('error state renders', async () => {
    const errorClient = createTestMockClient({
      getDutyOfCareSummary: async () => ({
        success: false as const,
        correlationId: '3',
        error: { code: 'ERR', message: 'Failed to load duty of care data' },
      }),
    });

    renderPage(errorClient);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeDefined();
    });
    expect(screen.getByText('Failed to load duty of care data')).toBeDefined();
  });

  it('empty state renders when no data', async () => {
    const emptyClient = createTestMockClient({
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
    });

    renderPage(emptyClient);

    await waitFor(() => {
      expect(screen.getByTestId('approaching-departure-section')).toBeDefined();
    });
    // Empty states shown in both sections when lists are empty
    const emptyStates = screen.getAllByTestId('empty-state');
    expect(emptyStates.length).toBeGreaterThanOrEqual(1);
  });
});
