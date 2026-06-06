import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BehaviourPage } from '../pages/BehaviourPage';
import { createMockClient } from '../api/mock-client';

describe('BehaviourPage', () => {
  it('renders KPI cards after loading', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourPage client={client} />);

    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    expect(screen.getByText('Travellers Analysed')).toBeDefined();
    expect(screen.getByText('Avg Confidence')).toBeDefined();
    expect(screen.getByText('High Fatigue')).toBeDefined();
    expect(screen.getByText('Significant Drift')).toBeDefined();
    expect(screen.getByText('Revenue at Risk')).toBeDefined();
    expect(screen.getByText('Prediction Accuracy')).toBeDefined();
  });

  it('renders archetype distribution', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourPage client={client} />);

    await waitFor(() => {
      expect(screen.getByTestId('archetype-distribution')).toBeDefined();
    });
    expect(screen.getByText('Archetype Distribution')).toBeDefined();
    expect(screen.getByText('autopilot')).toBeDefined();
  });

  it('renders segment distribution', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourPage client={client} />);

    await waitFor(() => {
      expect(screen.getByTestId('segment-distribution')).toBeDefined();
    });
    expect(screen.getByText('Segment Distribution')).toBeDefined();
  });

  it('renders fatigue distribution', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourPage client={client} />);

    await waitFor(() => {
      expect(screen.getByTestId('fatigue-distribution')).toBeDefined();
    });
  });

  it('renders revenue risk section', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourPage client={client} />);

    await waitFor(() => {
      expect(screen.getByTestId('revenue-risk-section')).toBeDefined();
    });
    expect(screen.getByText('Top Revenue at Risk Travellers')).toBeDefined();
  });

  it('renders action performance section', async () => {
    const client = createMockClient({ delay: 0 });
    render(<BehaviourPage client={client} />);

    await waitFor(() => {
      expect(screen.getByTestId('action-performance')).toBeDefined();
    });
    expect(screen.getByText('Recommendation Performance')).toBeDefined();
  });

  it('renders loading state initially', () => {
    const client = createMockClient({ delay: 5000 });
    render(<BehaviourPage client={client} />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders error state on failure', async () => {
    const client = createMockClient({ delay: 0, simulateError: true });
    render(<BehaviourPage client={client} />);

    await waitFor(() => {
      expect(screen.getByText('Simulated server error')).toBeDefined();
    });
  });
});
