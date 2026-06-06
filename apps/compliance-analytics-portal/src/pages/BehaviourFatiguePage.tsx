import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { DataTable } from '../components/DataTable';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type { FatigueSummary, BehaviourTravellerRow } from '../api/types';
import { formatCurrency } from '../utils/formatters';

const defaultClient = createMockClient({ delay: 0 });
const PAGE_SIZE = 10;

const TABLE_COLUMNS = [
  { key: 'travellerId', header: 'Traveller' },
  { key: 'archetype', header: 'Archetype' },
  { key: 'fatigueLevel', header: 'Fatigue' },
  { key: 'suppressionCount', header: 'Suppressions' },
  { key: 'revenueAtRisk', header: 'Revenue at Risk' },
  { key: 'lastCommunication', header: 'Last Comm' },
  { key: 'recommendedAction', header: 'Action' },
];

interface Props {
  client?: MockClient;
}

export function BehaviourFatiguePage({ client = defaultClient }: Props): React.JSX.Element {
  const [fatigue, setFatigue] = useState<FatigueSummary | null>(null);
  const [travellers, setTravellers] = useState<BehaviourTravellerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [fatigueFilter, setFatigueFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const [fatRes, travRes] = await Promise.all([
      client.getBehaviourFatigue(),
      client.getBehaviourTravellers({
        fatigueLevel: fatigueFilter || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    ]);
    if (!fatRes.success) {
      setError(fatRes.error.message);
      setLoading(false);
      return;
    }
    setFatigue(fatRes.data);
    if (travRes.success) {
      setTravellers(travRes.data.items);
      setTotal(travRes.data.total);
    }
    setLoading(false);
  }, [client, page, fatigueFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!fatigue) return <ErrorState message="No fatigue data available" />;

  const rows = travellers.map((t) => ({
    ...t,
    revenueAtRisk: formatCurrency(t.revenueAtRisk),
    lastCommunication: new Date(t.lastCommunication).toLocaleDateString(),
  }));

  return (
    <div>
      <PageHeader
        title="Communication Fatigue"
        description="Monitor traveller fatigue levels, suppression activity, and identify over-communicated travellers."
      />
      <div
        data-testid="kpi-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard title="Low Fatigue" value={fatigue.distribution['low'] ?? 0} />
        <KpiCard
          title="Medium Fatigue"
          value={fatigue.distribution['medium'] ?? 0}
          variant="warning"
        />
        <KpiCard title="High Fatigue" value={fatigue.distribution['high'] ?? 0} variant="danger" />
        <KpiCard
          title="Critical Fatigue"
          value={fatigue.distribution['critical'] ?? 0}
          variant="danger"
        />
      </div>

      <div
        data-testid="suppression-summary"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Suppression Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900">{fatigue.totalSuppressions}</p>
            <p className="text-xs text-slate-500">Total Suppressions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {fatigue.highCriticalTravellers.length}
            </p>
            <p className="text-xs text-slate-500">High/Critical Travellers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {fatigue.totalSuppressions > 0
                ? Math.round((fatigue.totalSuppressions / 247) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-slate-500">Suppression Rate</p>
          </div>
        </div>
      </div>

      <div
        data-testid="fatigue-distribution"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Fatigue Distribution</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          {Object.entries(fatigue.distribution).map(([level, count]) => (
            <div key={level}>
              <p className="text-xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 capitalize">{level}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <select
          data-testid="fatigue-filter"
          value={fatigueFilter}
          onChange={(e) => {
            setFatigueFilter(e.target.value);
            setPage(1);
          }}
          className="border border-slate-300 rounded px-3 py-1.5 text-sm"
          aria-label="Filter by fatigue level"
        >
          <option value="">All levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
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
