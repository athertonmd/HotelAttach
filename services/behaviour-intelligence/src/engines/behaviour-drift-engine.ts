/**
 * BehaviourDriftEngine — Detects changes in traveller behaviour over time.
 * Pure computation: compares current metrics to historical baseline.
 * Source: BR-1501–BR-1508
 */

import { deriveDriftStatus } from '../domain/index.js';
import type { DriftDirection } from '../domain/index.js';
import type { DriftEngineInput, DriftEngineResult } from './types.js';

/** Metric weights per BR-1507 */
const WEIGHTS = {
  leadTime: 0.3,
  consistency: 0.25,
  compliance: 0.2,
  selfBooking: 0.15,
  responseTime: 0.1,
} as const;

/**
 * Determine drift direction from metric comparisons.
 * BR-1506: Improving if key metrics got better, declining if worse, lateral if mixed.
 */
function determineDriftDirection(
  current: DriftEngineInput['current'],
  baseline: DriftEngineInput['baseline'],
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

/**
 * Execute the behaviour drift engine.
 * Calculates drift score by comparing current profile to historical baseline.
 */
export function computeDrift(input: DriftEngineInput): DriftEngineResult {
  // BR-1508: Minimum 3 trips
  if (input.current.tripCountUsed < 3) {
    throw new Error('Drift calculation requires minimum 3 trips (BR-1508)');
  }

  const { current, baseline } = input;

  // BR-1507: Normalised deviations per metric
  const leadTimeDelta = Math.abs(current.avgLeadTimeDays - baseline.avgLeadTimeDays);
  const leadTimeNorm = Math.min(1, leadTimeDelta / Math.max(1, baseline.avgLeadTimeDays));

  const consistencyDelta = Math.abs(current.bookingConsistency - baseline.bookingConsistency);
  const consistencyNorm = consistencyDelta; // already 0–1

  const complianceDelta = Math.abs(current.complianceRate - baseline.complianceRate);
  const complianceNorm = complianceDelta / 100;

  const selfBookingDelta = Math.abs(current.selfBookingRate - baseline.selfBookingRate);
  const selfBookingNorm = selfBookingDelta / 100;

  const responseTimeDelta = Math.abs(current.avgResponseTimeHours - baseline.avgResponseTimeHours);
  const responseTimeNorm = Math.min(
    1,
    responseTimeDelta / Math.max(1, baseline.avgResponseTimeHours),
  );

  // BR-1501: Weighted drift score
  const rawDrift =
    leadTimeNorm * (WEIGHTS.leadTime * 100) +
    consistencyNorm * (WEIGHTS.consistency * 100) +
    complianceNorm * (WEIGHTS.compliance * 100) +
    selfBookingNorm * (WEIGHTS.selfBooking * 100) +
    responseTimeNorm * (WEIGHTS.responseTime * 100);

  const driftScore = Math.min(100, Math.max(0, Math.round(rawDrift)));

  // BR-1502: Stability = inverse
  const stabilityScore = 100 - driftScore;

  // BR-1503–BR-1505: Status
  const driftStatus = deriveDriftStatus(driftScore);

  // BR-1506: Direction
  const driftDirection = determineDriftDirection(current, baseline);

  return {
    driftScore,
    stabilityScore,
    driftStatus,
    driftDirection,
  };
}
