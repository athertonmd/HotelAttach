import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HotelAttachmentPage } from '../pages/HotelAttachmentPage';
import { createMockClient } from '../api/mock-client';

describe('HotelAttachmentPage', () => {
  it('renders renamed KPI labels', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('kpi-section')).toBeDefined();
    });
    expect(screen.getByText('Attachment Rate')).toBeDefined();
    expect(screen.getByText('Target Rate')).toBeDefined();
    expect(screen.getByText('Attachment Gap')).toBeDefined();
    expect(screen.getByText('Pending Assessment')).toBeDefined();
    expect(screen.getByText('Avg Booking Delay')).toBeDefined();
    expect(screen.getByText('Revenue Opportunity')).toBeDefined();
  });

  it('renders hero Attachment Rate card', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('hero-kpi')).toBeDefined();
    });
    const hero = screen.getByTestId('hero-kpi');
    expect(hero.textContent).toContain('78%');
    expect(hero.textContent).toContain('Attachment Rate');
  });

  it('renders corporate table sorted worst first', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('corporate-comparison')).toBeDefined();
    });
    // Column header renamed
    expect(screen.getByText('Distance from Target')).toBeDefined();
    // First row should be worst performer (Global Finance gap=14)
    const rows = screen.getByTestId('corporate-comparison').querySelectorAll('tbody tr');
    expect(rows[0]?.textContent).toContain('Global Finance');
  });

  it('renders Below Target count', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('below-target-count')).toBeDefined();
    });
    expect(screen.getByTestId('below-target-count').textContent).toContain('below target');
  });

  it('renders attachment curve with insight', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('attachment-curve')).toBeDefined();
    });
    expect(screen.getByTestId('curve-insight')).toBeDefined();
    expect(screen.getByTestId('curve-insight').textContent).toContain(
      'when intervention becomes useful',
    );
  });

  it('renders delay distribution with insight', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('delay-distribution')).toBeDefined();
    });
    expect(screen.getByTestId('delay-insight')).toBeDefined();
    expect(screen.getByTestId('delay-insight').textContent).toContain('grace period');
  });

  it('renders pending assessment info near KPI section', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('pending-assessment-info')).toBeDefined();
    });
    expect(screen.getByText('Pending Assessment — Grace Period')).toBeDefined();
  });

  it('renders demo data badge', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('demo-badge')).toBeDefined();
    });
    expect(screen.getByTestId('demo-badge').textContent).toContain('Demo Data');
  });

  it('renders last updated timestamp', async () => {
    const client = createMockClient({ delay: 0 });
    render(<HotelAttachmentPage client={client} />);
    await waitFor(() => {
      expect(screen.getByTestId('last-updated')).toBeDefined();
    });
    expect(screen.getByTestId('last-updated').textContent).toContain('07/06/2026');
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
