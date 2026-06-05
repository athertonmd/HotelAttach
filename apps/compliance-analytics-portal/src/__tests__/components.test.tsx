import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { FilterBar } from '../components/FilterBar';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Active Opportunities" value={42} />);
    expect(screen.getByText('Active Opportunities')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
  ];

  it('renders rows', () => {
    const rows = [
      { name: 'Opp 1', status: 'active' },
      { name: 'Opp 2', status: 'closed' },
    ];
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText('Opp 1')).toBeDefined();
    expect(screen.getByText('Opp 2')).toBeDefined();
  });

  it('renders empty state when no rows', () => {
    render(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByTestId('table-empty')).toBeDefined();
  });

  it('renders loading state', () => {
    render(<DataTable columns={columns} rows={[]} loading />);
    expect(screen.getByTestId('table-loading')).toBeDefined();
  });
});

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeDefined();
  });
});

describe('FilterBar', () => {
  it('renders filter controls', () => {
    render(<FilterBar />);
    expect(screen.getByLabelText('Priority')).toBeDefined();
    expect(screen.getByLabelText('Type')).toBeDefined();
    expect(screen.getByLabelText('Status')).toBeDefined();
  });
});

describe('StatusBadge', () => {
  it('renders known status', () => {
    render(<StatusBadge status="critical" />);
    expect(screen.getByText('critical')).toBeDefined();
  });

  it('formats status with underscores', () => {
    render(<StatusBadge status="awaiting_action" />);
    expect(screen.getByText('awaiting action')).toBeDefined();
  });
});

describe('ErrorState', () => {
  it('renders error message', () => {
    render(<ErrorState message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });
});

describe('EmptyState', () => {
  it('renders default message', () => {
    render(<EmptyState />);
    expect(screen.getByText('No data available')).toBeDefined();
  });
});

describe('LoadingState', () => {
  it('renders loading indicator', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeDefined();
  });
});
