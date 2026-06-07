import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type {
  HotelAttachmentSummary,
  HotelAttachmentCurveResponse,
  HotelAttachmentCorporatesResponse,
  HotelAttachmentDelayResponse,
} from '../api/types';
import { formatCurrency } from '../utils/formatters';

const defaultClient = createMockClient({ delay: 0 });

interface Props {
  client?: MockClient;
}

export function HotelAttachmentPage({ client = defaultClient }: Props): React.JSX.Element {
  const [summary, setSummary] = useState<HotelAttachmentSummary | null>(null);
  const [curve, setCurve] = useState<HotelAttachmentCurveResponse | null>(null);
  const [corporates, setCorporates] = useState<HotelAttachmentCorporatesResponse | null>(null);
  const [delay, setDelay] = useState<HotelAttachmentDelayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const [sRes, cRes, corpRes, dRes] = await Promise.all([
      client.getHotelAttachmentSummary(),
      client.getHotelAttachmentCurve(),
      client.getHotelAttachmentCorporates(),
      client.getHotelAttachmentDelay(),
    ]);
    if (!sRes.success) {
      setError(sRes.error.message);
      setLoading(false);
      return;
    }
    setSummary(sRes.data);
    if (cRes.success) setCurve(cRes.data);
    if (corpRes.success) setCorporates(corpRes.data);
    if (dRes.success) setDelay(dRes.data);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!summary) return <ErrorState message="No attachment data available" />;

  return (
    <div>
      <PageHeader
        title="Hotel Attachment Analytics"
        description="Track hotel booking attachment rates, identify gaps, and measure the impact of compliance interventions."
      />

      <div
        data-testid="kpi-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8"
      >
        <KpiCard title="Current Rate" value={`${summary.currentRate}%`} />
        <KpiCard title="Target Rate" value={`${summary.targetRate}%`} />
        <KpiCard title="Attachment Gap" value={`${summary.attachmentGap}%`} variant="warning" />
        <KpiCard title="Pending Assessment" value={summary.pendingAssessmentCount} />
        <KpiCard title="Avg Delay" value={`${summary.avgAttachmentDelayDays}d`} />
        <KpiCard
          title="Revenue Impact"
          value={formatCurrency(summary.estimatedRevenueImpact)}
          variant="danger"
        />
      </div>

      {curve && (
        <div
          data-testid="attachment-curve"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Attachment Curve — Rate by Days Before Departure
          </h3>
          <div className="flex items-end gap-1 h-40">
            {curve.curve.map((pt) => (
              <div
                key={pt.daysBefore}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <span className="text-xs font-bold text-slate-700 mb-1">{pt.rate}%</span>
                <div className="w-full bg-blue-400 rounded-t" style={{ height: `${pt.rate}%` }} />
                <span className="text-xs text-slate-400 mt-1 truncate w-full text-center">
                  {pt.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {corporates && (
        <div
          data-testid="corporate-comparison"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Corporate Attachment Comparison
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2 px-2">Corporate</th>
                <th className="py-2 px-2">Rate</th>
                <th className="py-2 px-2">Target</th>
                <th className="py-2 px-2">Gap</th>
                <th className="py-2 px-2">Trend</th>
              </tr>
            </thead>
            <tbody>
              {corporates.corporates.map((c) => (
                <tr key={c.corporateId} className="border-b">
                  <td className="py-2 px-2">{c.corporateName}</td>
                  <td className="py-2 px-2 font-medium">{c.attachmentRate}%</td>
                  <td className="py-2 px-2 text-slate-500">{c.target}%</td>
                  <td
                    className={`py-2 px-2 font-medium ${c.gap > 0 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {c.gap > 0 ? `+${c.gap}` : c.gap}%
                  </td>
                  <td className="py-2 px-2">
                    {c.trend === 'improving' ? '📈' : c.trend === 'declining' ? '📉' : '➡️'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {delay && (
        <div
          data-testid="delay-distribution"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Attachment Delay Distribution
          </h3>
          <div className="space-y-2">
            {delay.distribution.map((d) => (
              <div key={d.band} className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-500">{d.band}</span>
                <div className="flex-1 bg-slate-100 rounded h-5 overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded"
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 w-12 text-right">
                  {d.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        data-testid="pending-assessment-info"
        className="bg-amber-50 border border-amber-200 rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-amber-800 mb-2">
          Pending Assessment — Grace Period
        </h3>
        <p className="text-sm text-amber-700">
          {summary.pendingAssessmentCount} trips are currently inside the 24-hour assessment grace
          period. These trips are excluded from active opportunity counts and communication
          triggers. Travellers frequently book hotels within hours of creating their trip — the
          grace period prevents premature outreach and false-positive opportunities.
        </p>
      </div>
    </div>
  );
}
