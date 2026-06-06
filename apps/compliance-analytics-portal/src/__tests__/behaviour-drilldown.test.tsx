import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BehaviourArchetypesPage } from '../pages/BehaviourArchetypesPage';
import { BehaviourFatiguePage } from '../pages/BehaviourFatiguePage';
import { createMockClient } from '../api/mock-client';

describe('BehaviourArchetypesPage', () => {
  it('renders KPI cards', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourArchetypesPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    expect(screen.getByText('Total Travellers')).toBeDefined();
    expect(screen.getByText('Avg Confidence')).toBeDefined();
  });

  it('renders archetype distribution', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourArchetypesPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('archetype-distribution')).toBeDefined();
    });
  });

  it('renders traveller table', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourArchetypesPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('traveller-table')).toBeDefined();
    });
  });

  it('renders archetype filter', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourArchetypesPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('archetype-filter')).toBeDefined();
    });
  });

  it('renders loading state', () => {
    const client = createMockClient({ delay: 5000 });
    render(<BehaviourArchetypesPage client={client} />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders error state', async () => {
    const client = createMockClient({ delay: 0, simulateError: true });
    render(<BehaviourArchetypesPage client={client} />);
    await waitFor(() => {
      expect(screen.getByText('Simulated server error')).toBeDefined();
    });
  });
});

describe('BehaviourFatiguePage', () => {
  it('renders KPI cards', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourFatiguePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    expect(screen.getByText('Low Fatigue')).toBeDefined();
    expect(screen.getByText('Critical Fatigue')).toBeDefined();
  });

  it('renders suppression summary', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourFatiguePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('suppression-summary')).toBeDefined();
    });
    expect(screen.getByText('Total Suppressions')).toBeDefined();
  });

  it('renders fatigue distribution', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourFatiguePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('fatigue-distribution')).toBeDefined();
    });
  });

  it('renders traveller table', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourFatiguePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('traveller-table')).toBeDefined();
    });
  });

  it('renders fatigue filter', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourFatiguePage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('fatigue-filter')).toBeDefined();
    });
  });

  it('renders loading state', () => {
    const client = createMockClient({ delay: 5000 });
    render(<BehaviourFatiguePage client={client} />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders error state', async () => {
    const client = createMockClient({ delay: 0, simulateError: true });
    render(<BehaviourFatiguePage client={client} />);
    await waitFor(() => {
      expect(screen.getByText('Simulated server error')).toBeDefined();
    });
  });
});
