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
  { key: 'escalationId', header: 'ID' },
  { key: 'opportunityId', header: 'Opportunity' },
  { key: 'travellerId', header: 'Traveller' },
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
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}
      >
        <KpiCard title="Pending" value={summary.pendingCount} variant="warning" />
        <KpiCard title="Total Escalations" value={summary.totalCount} />
        <KpiCard title="Critical" value={summary.criticalCount} variant="danger" />
        <KpiCard title="Assigned" value={summary.assignedCount} variant="success" />
      </div>

      <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        <div data-testid="priority-breakdown">
          <h3>By Priority</h3>
          {Object.keys(summary.byPriority).length === 0 ? (
            <EmptyState />
          ) : (
            <ul>
              {Object.entries(summary.byPriority).map(([priority, count]) => (
                <li key={priority}>
                  {priority}: {count}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div data-testid="reason-breakdown">
          <h3>By Reason</h3>
          {Object.keys(summary.byReason).length === 0 ? (
            <EmptyState />
          ) : (
            <ul>
              {Object.entries(summary.byReason).map(([reason, count]) => (
                <li key={reason}>
                  {reason.replace(/_/g, ' ')}: {count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div data-testid="escalation-table-section">
        <h3>Escalation Queue</h3>
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
