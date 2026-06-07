import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HotelAttachmentPage } from '../pages/HotelAttachmentPage';
import { createMockClient } from '../api/mock-client';

describe('HotelAttachmentPage', () => {
  it('renders KPI cards', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    expect(screen.getByText('Current Rate')).toBeDefined();
    expect(screen.getByText('Target Rate')).toBeDefined();
    expect(screen.getByText('Attachment Gap')).toBeDefined();
    expect(screen.getByText('Pending Assessment')).toBeDefined();
    expect(screen.getByText('Avg Delay')).toBeDefined();
    expect(screen.getByText('Revenue Impact')).toBeDefined();
  });

  it('renders attachment curve', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('attachment-curve')).toBeDefined();
    });
  });

  it('renders corporate comparison', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('corporate-comparison')).toBeDefined();
    });
    expect(screen.getByText('Acme Corp')).toBeDefined();
  });

  it('renders delay distribution', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('delay-distribution')).toBeDefined();
    });
  });

  it('renders pending assessment info tile', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pending-assessment-info')).toBeDefined();
    });
    expect(screen.getByText('Pending Assessment — Grace Period')).toBeDefined();
  });

  it('renders loading state', () => {
    const client = createMockClient({ delay: 5000 });
    render(<HotelAttachmentPage client={client} />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders error state', async () => {
    const client = createMockClient({ delay: 0, simulateError: true });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByText('Simulated server error')).toBeDefined();
    });
  });
});
