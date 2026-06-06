import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type {
  BehaviourOverviewSummary,
  ArchetypeDistributionSummary,
  BehaviourTravellerRow,
} from '../api/types';
import { formatCurrency } from '../utils/formatters';

const defaultClient = createMockClient({ delay: 0 });
const PAGE_SIZE = 10;

const TABLE_COLUMNS = [
  { key: 'travellerId', header: 'Traveller' },
  { key: 'archetype', header: 'Archetype' },
  { key: 'confidence', header: 'Confidence' },
  { key: 'fatigueLevel', header: 'Fatigue' },
  { key: 'driftStatus', header: 'Drift' },
  { key: 'revenueAtRisk', header: 'Revenue at Risk' },
  { key: 'recommendedChannel', header: 'Channel' },
];

interface Props {
  client?: MockClient;
}

export function BehaviourArchetypesPage({ client = defaultClient }: Props): React.JSX.Element {
  const [overview, setOverview] = useState<BehaviourOverviewSummary | null>(null);
  const [distribution, setDistribution] = useState<ArchetypeDistributionSummary | null>(null);
  const [travellers, setTravellers] = useState<BehaviourTravellerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [archetypeFilter, setArchetypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const [ovRes, distRes, travRes] = await Promise.all([
      client.getBehaviourOverview(),
      client.getBehaviourArchetypes(),
      client.getBehaviourTravellers({
        archetype: archetypeFilter || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    ]);
    if (!ovRes.success) {
      setError(ovRes.error.message);
      setLoading(false);
      return;
    }
    setOverview(ovRes.data);
    if (distRes.success) setDistribution(distRes.data);
    if (travRes.success) {
      setTravellers(travRes.data.items);
      setTotal(travRes.data.total);
    }
    setLoading(false);
  }, [client, page, archetypeFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!overview) return <ErrorState message="No data available" />;

  const rows = travellers.map((t) => ({
    ...t,
    revenueAtRisk: formatCurrency(t.revenueAtRisk),
    confidence: `${t.confidence}%`,
  }));

  return (
    <div>
      <PageHeader
        title="Traveller Archetypes"
        description="Archetype classification, confidence and revenue risk by behavioural pattern."
      />
      <div
        data-testid="kpi-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard title="Total Travellers" value={overview.totalTravellers} />
        <KpiCard title="Avg Confidence" value={`${overview.averageConfidence}%`} />
        <KpiCard title="Revenue At Risk" value={formatCurrency(45230)} variant="danger" />
        <KpiCard title="Active Recommendations" value={318} />
      </div>

      {distribution && (
        <div
          data-testid="archetype-distribution"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Archetype Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {distribution.distribution.map((d) => (
              <div key={d.archetype} className="text-center">
                <p className="text-lg font-bold text-slate-900">{d.count}</p>
                <p className="text-xs text-slate-500">{d.archetype.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-400">
                  {distribution.total > 0 ? Math.round((d.count / distribution.total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <select
          data-testid="archetype-filter"
          value={archetypeFilter}
          onChange={(e) => {
            setArchetypeFilter(e.target.value);
            setPage(1);
          }}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          aria-label="Filter by archetype"
        >
          <option value="">All archetypes</option>
          <option value="autopilot">Autopilot</option>
          <option value="procrastinator">Procrastinator</option>
          <option value="responsive">Responsive</option>
          <option value="nudge_needer">Nudge Needer</option>
          <option value="reluctant">Reluctant</option>
          <option value="chaotic">Chaotic</option>
          <option value="new_traveller">New Traveller</option>
        </select>
      </div>

      <div data-testid="traveller-table">
        <DataTable
          columns={TABLE_COLUMNS}
          rows={rows as unknown as Record<string, unknown>[]}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
