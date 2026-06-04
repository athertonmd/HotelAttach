/**
 * Engagement Funnel Projector
 * Handles: CommunicationSent, TravellerResponded, BookingRequestCreated
 *
 * Aggregates engagement metrics into weekly buckets for funnel analysis.
 * Uses Monday of event week as the period start date.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';
import type { ProjectorDeps, ProjectionResult } from './types.js';

const PROJECTOR_NAME = 'engagement-funnel';

const VALID_TYPES = ['CommunicationSent', 'TravellerResponded', 'BookingRequestCreated'] as const;

/** Get Monday 00:00 UTC for the week containing the given date */
function getWeekStart(dateStr: string): Date {
  const date = new Date(dateStr);
  const day = date.getUTCDay();
  // Sunday = 0, Monday = 1 ... Saturday = 6
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export async function projectEngagementFunnel(
  event: HCIEventEnvelope,
  deps: ProjectorDeps,
): Promise<ProjectionResult> {
  if (!VALID_TYPES.includes(event.eventType as (typeof VALID_TYPES)[number])) {
    return { processed: false, projectorName: PROJECTOR_NAME };
  }

  const tenantId = event.tenantId;
  const corporateId = event.corporateId;
  const periodStart = getWeekStart(event.timestamp);

  // Read current counts for this period
  const existing = await deps.engagementRepo.findByPeriod(tenantId, periodStart);
  const current = existing.find((r) => r['corporateId'] === corporateId);

  const communicationsSent =
    ((current?.['communicationsSent'] as number) ?? 0) +
    (event.eventType === 'CommunicationSent' ? 1 : 0);
  const responsesReceived =
    ((current?.['responsesReceived'] as number) ?? 0) +
    (event.eventType === 'TravellerResponded' ? 1 : 0);
  const bookingRequests =
    ((current?.['bookingRequests'] as number) ?? 0) +
    (event.eventType === 'BookingRequestCreated' ? 1 : 0);

  const data: Record<string, unknown> = {
    communicationsSent,
    responsesReceived,
    bookingRequests,
    lastUpdatedAt: event.timestamp,
  };

  await deps.engagementRepo.upsert(tenantId, corporateId, periodStart, data);
  await deps.checkpointRepo.updateCheckpoint(
    PROJECTOR_NAME,
    event.eventId,
    new Date(event.timestamp),
  );

  return { processed: true, projectorName: PROJECTOR_NAME };
}
