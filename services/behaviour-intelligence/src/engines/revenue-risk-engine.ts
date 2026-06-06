/**
 * RevenueRiskEngine — Calculates revenue at risk with urgency weighting.
 * Pure computation: accepts commission + likelihood + timing, returns risk assessment.
 * Source: BR-1701–BR-1708
 */

import { deriveRiskTier } from '../domain/index.js';
import type { RevenueRiskEngineInput, RevenueRiskEngineResult } from './types.js';

/**
 * Calculate urgency factor based on days to departure.
 * Closer departure = higher urgency (0–1 scale).
 * 0 days = 1.0, 30+ days = 0.1
 */
function calculateUrgencyFactor(daysToDeparture?: number): number {
  if (daysToDeparture === undefined) return 0.5; // neutral when unknown
  if (daysToDeparture <= 0) return 1.0;
  if (daysToDeparture <= 3) return 0.95;
  if (daysToDeparture <= 7) return 0.8;
  if (daysToDeparture <= 14) return 0.6;
  if (daysToDeparture <= 30) return 0.3;
  return 0.1;
}

/**
 * Execute the revenue risk engine.
 * Calculates base revenue at risk and applies urgency weighting.
 */
export function computeRevenueRisk(input: RevenueRiskEngineInput): RevenueRiskEngineResult {
  // BR-1707: Commission must be >= 0
  if (input.estimatedCommission < 0) {
    throw new Error('estimatedCommission must be >= 0 (BR-1707)');
  }

  // BR-1708: Clamp likelihood 0–100
  const attachmentLikelihood = Math.min(100, Math.max(0, input.attachmentLikelihood));

  // BR-1701: Revenue at risk = commission × (1 - likelihood/100)
  const revenueAtRisk = Math.round(input.estimatedCommission * (1 - attachmentLikelihood / 100));

  // BR-1702–BR-1706: Risk tier
  const riskTier = deriveRiskTier(attachmentLikelihood);

  // Urgency factor based on proximity to departure
  const urgencyFactor = calculateUrgencyFactor(input.daysToDeparture);

  // Weighted risk = base risk × urgency
  const weightedRisk = Math.round(revenueAtRisk * urgencyFactor);

  return {
    estimatedCommission: input.estimatedCommission,
    attachmentLikelihood,
    revenueAtRisk,
    riskTier,
    urgencyFactor,
    weightedRisk,
  };
}
