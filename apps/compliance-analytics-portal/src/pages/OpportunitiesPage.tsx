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
import { formatCurrency, formatDate } from '../utils/formatters';

const defaultClient = createMockClient({ delay: 0 });

const PAGE_SIZE = 10;

const TABLE_COLUMNS = [
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

  const formattedRows = items.map((item) => ({
    ...item,
    departureDate: formatDate(item.departureDate),
    estimatedCommission: formatCurrency(item.estimatedCommission),
  }));

  return (
    <div>
      <PageHeader
        title="Opportunity Operations"
        description="Active pipeline and compliance opportunities"
      />

      <div
        data-testid="kpi-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard
          title="Active Opportunities"
          value={summary.activeCount}
          trend="up"
          subtitle="+3 this week"
        />
        <KpiCard
          title="Critical"
          value={summary.criticalCount}
          variant="danger"
          trend="down"
          subtitle="-2 from last week"
        />
        <KpiCard
          title="Awaiting Action"
          value={summary.awaitingActionCount}
          variant="warning"
          trend="stable"
        />
        <KpiCard
          title="At Risk"
          value={summary.atRiskCount}
          variant="danger"
          trend="up"
          subtitle="Departing within 48h"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          data-testid="priority-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By Priority</h3>
          <div className="space-y-2">
            {Object.entries(summary.byPriority).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <StatusBadge status={key as 'critical' | 'high' | 'medium' | 'low'} />
                <span className="text-sm font-medium text-slate-600">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div
          data-testid="type-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By Type</h3>
          <div className="space-y-2">
            {Object.entries(summary.byType).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-slate-700">{val}</span>
              </div>
            ))}
          </div>
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
        rows={formattedRows as unknown as Record<string, unknown>[]}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
