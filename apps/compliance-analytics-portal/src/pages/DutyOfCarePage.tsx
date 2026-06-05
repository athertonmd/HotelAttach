import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type { DutyOfCareSummary } from '../api/types';

const defaultClient = createMockClient({ delay: 0 });

const DEPARTURE_COLUMNS = [
  { key: 'destination', header: 'Destination' },
  { key: 'departureDate', header: 'Departure Date' },
  { key: 'riskLevel', header: 'Risk Level' },
  { key: 'tripId', header: 'Trip ID' },
];

interface DutyOfCarePageProps {
  client?: MockClient;
}

export function DutyOfCarePage({ client = defaultClient }: DutyOfCarePageProps): React.JSX.Element {
  const [summary, setSummary] = useState<DutyOfCareSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const result = await client.getDutyOfCareSummary();

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
        title="Duty of Care"
        description="Traveller accommodation visibility and risk monitoring"
      />

      <div
        data-testid="kpi-section"
        style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}
      >
        <KpiCard
          title="Visibility Rate"
          value={`${summary.visibilityRate}%`}
          subtitle={`${summary.resolvedCount} of ${summary.totalTrips} trips resolved`}
        />
        <KpiCard title="Unresolved Gaps" value={summary.unresolvedCount} variant="warning" />
        <KpiCard title="High-Risk Unresolved" value={summary.highRiskUnresolved} variant="danger" />
        <KpiCard
          title="Approaching Departure"
          value={summary.approachingDeparture}
          variant="danger"
          subtitle="Within 7 days"
        />
      </div>

      <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        <div data-testid="destination-breakdown">
          <h3>Gaps by Destination</h3>
          {Object.keys(summary.byDestination).length === 0 ? (
            <EmptyState />
          ) : (
            <ul>
              {Object.entries(summary.byDestination).map(([dest, count]) => (
                <li key={dest}>
                  {dest}: {count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div data-testid="approaching-departure-section">
        <h3>Trips Approaching Departure with Unresolved Gaps</h3>
        {summary.approachingDepartureList.length === 0 ? (
          <EmptyState />
        ) : (
          <DataTable
            columns={DEPARTURE_COLUMNS}
            rows={summary.approachingDepartureList.map((trip) => ({
              ...trip,
              riskLevel: trip.riskLevel,
            }))}
          />
        )}
      </div>
    </div>
  );
}
