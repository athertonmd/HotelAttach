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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard
          title="Communications Sent"
          value={summary.communicationsSent}
          trend="up"
          subtitle="+18 this week"
        />
        <KpiCard
          title="Response Rate"
          value={`${summary.responseRate}%`}
          subtitle={`${summary.responsesReceived} responses`}
          trend="up"
        />
        <KpiCard
          title="Conversion Rate"
          value={`${summary.conversionRate}%`}
          subtitle={`${summary.bookingsCreated} bookings`}
          variant="success"
          trend="stable"
        />
        <KpiCard
          title="Escalations"
          value={summary.escalationCount}
          variant="warning"
          trend="down"
          subtitle="-2 from last week"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          data-testid="channel-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By Channel</h3>
          {Object.keys(summary.byChannel).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {Object.entries(summary.byChannel).map(([channel, count]) => (
                <div key={channel} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{channel.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          data-testid="type-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">By Type</h3>
          {Object.keys(summary.byType).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {Object.entries(summary.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{type.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          data-testid="response-type-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Responses by Type</h3>
          {Object.keys(summary.responsesByType).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {Object.entries(summary.responsesByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{type.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
