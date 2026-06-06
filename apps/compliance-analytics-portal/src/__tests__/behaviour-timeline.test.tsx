import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BehaviourTimelinePage } from '../pages/BehaviourTimelinePage';
import { createMockClient } from '../api/mock-client';

describe('BehaviourTimelinePage', () => {
  it('renders KPI cards', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourTimelinePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    expect(screen.getByText('Avg Booking Lead')).toBeDefined();
    expect(screen.getByText('Avg Comm Lead')).toBeDefined();
    expect(screen.getByText('Comms Before Booking')).toBeDefined();
    expect(screen.getByText('Early Comms')).toBeDefined();
  });

  it('renders aggregate timeline', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourTimelinePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('aggregate-timeline')).toBeDefined();
    });
  });

  it('renders communication overlay insights', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourTimelinePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('communication-overlay')).toBeDefined();
    });
    expect(screen.getByText('Communication Timing Insights')).toBeDefined();
  });

  it('renders traveller table', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourTimelinePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('traveller-table')).toBeDefined();
    });
  });

  it('selecting traveller shows detail timeline', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourTimelinePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('traveller-table')).toBeDefined();
    });
    const row = screen.getByTestId('row-trav-001');
    fireEvent.click(row);
    await waitFor(() => {
      expect(screen.getByTestId('traveller-detail')).toBeDefined();
    });
  });

  it('renders loading state', () => {
    const client = createMockClient({ delay: 5000 });
    render(<BehaviourTimelinePage client={client} />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders error state', async () => {
    const client = createMockClient({ delay: 0, simulateError: true });
    render(<BehaviourTimelinePage client={client} />);
    await waitFor(() => {
      expect(screen.getByText('Simulated server error')).toBeDefined();
    });
  });
});
