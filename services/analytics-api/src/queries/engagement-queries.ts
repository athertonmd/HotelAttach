/**
 * Query service functions for the Engagement Funnel dashboard.
 * Aggregates communication and conversion metrics for a given period.
 */

import type { EngagementFunnelRepository } from '../repositories/interfaces.js';

export interface EngagementSummary {
  communicationsSent: number;
  responsesReceived: number;
  bookingsCreated: number;
  responseRate: number; // percentage 0-100
  conversionRate: number; // percentage 0-100
}

export async function getEngagementSummary(
  tenantId: string,
  periodStart: Date,
  repo: EngagementFunnelRepository,
): Promise<EngagementSummary> {
  const rows = await repo.findByPeriod(tenantId, periodStart);

  let totalSent = 0;
  let totalResponses = 0;
  let totalBookings = 0;

  for (const row of rows) {
    totalSent += (row['communicationsSent'] as number) ?? 0;
    totalResponses += (row['responsesReceived'] as number) ?? 0;
    totalBookings += (row['bookingRequests'] as number) ?? 0;
  }

  const responseRate = totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0;
  const conversionRate = totalSent > 0 ? Math.round((totalBookings / totalSent) * 100) : 0;

  return {
    communicationsSent: totalSent,
    responsesReceived: totalResponses,
    bookingsCreated: totalBookings,
    responseRate,
    conversionRate,
  };
}
