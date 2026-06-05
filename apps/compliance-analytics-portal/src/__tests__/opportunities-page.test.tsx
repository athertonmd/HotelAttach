import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OpportunitiesPage } from '../pages/OpportunitiesPage';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';

function renderPage(client?: MockClient): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/analytics/opportunities']}>
      <Routes>
        <Route path="/analytics/opportunities" element={<OpportunitiesPage client={client} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OpportunitiesPage', () => {
  it('renders KPI cards with summary data', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByText('Active Opportunities')).toBeDefined();
    });
    const kpiSection = screen.getByTestId('kpi-section');
    expect(kpiSection.textContent).toContain('Active Opportunities');
    expect(kpiSection.textContent).toContain('47');
    expect(kpiSection.textContent).toContain('Critical');
    expect(kpiSection.textContent).toContain('8');
    expect(kpiSection.textContent).toContain('Awaiting Action');
    expect(kpiSection.textContent).toContain('12');
    expect(kpiSection.textContent).toContain('At Risk');
    expect(kpiSection.textContent).toContain('5');
  });

  it('renders opportunity table with rows', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeDefined();
    });
    // First page shows PAGE_SIZE (3) items
    expect(screen.getByText('London')).toBeDefined();
    expect(screen.getByText('Paris')).toBeDefined();
    expect(screen.getByText('Berlin')).toBeDefined();
  });

  it('priority filter changes results', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeDefined();
    });

    const prioritySelect = screen.getByLabelText('Priority');
    fireEvent.change(prioritySelect, { target: { value: 'critical' } });

    await waitFor(() => {
      expect(screen.getByText('London')).toBeDefined();
      expect(screen.getByText('Mumbai')).toBeDefined();
    });
    // Non-critical should not be visible
    expect(screen.queryByText('Paris')).toBeNull();
  });

  it('lifecycleState filter changes results', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('data-table')).toBeDefined();
    });

    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'awaiting_action' } });

    await waitFor(() => {
      expect(screen.getByText('London')).toBeDefined();
      expect(screen.getByText('New York')).toBeDefined();
    });
    expect(screen.queryByText('Paris')).toBeNull();
  });

  it('pagination works', async () => {
    renderPage(createMockClient({ delay: 0 }));
    await waitFor(() => {
      expect(screen.getByTestId('table-pagination')).toBeDefined();
    });

    // Page 1 shows first 3
    expect(screen.getByText('London')).toBeDefined();
    expect(screen.queryByText('New York')).toBeNull();

    // Go to page 2
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('New York')).toBeDefined();
    });
    expect(screen.queryByText('London')).toBeNull();
  });

  it('loading state renders', () => {
    // Use a long delay so the component stays in loading state
    renderPage(createMockClient({ delay: 10000 }));
    expect(screen.getByTestId('loading-state')).toBeDefined();
  });

  it('error state renders', async () => {
    const errorClient: MockClient = {
      getOpportunitySummary: async () => ({
        success: false as const,
        correlationId: '123',
        error: { code: 'ERR', message: 'Failed to load opportunities' },
      }),
      getOpportunityList: async () => ({
        success: false as const,
        correlationId: '456',
        error: { code: 'ERR', message: 'Failed to load opportunities' },
      }),
      getDutyOfCareSummary: async () => ({
        success: false as const,
        correlationId: '789',
        error: { code: 'ERR', message: 'Failed' },
      }),
      getEngagementSummary: async () => ({
        success: false as const,
        correlationId: '012',
        error: { code: 'ERR', message: 'Failed' },
      }),
      getEscalationSummary: async () => ({
        success: false as const,
        correlationId: '345',
        error: { code: 'ERR', message: 'Failed' },
      }),
    };

    renderPage(errorClient);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeDefined();
    });
    expect(screen.getByText('Failed to load opportunities')).toBeDefined();
  });
});
