/**
 * BehaviourProfileEngine — Calculates traveller behaviour profile from raw trip data.
 * Pure computation: accepts raw data arrays, returns profile metrics.
 * Source: BR-1201–BR-1208
 */

import type { BehaviourSegment, BehaviourChannel } from '../domain/index.js';
import { createProfile } from '../domain/index.js';
import type { ProfileEngineInput, ProfileEngineResult } from './types.js';

/** Maximum trips to use in calculation (sliding window) */
const DEFAULT_MAX_TRIPS = 20;

/**
 * Calculate average of an array of numbers.
 */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation of an array of numbers.
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = average(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

/**
 * Calculate booking consistency as inverse of coefficient of variation.
 * High consistency = 1, low consistency = 0.
 * BR-1204: clamped 0–1
 */
function calculateConsistency(leadTimes: number[]): number {
  if (leadTimes.length < 2) return 0.5;
  const avg = average(leadTimes);
  if (avg === 0) return 0.5;
  const cv = standardDeviation(leadTimes) / avg;
  // Inverse: low CV = high consistency
  return Math.min(1, Math.max(0, 1 - cv));
}

/**
 * Determine preferred channel from usage frequency.
 */
function determinePreferredChannel(channels: BehaviourChannel[]): BehaviourChannel {
  if (channels.length === 0) return 'email';
  const counts = new Map<BehaviourChannel, number>();
  for (const ch of channels) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let maxChannel: BehaviourChannel = 'email';
  let maxCount = 0;
  for (const [channel, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxChannel = channel;
    }
  }
  return maxChannel;
}

/**
 * Determine behaviour segment from profile metrics.
 * BR-1205: Segment assignment rules
 */
function determineSegment(
  complianceRate: number,
  selfBookingRate: number,
  avgResponseTimeHours: number,
  bookingConsistency: number,
): BehaviourSegment {
  if (selfBookingRate >= 80 && complianceRate >= 90 && bookingConsistency > 0.8) {
    return 'self_sufficient';
  }
  if (complianceRate >= 70 && avgResponseTimeHours <= 24) {
    return 'reliable_late';
  }
  if (complianceRate >= 50 && avgResponseTimeHours > 24) {
    return 'needs_prompting';
  }
  if (complianceRate >= 30) {
    return 'requires_intervention';
  }
  return 'non_compliant';
}

/**
 * Calculate predicted lead time using weighted recent average.
 * More recent trips weighted higher.
 */
function predictLeadTime(leadTimes: number[]): number {
  if (leadTimes.length === 0) return 7; // default
  if (leadTimes.length === 1) return leadTimes[0] ?? 7;

  // Exponentially weighted: most recent gets highest weight
  let weightSum = 0;
  let valueSum = 0;
  for (let i = 0; i < leadTimes.length; i++) {
    const weight = i + 1; // newer entries have higher index
    const value = leadTimes[i] ?? 0;
    weightSum += weight;
    valueSum += value * weight;
  }
  return Math.round((valueSum / weightSum) * 10) / 10;
}

/**
 * Execute the profile engine computation.
 * Takes raw trip data and produces a complete behaviour profile.
 */
export function computeProfile(input: ProfileEngineInput): ProfileEngineResult {
  const maxTrips = input.maxTripsUsed ?? DEFAULT_MAX_TRIPS;

  // Use most recent trips up to maxTrips
  const tripCountUsed = Math.min(input.totalTrips, maxTrips);
  const leadTimes = input.leadTimesPerTrip.slice(-tripCountUsed);

  // Core metrics
  const avgLeadTimeDays = Math.round(average(leadTimes) * 10) / 10;
  const bookingConsistency = Math.round(calculateConsistency(leadTimes) * 100) / 100;
  const bookingVariabilityDays = Math.round(standardDeviation(leadTimes) * 10) / 10;

  // Compliance
  const complianceFlags = input.complianceFlags.slice(-tripCountUsed);
  const compliantCount = complianceFlags.filter(Boolean).length;
  const complianceRate =
    complianceFlags.length > 0 ? Math.round((compliantCount / complianceFlags.length) * 100) : 0;

  // Response time
  const responseTimes = input.responseTimesHours.slice(-tripCountUsed);
  const avgResponseTimeHours = Math.round(average(responseTimes) * 10) / 10;

  // Channel preference
  const preferredChannel = determinePreferredChannel(input.channelsUsed);

  // Self-booking rate
  const selfBookingRate =
    input.totalTrips > 0 ? Math.round((input.selfBookedCount / input.totalTrips) * 100) : 0;

  // Predicted lead time
  const predictedLeadTimeDays = predictLeadTime(leadTimes);

  // Segment
  const segment = determineSegment(
    complianceRate,
    selfBookingRate,
    avgResponseTimeHours,
    bookingConsistency,
  );

  // Use domain factory to get confidence score and validation
  const profile = createProfile({
    travellerId: input.travellerId,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    avgLeadTimeDays,
    bookingConsistency,
    bookingVariabilityDays,
    complianceRate,
    avgResponseTimeHours,
    preferredChannel,
    selfBookingRate,
    tripsAnalysed: input.totalTrips,
    tripCountUsed,
    predictedLeadTimeDays,
    segment,
  });

  return {
    avgLeadTimeDays: profile.avgLeadTimeDays,
    bookingConsistency: profile.bookingConsistency,
    bookingVariabilityDays: profile.bookingVariabilityDays,
    complianceRate: profile.complianceRate,
    avgResponseTimeHours: profile.avgResponseTimeHours,
    preferredChannel: profile.preferredChannel,
    selfBookingRate: profile.selfBookingRate,
    tripsAnalysed: profile.tripsAnalysed,
    tripCountUsed: profile.tripCountUsed,
    predictedLeadTimeDays: profile.predictedLeadTimeDays,
    confidenceScore: profile.confidenceScore,
    segment: profile.segment,
  };
}
