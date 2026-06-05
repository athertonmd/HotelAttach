import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type { EngagementSummary } from '../api/types';

const defaultClient = createMockClient({ delay: 0 });

interface EngagementPageProps {
  client?: MockClient;
}

export function EngagementPage({ client = defaultClient }: EngagementPageProps): React.JSX.Element {
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const result = await client.getEngagementSummary();

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
        title="Traveller Engagement"
        description="Communication funnel and response analytics"
      />

      <div
        data-testid="kpi-section"
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}
      >
        <KpiCard title="Communications Sent" value={summary.communicationsSent} />
        <KpiCard
          title="Response Rate"
          value={`${summary.responseRate}%`}
          subtitle={`${summary.responsesReceived} responses`}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${summary.conversionRate}%`}
          subtitle={`${summary.bookingsCreated} bookings`}
          variant="success"
        />
        <KpiCard title="Escalations" value={summary.escalationCount} variant="warning" />
      </div>

      <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        <div data-testid="channel-breakdown">
          <h3>By Channel</h3>
          {Object.keys(summary.byChannel).length === 0 ? (
            <EmptyState />
          ) : (
            <ul>
              {Object.entries(summary.byChannel).map(([channel, count]) => (
                <li key={channel}>
                  {channel.replace(/_/g, ' ')}: {count}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div data-testid="type-breakdown">
          <h3>By Type</h3>
          {Object.keys(summary.byType).length === 0 ? (
            <EmptyState />
          ) : (
            <ul>
              {Object.entries(summary.byType).map(([type, count]) => (
                <li key={type}>
                  {type.replace(/_/g, ' ')}: {count}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div data-testid="response-type-breakdown">
          <h3>Responses by Type</h3>
          {Object.keys(summary.responsesByType).length === 0 ? (
            <EmptyState />
          ) : (
            <ul>
              {Object.entries(summary.responsesByType).map(([type, count]) => (
                <li key={type}>
                  {type.replace(/_/g, ' ')}: {count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
