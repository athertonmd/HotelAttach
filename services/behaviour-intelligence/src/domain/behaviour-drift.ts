/**
 * BehaviourDrift — Tracks changes in traveller behaviour over time.
 * Source: BR-1501–BR-1508
 */

import type { DriftStatus, DriftDirection } from './enums.js';
import { deriveDriftStatus } from './enums.js';
import type { TravellerBehaviourProfile } from './traveller-behaviour-profile.js';

export interface BehaviourDrift {
  readonly travellerId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly driftScore: number;
  readonly stabilityScore: number;
  readonly driftStatus: DriftStatus;
  readonly driftDirection: DriftDirection;
  readonly detectedAt: Date;
}

export interface HistoricalBaseline {
  avgLeadTimeDays: number;
  bookingConsistency: number;
  complianceRate: number;
  selfBookingRate: number;
  avgResponseTimeHours: number;
}

/**
 * Calculate behaviour drift by comparing current profile to historical baseline.
 * BR-1501: Drift score = weighted sum of metric deviations (0–100)
 * BR-1502: Stability score = inverse of drift (100 - driftScore)
 * BR-1503: Stable if driftScore < 30
 * BR-1504: Moderate if driftScore 30–59
 * BR-1505: Significant if driftScore >= 60
 * BR-1506: Direction determined by whether key metrics improved or declined
 * BR-1507: Lead time weight = 30%, consistency = 25%, compliance = 20%, self-booking = 15%, response time = 10%
 * BR-1508: Minimum 3 trips required for meaningful drift
 */
export function calculateDrift(
  currentProfile: TravellerBehaviourProfile,
  historicalBaseline: HistoricalBaseline,
): BehaviourDrift {
  // BR-1508: Minimum 3 trips
  if (currentProfile.tripCountUsed < 3) {
    throw new Error('Drift calculation requires minimum 3 trips (BR-1508)');
  }

  // BR-1507: Calculate weighted deviations
  const leadTimeDelta = Math.abs(
    currentProfile.avgLeadTimeDays - historicalBaseline.avgLeadTimeDays,
  );
  const leadTimeNorm = Math.min(1, leadTimeDelta / Math.max(1, historicalBaseline.avgLeadTimeDays));

  const consistencyDelta = Math.abs(
    currentProfile.bookingConsistency - historicalBaseline.bookingConsistency,
  );
  const consistencyNorm = consistencyDelta; // already 0–1

  const complianceDelta = Math.abs(
    currentProfile.complianceRate - historicalBaseline.complianceRate,
  );
  const complianceNorm = complianceDelta / 100;

  const selfBookingDelta = Math.abs(
    currentProfile.selfBookingRate - historicalBaseline.selfBookingRate,
  );
  const selfBookingNorm = selfBookingDelta / 100;

  const responseTimeDelta = Math.abs(
    currentProfile.avgResponseTimeHours - historicalBaseline.avgResponseTimeHours,
  );
  const responseTimeNorm = Math.min(
    1,
    responseTimeDelta / Math.max(1, historicalBaseline.avgResponseTimeHours),
  );

  // BR-1501: Weighted drift score
  const rawDrift =
    leadTimeNorm * 30 +
    consistencyNorm * 25 +
    complianceNorm * 20 +
    selfBookingNorm * 15 +
    responseTimeNorm * 10;

  const driftScore = Math.min(100, Math.max(0, Math.round(rawDrift)));

  // BR-1502: Stability = inverse
  const stabilityScore = 100 - driftScore;

  // BR-1503–BR-1505: Status
  const driftStatus = deriveDriftStatus(driftScore);

  // BR-1506: Direction
  const driftDirection = determineDriftDirection(currentProfile, historicalBaseline);

  return {
    travellerId: currentProfile.travellerId,
    tenantId: currentProfile.tenantId,
    corporateId: currentProfile.corporateId,
    driftScore,
    stabilityScore,
    driftStatus,
    driftDirection,
    detectedAt: new Date(),
  };
}

/**
 * Determine whether behaviour is improving or declining.
 * Improving: higher compliance, higher consistency, higher self-booking
 * Declining: lower compliance, lower consistency, lower self-booking
 * Lateral: mixed signals
 */
function determineDriftDirection(
  current: TravellerBehaviourProfile,
  baseline: HistoricalBaseline,
): DriftDirection {
  let positiveSignals = 0;
  let negativeSignals = 0;

  if (current.complianceRate > baseline.complianceRate + 5) positiveSignals++;
  else if (current.complianceRate < baseline.complianceRate - 5) negativeSignals++;

  if (current.bookingConsistency > baseline.bookingConsistency + 0.05) positiveSignals++;
  else if (current.bookingConsistency < baseline.bookingConsistency - 0.05) negativeSignals++;

  if (current.selfBookingRate > baseline.selfBookingRate + 5) positiveSignals++;
  else if (current.selfBookingRate < baseline.selfBookingRate - 5) negativeSignals++;

  if (current.avgResponseTimeHours < baseline.avgResponseTimeHours - 2) positiveSignals++;
  else if (current.avgResponseTimeHours > baseline.avgResponseTimeHours + 2) negativeSignals++;

  if (positiveSignals > negativeSignals) return 'improving';
  if (negativeSignals > positiveSignals) return 'declining';
  return 'lateral';
}
