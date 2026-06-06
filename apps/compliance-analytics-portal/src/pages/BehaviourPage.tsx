import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type {
  BehaviourOverviewSummary,
  FatigueSummary,
  RevenueRiskSummary,
  ActionPerformanceSummary,
} from '../api/types';
import { formatCurrency } from '../utils/formatters';

const defaultClient = createMockClient({ delay: 0 });

interface BehaviourPageProps {
  client?: MockClient;
}

export function BehaviourPage({ client = defaultClient }: BehaviourPageProps): React.JSX.Element {
  const [overview, setOverview] = useState<BehaviourOverviewSummary | null>(null);
  const [fatigue, setFatigue] = useState<FatigueSummary | null>(null);
  const [revenueRisk, setRevenueRisk] = useState<RevenueRiskSummary | null>(null);
  const [actionPerf, setActionPerf] = useState<ActionPerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const [overviewRes, fatigueRes, riskRes, perfRes] = await Promise.all([
      client.getBehaviourOverview(),
      client.getBehaviourFatigue(),
      client.getBehaviourRevenueRisk(),
      client.getBehaviourActionPerformance(),
    ]);

    if (!overviewRes.success) {
      setError(overviewRes.error.message);
      setLoading(false);
      return;
    }

    setOverview(overviewRes.data);
    if (fatigueRes.success) setFatigue(fatigueRes.data);
    if (riskRes.success) setRevenueRisk(riskRes.data);
    if (perfRes.success) setActionPerf(perfRes.data);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!overview) return <ErrorState message="No behaviour data available" />;

  return (
    <div>
      <PageHeader
        title="Behaviour Intelligence"
        description="Understand traveller booking behaviour, communication fatigue, revenue risk and recommendation performance."
      />

      <div
        data-testid="kpi-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
      >
        <KpiCard title="Travellers Analysed" value={overview.totalTravellers} />
        <KpiCard title="Avg Confidence" value={`${overview.averageConfidence}%`} />
        <KpiCard title="High Fatigue" value={overview.highFatigueCount} variant="warning" />
        <KpiCard
          title="Significant Drift"
          value={overview.significantDriftCount}
          variant="danger"
        />
        <KpiCard
          title="Revenue at Risk"
          value={revenueRisk ? formatCurrency(revenueRisk.totalRevenueAtRisk) : '—'}
          variant="danger"
        />
        <KpiCard
          title="Prediction Accuracy"
          value={actionPerf ? `${actionPerf.overallAccuracy}%` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          data-testid="archetype-distribution"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Archetype Distribution</h3>
          <div className="space-y-2">
            {Object.entries(overview.archetypeDistribution).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-slate-700">{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          data-testid="segment-distribution"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Segment Distribution</h3>
          <div className="space-y-2">
            {Object.entries(overview.segmentDistribution).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{key.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-slate-700">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {fatigue && (
          <div
            data-testid="fatigue-distribution"
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Fatigue Distribution</h3>
            <div className="space-y-2">
              {Object.entries(fatigue.distribution).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{level}</span>
                  <span className="text-sm font-medium text-slate-700">{count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Total suppressions: {fatigue.totalSuppressions}
            </p>
          </div>
        )}

        {revenueRisk && (
          <div
            data-testid="revenue-risk-section"
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Top Revenue at Risk Travellers
            </h3>
            <div className="space-y-2">
              {revenueRisk.highestRiskTravellers.slice(0, 5).map((t) => (
                <div key={t.travellerId} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 font-mono">{t.travellerId}</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(t.revenueAtRisk)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {actionPerf && (
        <div
          data-testid="action-performance"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Recommendation Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {actionPerf.actions.map((a) => (
              <div key={a.action} className="text-center">
                <p className="text-lg font-bold text-slate-900">{a.accuracyRate}%</p>
                <p className="text-xs text-slate-500">{a.action.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-400">{a.totalRecommended} recs</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
