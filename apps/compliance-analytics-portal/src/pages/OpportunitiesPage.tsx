import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { FilterBar } from '../components/FilterBar';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/StatusBadge';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type { OpportunitySummary, OpportunityListItem } from '../api/types';

const defaultClient = createMockClient({ delay: 0 });

const PAGE_SIZE = 3;

const TABLE_COLUMNS = [
  { key: 'opportunityId', header: 'ID' },
  { key: 'opportunityType', header: 'Type' },
  { key: 'priority', header: 'Priority' },
  { key: 'lifecycleState', header: 'Status' },
  { key: 'destination', header: 'Destination' },
  { key: 'departureDate', header: 'Departure' },
  { key: 'estimatedCommission', header: 'Est. Commission' },
];

interface OpportunitiesPageProps {
  client?: MockClient;
}

export function OpportunitiesPage({
  client = defaultClient,
}: OpportunitiesPageProps): React.JSX.Element {
  const [summary, setSummary] = useState<OpportunitySummary | null>(null);
  const [items, setItems] = useState<OpportunityListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const [summaryResult, listResult] = await Promise.all([
      client.getOpportunitySummary(),
      client.getOpportunityList({
        priority: priorityFilter || undefined,
        state: stateFilter || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    ]);

    if (!summaryResult.success) {
      setError(summaryResult.error.message);
      setLoading(false);
      return;
    }
    if (!listResult.success) {
      setError(listResult.error.message);
      setLoading(false);
      return;
    }

    setSummary(summaryResult.data);
    setItems(listResult.data.items);
    setTotal(listResult.data.total);
    setLoading(false);
  }, [priorityFilter, stateFilter, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!summary) return <ErrorState message="No data available" />;

  return (
    <div>
      <PageHeader
        title="Opportunity Operations"
        description="Active pipeline and compliance opportunities"
      />

      <div
        data-testid="kpi-section"
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}
      >
        <KpiCard title="Active Opportunities" value={summary.activeCount} />
        <KpiCard title="Critical" value={summary.criticalCount} variant="danger" />
        <KpiCard title="Awaiting Action" value={summary.awaitingActionCount} variant="warning" />
        <KpiCard title="At Risk" value={summary.atRiskCount} variant="danger" />
      </div>

      <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        <div data-testid="priority-breakdown">
          <h3>By Priority</h3>
          <ul>
            {Object.entries(summary.byPriority).map(([key, val]) => (
              <li key={key}>
                <StatusBadge status={key as 'critical' | 'high' | 'medium' | 'low'} /> {val}
              </li>
            ))}
          </ul>
        </div>
        <div data-testid="type-breakdown">
          <h3>By Type</h3>
          <ul>
            {Object.entries(summary.byType).map(([key, val]) => (
              <li key={key}>
                {key.replace(/_/g, ' ')}: {val}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <FilterBar
        onPriorityChange={(v) => {
          setPriorityFilter(v);
          setPage(1);
        }}
        onStatusChange={(v) => {
          setStateFilter(v);
          setPage(1);
        }}
      />

      <DataTable
        columns={TABLE_COLUMNS}
        rows={items as unknown as Record<string, unknown>[]}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
