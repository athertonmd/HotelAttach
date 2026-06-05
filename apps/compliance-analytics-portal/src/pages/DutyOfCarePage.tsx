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
import { formatDate } from '../utils/formatters';

const defaultClient = createMockClient({ delay: 0 });

const DEPARTURE_COLUMNS = [
  { key: 'destination', header: 'Destination' },
  { key: 'departureDate', header: 'Departure Date' },
  { key: 'riskLevel', header: 'Risk Level' },
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard
          title="Visibility Rate"
          value={`${summary.visibilityRate}%`}
          subtitle={`${summary.resolvedCount} of ${summary.totalTrips} trips`}
          trend="up"
        />
        <KpiCard
          title="Unresolved Gaps"
          value={summary.unresolvedCount}
          variant="warning"
          trend="down"
          subtitle="-4 from last week"
        />
        <KpiCard
          title="High-Risk Unresolved"
          value={summary.highRiskUnresolved}
          variant="danger"
          trend="stable"
        />
        <KpiCard
          title="Approaching Departure"
          value={summary.approachingDeparture}
          variant="danger"
          trend="up"
          subtitle="Within 7 days"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div
          data-testid="destination-breakdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Gaps by Destination</h3>
          {Object.keys(summary.byDestination).length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {Object.entries(summary.byDestination).map(([dest, count]) => (
                <div key={dest} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{dest}</span>
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          data-testid="approaching-departure-section"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Approaching Departure</h3>
          {summary.approachingDepartureList.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable
              columns={DEPARTURE_COLUMNS}
              rows={summary.approachingDepartureList.map((trip) => ({
                ...trip,
                departureDate: formatDate(trip.departureDate),
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
