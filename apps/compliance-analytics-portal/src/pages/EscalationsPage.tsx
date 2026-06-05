import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type { EscalationSummary } from '../api/types';

const defaultClient = createMockClient({ delay: 0 });

const ESCALATION_COLUMNS = [
  { key: 'reason', header: 'Reason' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
  { key: 'assignedAgentId', header: 'Assigned Agent' },
];

interface EscalationsPageProps {
  client?: MockClient;
}

export function EscalationsPage({
  client = defaultClient,
}: EscalationsPageProps): React.JSX.Element {
  const [summary, setSummary] = useState<EscalationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const result = await client.getEscalationSummary();
    if (!result.success) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    setSummary(result.data);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!summary) return <EmptyState />;

  return (
    <div>
      <PageHeader
        title="Agent Escalations"
        description="Escalation queue and agent workload monitoring"
      />

      <div
        data-testid="kpi-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard
          title="Pending"
          value={summary.pendingCount}
          variant="warning"
          trend="down"
          subtitle="-3 from yesterday"
        />
        <KpiCard
          title="Total Escalations"
          value={summary.totalCount}
          trend="up"
          subtitle="All time"
        />
        <KpiCard title="Critical" value={summary.criticalCount} variant="danger" trend="stable" />
        <KpiCard
          title="Assigned"
          value={summary.assignedCount}
          variant="success"
          trend="up"
          subtitle="Across 8 agents"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          data-testid="priority-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By Priority</h3>
          {Object.keys(summary.byPriority).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {Object.entries(summary.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{priority}</span>
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          data-testid="reason-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By Reason</h3>
          {Object.keys(summary.byReason).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {Object.entries(summary.byReason).map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{reason.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div data-testid="escalation-table-section">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Escalation Queue</h3>
        {summary.escalations.length === 0 ? (
          <EmptyState />
        ) : (
          <DataTable
            columns={ESCALATION_COLUMNS}
            rows={summary.escalations as unknown as Record<string, unknown>[]}
          />
        )}
      </div>
    </div>
  );
}
