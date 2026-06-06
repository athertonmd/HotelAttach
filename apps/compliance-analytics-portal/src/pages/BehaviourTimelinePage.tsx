import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { KpiCard } from '../components/KpiCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { createMockClient } from '../api/mock-client';
import type { MockClient } from '../api/mock-client';
import type { BehaviourTimelineResponse, TravellerTimelineEntry } from '../api/types';

const defaultClient = createMockClient({ delay: 0 });

interface Props {
  client?: MockClient;
}

export function BehaviourTimelinePage({ client = defaultClient }: Props): React.JSX.Element {
  const [data, setData] = useState<BehaviourTimelineResponse | null>(null);
  const [selectedTraveller, setSelectedTraveller] = useState<TravellerTimelineEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    const res = await client.getBehaviourTimeline();
    if (!res.success) {
      setError(res.error.message);
      setLoading(false);
      return;
    }
    setData(res.data);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <ErrorState message="No timeline data available" />;

  const { aggregate, travellers } = data;

  return (
    <div>
      <PageHeader
        title="Booking Behaviour Timeline"
        description="Understand when travellers book hotels relative to departure, and whether communications influence timing."
      />

      <div
        data-testid="kpi-section"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <KpiCard title="Avg Booking Lead" value={`${aggregate.avgBookingLeadDays} days`} />
        <KpiCard title="Avg Comm Lead" value={`${aggregate.avgCommunicationLeadDays} days`} />
        <KpiCard
          title="Comms Before Booking"
          value={aggregate.communicationsBeforeBooking.toFixed(1)}
        />
        <KpiCard
          title="Early Comms"
          value={`${aggregate.earlyCommPercentage}%`}
          variant="warning"
          subtitle="Sent before predicted window"
        />
      </div>

      <div
        data-testid="aggregate-timeline"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Aggregate Booking Timeline (Days Before Departure)
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <span className="inline-block w-3 h-3 rounded bg-blue-400" /> Trip Created
          <span className="ml-3 inline-block w-3 h-3 rounded bg-amber-400" /> Communication
          <span className="ml-3 inline-block w-3 h-3 rounded bg-green-400" /> Hotel Booked
          <span className="ml-3 inline-block w-3 h-3 rounded bg-red-400" /> Departure
        </div>
        <div className="relative h-8 bg-slate-100 rounded overflow-hidden">
          <div
            className="absolute h-full bg-blue-100 border-l-2 border-blue-400"
            style={{ left: '0%', width: '10%' }}
            title="Trip created (~30 days)"
          />
          <div
            className="absolute h-full bg-amber-100 border-l-2 border-amber-400"
            style={{
              left: `${100 - (aggregate.avgCommunicationLeadDays / 30) * 100}%`,
              width: '5%',
            }}
            title={`Avg comm ~${aggregate.avgCommunicationLeadDays} days before`}
          />
          <div
            className="absolute h-full bg-green-100 border-l-2 border-green-400"
            style={{ left: `${100 - (aggregate.avgBookingLeadDays / 30) * 100}%`, width: '5%' }}
            title={`Avg booking ~${aggregate.avgBookingLeadDays} days before`}
          />
          <div className="absolute right-0 h-full w-1 bg-red-400" title="Departure" />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>30 days before</span>
          <span>Departure</span>
        </div>
      </div>

      <div
        data-testid="communication-overlay"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Communication Timing Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">
              <strong>{aggregate.earlyCommPercentage}%</strong> of communications are sent before
              the traveller&apos;s predicted booking window.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              On average, {aggregate.communicationsBeforeBooking.toFixed(1)} communications are sent
              before a hotel booking occurs.
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600">
              Late-booking archetypes: <strong>{aggregate.lateBookerArchetypes.join(', ')}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              These archetypes book within 3 days of departure on average.
            </p>
          </div>
        </div>
      </div>

      <div
        data-testid="traveller-table"
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-8"
      >
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Traveller Timeline</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2 px-2">Traveller</th>
              <th className="py-2 px-2">Archetype</th>
              <th className="py-2 px-2">Avg Lead</th>
              <th className="py-2 px-2">Consistency</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {travellers.slice(0, 10).map((t) => (
              <tr
                key={t.travellerId}
                className="border-b hover:bg-slate-50 cursor-pointer"
                onClick={() => setSelectedTraveller(t)}
                data-testid={`row-${t.travellerId}`}
              >
                <td className="py-2 px-2 font-mono text-xs">{t.travellerId}</td>
                <td className="py-2 px-2">{t.archetype.replace(/_/g, ' ')}</td>
                <td className="py-2 px-2">{t.avgLeadTimeDays}d</td>
                <td className="py-2 px-2">{Math.round(t.consistency * 100)}%</td>
                <td className="py-2 px-2">
                  <button
                    className="text-blue-600 text-xs hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTraveller(t);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTraveller && (
        <div
          data-testid="traveller-detail"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Timeline: {selectedTraveller.travellerId} (
            {selectedTraveller.archetype.replace(/_/g, ' ')})
          </h3>
          <div className="space-y-2">
            {selectedTraveller.events.map((evt, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-right text-slate-400 text-xs">
                  {evt.daysBefore > 0 ? `-${evt.daysBefore}d` : 'Day 0'}
                </span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    evt.type === 'trip_created'
                      ? 'bg-blue-400'
                      : evt.type === 'communication_sent'
                        ? 'bg-amber-400'
                        : evt.type === 'hotel_booked'
                          ? 'bg-green-400'
                          : 'bg-red-400'
                  }`}
                />
                <span className="text-slate-700">{evt.label}</span>
                {evt.channel && <span className="text-xs text-slate-400">({evt.channel})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
