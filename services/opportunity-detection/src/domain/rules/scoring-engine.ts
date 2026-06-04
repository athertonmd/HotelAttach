/**
 * Opportunity Scoring Engine — BR-600
 * Calculates weighted score with corporate severity multipliers.
 * Source: Approved Business Rules Mapping, Scoring Refinements
 */

import { derivePriority } from '../enums.js';
import type { ScoringInput, ScoringResult, CorporateScoringPolicy } from './types.js';
import { DEFAULT_SCORING_POLICY } from './types.js';

/** Scoring component weights (BR-600) */
const WEIGHTS = {
  hotelRequirementConfidence: 0.25,
  complianceSeverity: 0.2,
  revenueOpportunity: 0.2,
  dutyOfCareImpact: 0.15,
  supplierContractImpact: 0.1,
  timeToDeparture: 0.1,
} as const;

/**
 * Calculate opportunity score with corporate multipliers.
 * Each component is capped at 100 after multiplier application before weighting.
 */
export function calculateScore(
  input: ScoringInput,
  policy: Partial<CorporateScoringPolicy> = {},
  ruleIdsApplied: string[] = [],
): ScoringResult {
  const multipliers = {
    complianceSeverityMultiplier:
      policy.complianceSeverityMultiplier ?? DEFAULT_SCORING_POLICY.complianceSeverityMultiplier,
    supplierContractMultiplier:
      policy.supplierContractMultiplier ?? DEFAULT_SCORING_POLICY.supplierContractMultiplier,
    dutyOfCareMultiplier:
      policy.dutyOfCareMultiplier ?? DEFAULT_SCORING_POLICY.dutyOfCareMultiplier,
    revenueMultiplier: policy.revenueMultiplier ?? DEFAULT_SCORING_POLICY.revenueMultiplier,
  };

  const threshold =
    policy.minimumCreationThreshold ?? DEFAULT_SCORING_POLICY.minimumCreationThreshold;
  const engagementThreshold =
    policy.engagementEligibilityThreshold ?? DEFAULT_SCORING_POLICY.engagementEligibilityThreshold;

  // Apply multipliers and cap each component at 100
  const adjustedCompliance = Math.min(
    100,
    input.complianceSeverity * multipliers.complianceSeverityMultiplier,
  );
  const adjustedRevenue = Math.min(100, input.revenueOpportunity * multipliers.revenueMultiplier);
  const adjustedDutyOfCare = Math.min(
    100,
    input.dutyOfCareImpact * multipliers.dutyOfCareMultiplier,
  );
  const adjustedSupplier = Math.min(
    100,
    input.supplierContractImpact * multipliers.supplierContractMultiplier,
  );

  // Weighted sum capped at 100
  const totalScore = Math.min(
    100,
    Math.round(
      input.hotelRequirementConfidence * WEIGHTS.hotelRequirementConfidence +
        adjustedCompliance * WEIGHTS.complianceSeverity +
        adjustedRevenue * WEIGHTS.revenueOpportunity +
        adjustedDutyOfCare * WEIGHTS.dutyOfCareImpact +
        adjustedSupplier * WEIGHTS.supplierContractImpact +
        input.timeToDeparture * WEIGHTS.timeToDeparture,
    ),
  );

  const priority = derivePriority(totalScore);
  const eligible = totalScore >= threshold;
  const engagementEligible = totalScore >= engagementThreshold;

  return {
    totalScore,
    priority,
    eligible,
    engagementEligible,
    components: input,
    ruleIdsApplied,
  };
}

/**
 * Calculate time-to-departure score.
 * BR-906: ≤2 days = 100 (immediate escalation)
 */
export function calculateTimeToDepartureScore(daysUntilDeparture: number): number {
  if (daysUntilDeparture <= 2) return 100; // BR-906
  if (daysUntilDeparture <= 7) return 80;
  if (daysUntilDeparture <= 14) return 60;
  if (daysUntilDeparture <= 30) return 40;
  return 20;
}

/**
 * Calculate hotel requirement confidence.
 * Based on BR-101–108.
 */
export function calculateHotelRequirementConfidence(context: {
  tripDurationHours?: number;
  isMultiDay?: boolean;
  isInternational?: boolean;
  arrivalHour?: number;
  departureHour?: number;
}): number {
  // BR-101: same day return
  if (
    context.tripDurationHours !== undefined &&
    context.tripDurationHours <= 24 &&
    !context.isMultiDay
  ) {
    return 0;
  }
  // BR-106: International multi-day
  if (context.isInternational && context.isMultiDay) return 95;
  // BR-102: > 24 hours
  if (context.tripDurationHours !== undefined && context.tripDurationHours > 24) return 90;
  // BR-103: multi-day
  if (context.isMultiDay) return 90;
  // BR-104/BR-105: late arrival / early departure
  if (context.arrivalHour !== undefined && context.arrivalHour >= 22) return 75;
  if (context.departureHour !== undefined && context.departureHour < 7) return 75;
  // Unknown
  return 50;
}

/**
 * Calculate duty of care impact score.
 * BR-701–704
 */
export function calculateDutyOfCareScore(
  accommodationStatus: 'known' | 'partial' | 'unknown',
  destinationRisk: 'standard' | 'elevated' | 'high' | 'critical' = 'standard',
): number {
  let base = 0;
  if (accommodationStatus === 'unknown')
    base = 80; // BR-703
  else if (accommodationStatus === 'partial') base = 40; // BR-702
  // BR-701: known = 0

  // BR-704: high risk destination modifier
  if (destinationRisk === 'high' || destinationRisk === 'critical') {
    base = Math.min(100, base + 20);
  }

  return base;
}

/**
 * Calculate supplier contract impact score.
 * BR-801–803
 */
export function calculateSupplierContractScore(riskLevel: 'high' | 'watch' | 'on_track'): number {
  if (riskLevel === 'high') return 90; // BR-801
  if (riskLevel === 'watch') return 60; // BR-802
  return 0; // BR-803
}

/**
 * Calculate revenue opportunity score.
 * Maps estimated commission to 0–100 scale.
 */
export function calculateRevenueScore(estimatedCommission: number): number {
  if (estimatedCommission >= 200) return 100;
  if (estimatedCommission >= 100) return 75;
  if (estimatedCommission >= 50) return 50;
  if (estimatedCommission > 0) return 25;
  return 0;
}
