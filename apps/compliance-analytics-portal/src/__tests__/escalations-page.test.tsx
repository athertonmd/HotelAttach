import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { EscalationsPage } from '../pages/EscalationsPage';
import { createMockClient, type MockClient } from '../api/mock-client';
import { createTestMockClient } from './test-mock-client';

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
    expect(kpiSection.textContent).toContain('5');
    expect(kpiSection.textContent).toContain('Assigned');
    expect(kpiSection.textContent).toContain('12');
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
    expect(breakdown.textContent).toContain('critical');
    expect(breakdown.textContent).toContain('5');
    expect(breakdown.textContent).toContain('high');
    expect(breakdown.textContent).toContain('7');
  });

  it('renders reason breakdown', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('reason-breakdown')).toBeDefined();
    });
    const breakdown = screen.getByTestId('reason-breakdown');
    expect(breakdown.textContent).toContain('no response');
    expect(breakdown.textContent).toContain('6');
    expect(breakdown.textContent).toContain('departure imminent');
    expect(breakdown.textContent).toContain('5');
  });

  it('renders escalation table', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('escalation-table-section')).toBeDefined();
    });
    expect(screen.getByTestId('data-table')).toBeDefined();
    const tableSection = screen.getByTestId('escalation-table-section');
    // 20 escalations from generated data
    const rows = tableSection.querySelectorAll('tbody tr');
    expect(rows.length).toBe(20);
  });

  it('loading state renders', () => {
    renderPage(createMockClient({ delay: 10000 }));
    expect(screen.getByTestId('loading-state')).toBeDefined();
  });

  it('error state renders', async () => {
    const errorClient = createTestMockClient({
      getEscalationSummary: async () => ({
        success: false as const,
        correlationId: '5',
        error: { code: 'ERR', message: 'Failed to load escalation data' },
      }),
    });

    renderPage(errorClient);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeDefined();
    });
    expect(screen.getByText('Failed to load escalation data')).toBeDefined();
  });

  it('empty state renders when no data', async () => {
    const emptyClient = createTestMockClient({
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
    });

    renderPage(emptyClient);

    await waitFor(() => {
      expect(screen.getByTestId('escalation-table-section')).toBeDefined();
    });
    const emptyStates = screen.getAllByTestId('empty-state');
    expect(emptyStates.length).toBeGreaterThanOrEqual(1);
  });
});
